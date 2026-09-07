import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const productDetailCache = new Map();
const productDetailCacheTtl = 30 * 1000;

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
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

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
        include: {
          category: true,
          variants: {
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
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
              },
            },
          },
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          [sortBy]: sortOrder.toLowerCase(),
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
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

    productDetailCache.set(slug, {
      product,
      expiresAt: Date.now() + productDetailCacheTtl,
    });

    res.json(product);
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

    await prisma.product.delete({
      where: { id },
    });

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
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
