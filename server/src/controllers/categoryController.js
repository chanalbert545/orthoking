import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.partial();

// Get all categories with optional hierarchy
export async function listCategories(req, res, next) {
  try {
    const { parentId, active = true, includeInactive } = req.query;

    const where = {};
    if (parentId) {
      where.parentId = parentId;
    }
    if (includeInactive !== "true" && active !== "false") {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

// Get category with all products
export async function getCategory(req, res, next) {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        products: {
          where: { isActive: true },
          include: {
            variants: true,
            images: { take: 1 },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
}

// Create category
export async function createCategory(req, res, next) {
  try {
    const validated = createCategorySchema.parse(req.body);

    // Check if slug is unique
    const existing = await prisma.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    // Verify parent exists if specified
    if (validated.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: validated.parentId },
      });

      if (!parent) {
        return res.status(404).json({ error: "Parent category not found" });
      }
    }

    const category = await prisma.category.create({
      data: validated,
      include: {
        parent: true,
        children: true,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
}

// Update category
export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateCategorySchema.parse(req.body);

    // Check if slug is unique if being changed
    if (validated.slug) {
      const existing = await prisma.category.findFirst({
        where: {
          slug: validated.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(400).json({ error: "Slug must be unique" });
      }
    }

    // Verify parent exists if being changed
    if (validated.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: validated.parentId },
      });

      if (!parent) {
        return res.status(404).json({ error: "Parent category not found" });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: validated,
      include: {
        parent: true,
        children: true,
      },
    });

    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }
    next(error);
  }
}

// Delete category
export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.category.delete({
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
