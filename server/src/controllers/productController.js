import { prisma } from "../lib/prisma.js";
import { calculatePromotionPrice, findPromotionForVariant } from "../lib/promotionPricing.js";
import { z } from "zod";

const productDetailCache = new Map();
const productDetailCacheTtl = 30 * 1000;

async function addCurrentPromotionPrices(products) {
  if (products.length === 0) return products;

  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { startsAt: "desc" },
  });

  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => {
      const promotion = findPromotionForVariant(promotions, product, variant);
      const pricing = calculatePromotionPrice(variant, promotion);
      return {
        ...variant,
        ...pricing,
        promotion: promotion ? {
          id: promotion.id,
          name: promotion.name,
          discountType: promotion.discountType,
          percent: promotion.percent,
          amountUgx: promotion.amountUgx,
          endsAt: promotion.endsAt,
        } : null,
      };
    }),
  }));
}

function isHomeFurnitureProduct(product) {
  const categoryValues = [product.category?.name, product.category?.slug];
  const furnitureNameTerms = [
    "sofa",
    "night stand",
    "nightstand",
    "tv stand",
    "genuine leather",
    "vegan leather",
    "adjustable bed",
    " bed",
  ];
  const productName = product.name?.trim().toLowerCase() || "";

  return [...categoryValues, productName]
    .filter(Boolean)
    .some((value) => {
      const normalizedValue = value.trim().toLowerCase();
      return normalizedValue.includes("furniture") || furnitureNameTerms.some((term) => normalizedValue.includes(term));
    });
}

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const updateProductSchema = createProductSchema.partial();

const createVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  size: z.string().min(1, "Size is required"),
  thickness: z.string().min(1, "Thickness is required"),
  color: z.string().min(1, "Color is required"),
  regularPriceUgx: z.number().int().positive("Price must be positive"),
  formerPriceUgx: z.number().int().positive("Former price must be positive").optional().nullable(),
  stock: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateVariantSchema = createVariantSchema.partial();

// Get all products with filters and pagination
export async function listProducts(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      featured,
      active,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeTotal = "false",
      listing = "false",
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (featured === "true") where.isFeatured = true;
    if (active === "false") where.isActive = false;
    else if (active !== undefined) where.isActive = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          categoryId: true,
          name: true,
          slug: true,
          description: true,
          isFeatured: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            where: listing === "true" ? { isActive: true } : undefined,
            select: {
              id: true,
              sku: true,
              size: true,
              thickness: true,
              color: true,
              regularPriceUgx: true,
              formerPriceUgx: true,
              stock: true,
              isActive: true,
            },
          },
          images: {
            select: {
              id: true,
              publicUrl: true,
              altText: true,
              mimeType: true,
              sortOrder: true,
            },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
        ...(listing !== "true" && {
          skip,
          take: pageSize + 1,
        }),
        orderBy: {
          [sortBy]: sortOrder.toLowerCase(),
        },
      }),
      includeTotal === "true" ? prisma.product.count({ where }) : Promise.resolve(null),
    ]);

    const orderedProducts = listing === "true"
      ? [...products].sort((first, second) => {
        const firstIsHomeFurniture = isHomeFurnitureProduct(first);
        const secondIsHomeFurniture = isHomeFurnitureProduct(second);
        return Number(firstIsHomeFurniture) - Number(secondIsHomeFurniture);
      })
      : products;
    const hasMore = listing === "true"
      ? orderedProducts.length > pageNumber * pageSize
      : orderedProducts.length > pageSize;
    const pageProducts = listing === "true"
      ? orderedProducts.slice(skip, skip + pageSize)
      : hasMore ? orderedProducts.slice(0, pageSize) : orderedProducts;
    const pricedProducts = await addCurrentPromotionPrices(pageProducts);
    const pagination = {
      page: pageNumber,
      limit: pageSize,
      hasMore,
    };

    if (total !== null) {
      pagination.total = total;
      pagination.pages = Math.ceil(total / pageSize);
    }

    res.json({
      products: pricedProducts,
      pagination,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
}

// Get single product with all variants and images
export async function getProduct(req, res, next) {
  try {
    const { slug } = req.params;
    const cached = productDetailCache.get(slug);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.product);
    }

    if (cached) productDetailCache.delete(slug);

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            size: true,
            thickness: true,
            color: true,
            regularPriceUgx: true,
            formerPriceUgx: true,
            stock: true,
            isActive: true,
          },
        },
        images: {
          select: {
            id: true,
            publicUrl: true,
            altText: true,
            mimeType: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [pricedProduct] = await addCurrentPromotionPrices([product]);

    productDetailCache.set(slug, {
      product: pricedProduct,
      expiresAt: Date.now() + productDetailCacheTtl,
    });

    res.json(pricedProduct);
  } catch (error) {
    next(error);
  }
}

// Return current server-calculated prices for items already in a cart.
export async function getVariantPricing(req, res, next) {
  try {
    const variantIds = typeof req.query.variantIds === "string"
      ? req.query.variantIds.split(",").filter(Boolean)
      : [];
    const parsedIds = z.array(z.string().uuid()).min(1).max(100).safeParse(variantIds);
    if (!parsedIds.success) {
      return res.status(400).json({ error: "Provide between 1 and 100 valid variant IDs" });
    }

    const [variants, promotions] = await Promise.all([
      prisma.productVariant.findMany({
        where: { id: { in: parsedIds.data }, isActive: true },
        include: { product: true },
      }),
      prisma.promotion.findMany({
        where: {
          isActive: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "desc" },
      }),
    ]);

    const prices = variants.map((variant) => {
      const promotion = findPromotionForVariant(promotions, variant.product, variant);
      return {
        variantId: variant.id,
        ...calculatePromotionPrice(variant, promotion),
        promotionId: promotion?.id || null,
      };
    });

    res.json({ prices });
  } catch (error) {
    next(error);
  }
}

// Create product
export async function createProduct(req, res, next) {
  try {
    const validated = createProductSchema.parse(req.body);

    // Check if slug is unique
    const existing = await prisma.product.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    const product = await prisma.product.create({
      data: validated,
      include: {
        category: true,
        variants: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
}

// Update product
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateProductSchema.parse(req.body);

    // Check if slug is unique if it's being changed
    if (validated.slug) {
      const existing = await prisma.product.findFirst({
        where: {
          slug: validated.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(400).json({ error: "Slug must be unique" });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: validated,
      include: {
        category: true,
        variants: true,
      },
    });

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    next(error);
  }
}

// Delete product
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      await prisma.$transaction([
        prisma.product.update({
          where: { id },
          data: { isActive: false },
        }),
        prisma.productVariant.updateMany({
          where: { productId: id },
          data: { isActive: false },
        }),
      ]);

      return res.json({
        success: true,
        archived: true,
        message: "Product archived because it is referenced by existing orders",
      });
    }

    await prisma.product.delete({ where: { id } });

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    if (error.code === "P2003") {
      return res.status(409).json({ error: "Product has existing orders and was not deleted. Archive it instead." });
    }
    next(error);
  }
}

// Product Variants

export async function listVariants(req, res, next) {
  try {
    const { productId } = req.params;
    const { active = true } = req.query;

    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        ...(active !== "false" && { isActive: true }),
      },
      include: {
        product: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    res.json(variants);
  } catch (error) {
    next(error);
  }
}

export async function createVariant(req, res, next) {
  try {
    const { productId } = req.params;
    const validated = createVariantSchema.parse(req.body);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if SKU is unique
    const existing = await prisma.productVariant.findUnique({
      where: { sku: validated.sku },
    });

    if (existing) {
      return res.status(400).json({ error: "SKU must be unique" });
    }

    const variant = await prisma.productVariant.create({
      data: {
        ...validated,
        productId,
      },
      include: {
        product: true,
        images: true,
      },
    });

    res.status(201).json(variant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
}

export async function updateVariant(req, res, next) {
  try {
    const { productId, variantId } = req.params;
    const validated = updateVariantSchema.parse(req.body);

    // Check if SKU is unique if being changed
    if (validated.sku) {
      const existing = await prisma.productVariant.findFirst({
        where: {
          sku: validated.sku,
          NOT: { id: variantId },
        },
      });

      if (existing) {
        return res.status(400).json({ error: "SKU must be unique" });
      }
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: validated,
      include: {
        product: true,
        images: true,
      },
    });

    res.json(variant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Variant not found" });
    }
    next(error);
  }
}

export async function deleteVariant(req, res, next) {
  try {
    const { variantId } = req.params;

    await prisma.productVariant.delete({
      where: { id: variantId },
    });

    res.json({ success: true, message: "Variant deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Variant not found" });
    }
    next(error);
  }
}
