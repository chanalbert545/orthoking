import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const promotionFieldsSchema = z.object({
  productId: z.string().uuid().optional(),
  productIds: z.array(z.string().uuid()).optional(),
  allProducts: z.boolean().default(false),
  categoryId: z.string().uuid().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
  variantId: z.string().uuid().optional().nullable(),
  name: z.string().optional(),
  discountType: z.enum(["percent", "amount"]),
  percent: z.number().int().min(0).max(100).optional(),
  amountUgx: z.number().int().min(0).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
});

const createPromotionSchema = promotionFieldsSchema.refine((promotion) => {
  const scopeCount = Number(promotion.allProducts) + Number(Boolean(promotion.categoryIds?.length || promotion.categoryId)) + Number(Boolean(promotion.productIds?.length || promotion.productId));
  return scopeCount === 1;
}, {
  message: "Choose products, a category, or all products",
  path: ["productIds"],
});

const updatePromotionSchema = promotionFieldsSchema.partial();
const timerSchema = z.object({
  endsAt: z.string().datetime(),
});

// Get all promotions
export async function listPromotions(req, res, next) {
  try {
    const { page = 1, limit = 20, active, productId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (active === "true") {
      where.isActive = true;
      where.startsAt = { lte: new Date() };
      where.endsAt = { gte: new Date() };
    }

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true } });
      where.OR = [
        { productId, categoryId: null },
        { productIds: { has: productId } },
        { allProducts: true },
        { category: { products: { some: { id: productId } } } },
      ];
      if (product?.categoryId) where.OR.push({ categoryIds: { has: product.categoryId } });
    }

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: {
          product: true,
          category: true,
          variant: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { startsAt: "desc" },
      }),
      prisma.promotion.count({ where }),
    ]);

    res.json({
      promotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get single promotion
export async function getPromotion(req, res, next) {
  try {
    const { id } = req.params;

    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        product: true,
        category: true,
        variant: true,
      },
    });

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    res.json(promotion);
  } catch (error) {
    next(error);
  }
}

// Create promotion
export async function createPromotion(req, res, next) {
  try {
    const validated = createPromotionSchema.parse(req.body);

    // Validate discount values
    if (validated.discountType === "percent" && !validated.percent) {
      return res
        .status(400)
        .json({ error: "Percent is required for percent discounts" });
    }

    if (validated.discountType === "amount" && !validated.amountUgx) {
      return res
        .status(400)
        .json({ error: "Amount is required for amount discounts" });
    }

    let productIds;
    const categoryIds = [...new Set(validated.categoryIds?.length ? validated.categoryIds : validated.categoryId ? [validated.categoryId] : [])];
    if (validated.allProducts) {
      productIds = (await prisma.product.findMany({ where: { isActive: true }, select: { id: true } })).map((product) => product.id);
    } else if (categoryIds.length) {
      const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } });
      if (categories.length !== categoryIds.length) return res.status(404).json({ error: "One or more categories were not found" });
      productIds = (await prisma.product.findMany({ where: { categoryId: { in: categoryIds }, isActive: true }, select: { id: true } })).map((product) => product.id);
    } else {
      productIds = [...new Set(validated.productIds?.length ? validated.productIds : [validated.productId])];
    }
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
    if ((!categoryIds.length && !validated.allProducts && !productIds.length) || products.length !== productIds.length) {
      return res.status(400).json({ error: "One or more selected products were not found" });
    }

    // Verify variant exists if specified
    if (validated.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: validated.variantId },
      });

      if (!variant || !productIds.includes(variant.productId)) {
        return res.status(400).json({ error: "Choose a variant belonging to a selected product" });
      }
    }

    const promotion = await prisma.promotion.create({
      data: {
        ...validated,
        productId: categoryIds.length || validated.allProducts ? null : productIds[0] ?? null,
        productIds: categoryIds.length ? [] : productIds,
        categoryId: categoryIds.length === 1 ? categoryIds[0] : null,
        categoryIds,
        allProducts: validated.allProducts,
      },
      include: {
        product: true,
        category: true,
        variant: true,
      },
    });

    res.status(201).json(promotion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
}

// Update promotion
export async function updatePromotion(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updatePromotionSchema.parse(req.body);
    const existingPromotion = await prisma.promotion.findUnique({ where: { id } });
    if (!existingPromotion) return res.status(404).json({ error: "Promotion not found" });

    const scopeChanged = ["allProducts", "categoryIds", "categoryId", "productIds", "productId"].some((field) => field in validated);
    const allProducts = validated.allProducts ?? existingPromotion.allProducts;
    const categoryIds = validated.categoryIds !== undefined
      ? [...new Set(validated.categoryIds)]
      : validated.categoryId !== undefined
        ? validated.categoryId ? [validated.categoryId] : []
        : existingPromotion.categoryIds?.length ? existingPromotion.categoryIds : existingPromotion.categoryId ? [existingPromotion.categoryId] : [];
    let selectedProductIds;
    if (allProducts) {
      selectedProductIds = (await prisma.product.findMany({ where: { isActive: true }, select: { id: true } })).map((product) => product.id);
    } else if (categoryIds.length) {
      const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } });
      if (categories.length !== categoryIds.length) return res.status(404).json({ error: "One or more categories were not found" });
      selectedProductIds = (await prisma.product.findMany({ where: { categoryId: { in: categoryIds }, isActive: true }, select: { id: true } })).map((product) => product.id);
    } else if (validated.productIds?.length) {
      selectedProductIds = [...new Set(validated.productIds)];
    } else if (validated.productId) {
      selectedProductIds = [validated.productId];
    } else if (scopeChanged) {
      return res.status(400).json({ error: "Choose one or more products, a category, or all products" });
    } else {
      selectedProductIds = existingPromotion.productIds.length ? existingPromotion.productIds : [existingPromotion.productId];
    }
    const products = await prisma.product.findMany({ where: { id: { in: selectedProductIds } }, select: { id: true } });
    if ((!categoryIds.length && !allProducts && !selectedProductIds.length) || products.length !== selectedProductIds.length) {
      return res.status(400).json({ error: "One or more selected products were not found" });
    }

    // Verify variant if being changed
    if (validated.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: validated.variantId },
      });

      if (!variant || !selectedProductIds.includes(variant.productId)) {
        return res.status(400).json({ error: "Choose a variant belonging to a selected product" });
      }
    }

    const data = { ...validated };
    if (scopeChanged) {
      data.productId = categoryIds.length || allProducts ? null : selectedProductIds[0] ?? null;
      data.productIds = categoryIds.length || allProducts ? [] : selectedProductIds;
      data.allProducts = allProducts;
      data.categoryId = categoryIds.length === 1 ? categoryIds[0] : null;
      data.categoryIds = allProducts ? [] : categoryIds;
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data,
      include: {
        product: true,
        category: true,
        variant: true,
      },
    });

    res.json(promotion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Promotion not found" });
    }
    next(error);
  }
}

// Delete promotion
export async function deletePromotion(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.promotion.delete({
      where: { id },
    });

    res.json({ success: true, message: "Promotion deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Promotion not found" });
    }
    next(error);
  }
}

// Set one shared end time for every currently active promotion.
export async function updatePromotionTimer(req, res, next) {
  try {
    const { endsAt } = timerSchema.parse(req.body);
    const result = await prisma.promotion.updateMany({
      where: { isActive: true },
      data: { endsAt: new Date(endsAt) },
    });

    res.json({ updated: result.count, endsAt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
}
