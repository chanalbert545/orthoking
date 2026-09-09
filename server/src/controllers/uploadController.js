import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../lib/prisma.js";
import { blogMediaBucket, productImagesBucket, supabaseAdmin } from "../lib/supabase.js";

const uploadsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/uploads"
);

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

// Upload product image
export async function uploadProductImage(req, res, next) {
  try {
    const { productId } = req.params;
    const { variantId } = req.query;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // If variantId provided, verify variant exists
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase Storage is not configured" });
    }

    const existingImages = await prisma.productImage.findMany({
      where: { productId },
      select: { id: true, storagePath: true },
    });

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = req.file.originalname.includes(".")
      ? req.file.originalname.slice(req.file.originalname.lastIndexOf("."))
      : "";
    const filename = `product-${productId}-${timestamp}-${random}${extension}`;
    const storagePath = `products/${productId}/${filename}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(productImagesBucket)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      const storageError = new Error(`Supabase blog media upload failed: ${uploadError.message}`);
      storageError.status = 502;
      storageError.code = "SUPABASE_STORAGE";
      throw storageError;
    }

    const publicUrl = supabaseAdmin.storage
      .from(productImagesBucket)
      .getPublicUrl(storagePath).data.publicUrl;

    // Create database record
    const image = await prisma.productImage.create({
      data: {
        productId,
        variantId: variantId || null,
        storagePath,
        publicUrl,
        altText: req.body.altText || "",
        mimeType: req.file.mimetype,
        sortOrder: parseInt(req.body.sortOrder) || 0,
      },
    });

    // A product has one primary image. Remove previous files and records after
    // the replacement has been stored successfully.
    const previousStoragePaths = existingImages
      .map((existingImage) => existingImage.storagePath)
      .filter((storagePath) => storagePath.startsWith("products/"));
    if (previousStoragePaths.length > 0) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from(productImagesBucket)
        .remove(previousStoragePaths);
      if (cleanupError) {
        console.error("Failed to remove previous product images from Supabase:", cleanupError);
      }
    }
    if (existingImages.length > 0) {
      await prisma.productImage.deleteMany({
        where: { id: { in: existingImages.map((existingImage) => existingImage.id) } },
      });
    }

    res.status(201).json({
      image,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Delete product image
export async function deleteProductImage(req, res, next) {
  try {
    const { imageId } = req.params;

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    try {
      if (image.storagePath.startsWith("products/")) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from(productImagesBucket)
          .remove([image.storagePath]);
        if (deleteError) throw deleteError;
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }

    // Delete database record
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    res.json({ success: true, message: "Image deleted" });
  } catch (error) {
    next(error);
  }
}

// Reorder product images
export async function reorderProductImages(req, res, next) {
  try {
    const { productId } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images)) {
      return res.status(400).json({ error: "Images must be an array" });
    }

    // Update sort order for each image
    const updated = await Promise.all(
      images.map((img, index) =>
        prisma.productImage.update({
          where: { id: img.id },
          data: { sortOrder: index },
        })
      )
    );

    res.json({
      images: updated,
      message: "Images reordered",
    });
  } catch (error) {
    next(error);
  }
}

// Upload gallery media
export async function uploadGalleryMedia(req, res, next) {
  try {
    const { categoryId } = req.query;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Verify category exists if provided
    if (categoryId) {
      const category = await prisma.galleryCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    await ensureUploadsDir();

    // Determine media type
    const mimeType = req.file.mimetype;
    const mediaType = mimeType.startsWith("video/") ? "video" : "image";

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `gallery-${mediaType}-${timestamp}-${random}${path.extname(req.file.originalname)}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    await fs.writeFile(filepath, req.file.buffer);

    // Create database record
    const item = await prisma.galleryItem.create({
      data: {
        categoryId: categoryId || null,
        mediaType,
        storagePath: filename,
        publicUrl: `/uploads/${filename}`,
        caption: req.body.caption || "",
        sortOrder: parseInt(req.body.sortOrder) || 0,
      },
      include: { category: true },
    });

    res.status(201).json({
      item,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Delete gallery media
export async function deleteGalleryMedia(req, res, next) {
  try {
    const { itemId } = req.params;

    const item = await prisma.galleryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: "Gallery item not found" });
    }

    // Delete file from disk
    try {
      const filepath = path.join(uploadsDir, item.storagePath);
      await fs.unlink(filepath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }

    // Delete database record
    await prisma.galleryItem.delete({
      where: { id: itemId },
    });

    res.json({ success: true, message: "Media deleted" });
  } catch (error) {
    next(error);
  }
}

// Upload featured blog image
export async function uploadBlogFeaturedImage(req, res, next) {
  try {
    const { postId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Verify post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase Storage is not configured" });
    }

    // Store blog media in Supabase so it survives backend redeploys.
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `blog-${postId}-${timestamp}-${random}${path.extname(req.file.originalname)}`;
    const storagePath = `blog/${postId}/${filename}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(blogMediaBucket)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const publicUrl = supabaseAdmin.storage
      .from(blogMediaBucket)
      .getPublicUrl(storagePath).data.publicUrl;

    // Update post with featured image
    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        featuredImageUrl: publicUrl,
        featuredImageStoragePath: storagePath,
        mediaType: req.file.mimetype.startsWith("video/") ? "video" : "image",
      },
      include: {
        category: true,
        author: true,
      },
    });

    res.status(201).json({
      post: updatedPost,
      message: "Featured image uploaded successfully",
    });

    if (post.featuredImageStoragePath) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from(blogMediaBucket)
        .remove([post.featuredImageStoragePath]);
      if (cleanupError) {
        console.error("Failed to remove previous blog media from Supabase:", cleanupError);
      }
    }
  } catch (error) {
    next(error);
  }
}
