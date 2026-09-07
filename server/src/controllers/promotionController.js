import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const createPromotionSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  name: z.string().optional(),
  discountType: z.enum(["percent", "amount"]),
  percent: z.number().int().min(0).max(100).optional(),
  amountUgx: z.number().int().min(0).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
});

const updatePromotionSchema = createPromotionSchema.partial();
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

    if (productId) where.productId = productId;

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: {
          product: true,
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

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Verify variant exists if specified
    if (validated.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: validated.variantId },
      });

      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
    }

    const promotion = await prisma.promotion.create({
      data: validated,
      include: {
        product: true,
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

    // Verify product if being changed
    if (validated.productId) {
      const product = await prisma.product.findUnique({
        where: { id: validated.productId },
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
    }

    // Verify variant if being changed
    if (validated.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: validated.variantId },
      });

      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: validated,
      include: {
        product: true,
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
