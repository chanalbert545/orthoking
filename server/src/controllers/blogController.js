import { prisma } from "../lib/prisma.js";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  authorId: z.string().uuid().optional().nullable(),
  featuredImageUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "video"]).default("image"),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.string().datetime().optional().nullable(),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const updatePostSchema = createPostSchema.partial();

// Get all blog posts
export async function listPosts(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      status = "published",
      categoryId,
      search,
      sortBy = "publishedAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          category: true,
          author: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          [sortBy || "createdAt"]: sortOrder.toLowerCase(),
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts,
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

// Get single blog post
export async function getPost(req, res, next) {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        author: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Only show published posts unless in admin mode
    if (post.status === "draft" && !req.user) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
}

// Create blog post
export async function createPost(req, res, next) {
  try {
    const validated = createPostSchema.parse(req.body);

    // Check if slug is unique
    const existing = await prisma.blogPost.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    // Use logged-in user as author if not specified
    const authorId = validated.authorId || req.user?.id;

    const post = await prisma.blogPost.create({
      data: {
        ...validated,
        authorId,
      },
      include: {
        category: true,
        author: true,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
}

// Update blog post
export async function updatePost(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updatePostSchema.parse(req.body);

    // Check if slug is unique if being changed
    if (validated.slug) {
      const existing = await prisma.blogPost.findFirst({
        where: {
          slug: validated.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(400).json({ error: "Slug must be unique" });
      }
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: validated,
      include: {
        category: true,
        author: true,
      },
    });

    res.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    next(error);
  }
}

// Delete blog post
export async function deletePost(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.blogPost.delete({
      where: { id },
    });

    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    next(error);
  }
}

// Blog Categories

export async function listBlogCategories(req, res, next) {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function createBlogCategory(req, res, next) {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and slug are required" });
    }

    const existing = await prisma.blogCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    const category = await prisma.blogCategory.create({
      data: { name, slug },
      include: {
        _count: { select: { posts: true } },
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function updateBlogCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    if (slug) {
      const existing = await prisma.blogCategory.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(400).json({ error: "Slug must be unique" });
      }
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: { name, slug },
      include: {
        _count: { select: { posts: true } },
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

export async function deleteBlogCategory(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.blogCategory.delete({
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
