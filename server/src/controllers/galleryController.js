import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const createItemSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  mediaType: z.enum(["image", "video"]),
  storagePath: z.string().min(1, "Storage path is required"),
  publicUrl: z.string().url("Invalid URL"),
  caption: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const updateItemSchema = createItemSchema.partial();

// Get all gallery items
export async function listGalleryItems(req, res, next) {
  try {
    const { categoryId, mediaType, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (categoryId) where.categoryId = categoryId;
    if (mediaType) where.mediaType = mediaType;

    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({
        where,
        include: { category: true },
        skip,
        take: parseInt(limit),
        orderBy: { sortOrder: "asc" },
      }),
      prisma.galleryItem.count({ where }),
    ]);

    res.json({
      items,
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

// Get single gallery item
export async function getGalleryItem(req, res, next) {
  try {
    const { id } = req.params;

    const item = await prisma.galleryItem.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!item) {
      return res.status(404).json({ error: "Gallery item not found" });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
}

// Create gallery item
export async function createGalleryItem(req, res, next) {
  try {
    const validated = createItemSchema.parse(req.body);

    // Verify category exists if specified
    if (validated.categoryId) {
      const category = await prisma.galleryCategory.findUnique({
        where: { id: validated.categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    const item = await prisma.galleryItem.create({
      data: validated,
      include: { category: true },
    });

    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
}

// Update gallery item
export async function updateGalleryItem(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateItemSchema.parse(req.body);

    // Verify category exists if being changed
    if (validated.categoryId) {
      const category = await prisma.galleryCategory.findUnique({
        where: { id: validated.categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    const item = await prisma.galleryItem.update({
      where: { id },
      data: validated,
      include: { category: true },
    });

    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Gallery item not found" });
    }
    next(error);
  }
}

// Delete gallery item
export async function deleteGalleryItem(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.galleryItem.delete({
      where: { id },
    });

    res.json({ success: true, message: "Gallery item deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Gallery item not found" });
    }
    next(error);
  }
}

// Gallery Categories

export async function listGalleryCategories(req, res, next) {
  try {
    const categories = await prisma.galleryCategory.findMany({
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function createGalleryCategory(req, res, next) {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }

    const existing = await prisma.galleryCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    const category = await prisma.galleryCategory.create({
      data: { name, slug },
      include: {
        _count: { select: { items: true } },
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function updateGalleryCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    if (slug) {
      const existing = await prisma.galleryCategory.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(400).json({ error: "Slug must be unique" });
      }
    }

    const category = await prisma.galleryCategory.update({
      where: { id },
      data: { name, slug },
      include: {
        _count: { select: { items: true } },
      },
    });

    res.json(category);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    next(error);
  }
}

export async function deleteGalleryCategory(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.galleryCategory.delete({
      where: { id },
    });

    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    next(error);
  }
}
