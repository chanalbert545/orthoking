import { Router } from "express";
import { login, logout, me } from "../controllers/authController.js";
import {
  createContactMessage,
} from "../controllers/contactController.js";
import {
  getAdminSettings,
  getPublicSettings,
  updateAdminSettings,
} from "../controllers/settingsController.js";
import * as productController from "../controllers/productController.js";
import * as categoryController from "../controllers/categoryController.js";
import * as orderController from "../controllers/orderController.js";
import * as blogController from "../controllers/blogController.js";
import * as galleryController from "../controllers/galleryController.js";
import * as promotionController from "../controllers/promotionController.js";
import * as uploadController from "../controllers/uploadController.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadSingle } from "../middleware/upload.js";

export const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "dr-ortho-king" });
});

// Public endpoints
router.get("/settings", getPublicSettings);
router.post("/contact", createContactMessage);

// Authentication
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", requireAdmin, me);

// Admin settings
router.get("/admin/settings", requireAdmin, getAdminSettings);
router.patch("/admin/settings", requireAdmin, updateAdminSettings);

// ============ PRODUCTS ============
// Public endpoints
router.get("/products", productController.listProducts);
router.get("/products/:slug", productController.getProduct);

// Admin endpoints
router.post("/admin/products", requireAdmin, productController.createProduct);
router.patch("/admin/products/:id", requireAdmin, productController.updateProduct);
router.delete("/admin/products/:id", requireAdmin, productController.deleteProduct);

// Product Variants
router.get("/products/:productId/variants", productController.listVariants);
router.post("/admin/products/:productId/variants", requireAdmin, productController.createVariant);
router.patch("/admin/variants/:variantId", requireAdmin, productController.updateVariant);
router.delete("/admin/variants/:variantId", requireAdmin, productController.deleteVariant);

// ============ CATEGORIES ============
// Public endpoints
router.get("/categories", categoryController.listCategories);
router.get("/categories/:slug", categoryController.getCategory);

// Admin endpoints
router.post("/admin/categories", requireAdmin, categoryController.createCategory);
router.patch("/admin/categories/:id", requireAdmin, categoryController.updateCategory);
router.delete("/admin/categories/:id", requireAdmin, categoryController.deleteCategory);

// ============ ORDERS ============
// Public endpoint to create order
router.post("/orders", orderController.createOrder);

// Admin endpoints
router.get("/admin/orders", requireAdmin, orderController.listOrders);
router.get("/admin/orders/:id", requireAdmin, orderController.getOrder);
router.patch("/admin/orders/:id", requireAdmin, orderController.updateOrder);
router.post("/admin/orders/:id/cancel", requireAdmin, orderController.cancelOrder);

// ============ BLOG ============
// Public endpoints
router.get("/blog/posts", blogController.listPosts);
router.get("/blog/posts/:slug", blogController.getPost);
router.get("/blog/categories", blogController.listBlogCategories);

// Admin endpoints
router.post("/admin/blog/posts", requireAdmin, blogController.createPost);
router.patch("/admin/blog/posts/:id", requireAdmin, blogController.updatePost);
router.delete("/admin/blog/posts/:id", requireAdmin, blogController.deletePost);
router.post("/admin/blog/categories", requireAdmin, blogController.createBlogCategory);
router.patch("/admin/blog/categories/:id", requireAdmin, blogController.updateBlogCategory);
router.delete("/admin/blog/categories/:id", requireAdmin, blogController.deleteBlogCategory);

// ============ GALLERY ============
// Public endpoints
router.get("/gallery/items", galleryController.listGalleryItems);
router.get("/gallery/items/:id", galleryController.getGalleryItem);
router.get("/gallery/categories", galleryController.listGalleryCategories);

// Admin endpoints
router.post("/admin/gallery/items", requireAdmin, galleryController.createGalleryItem);
router.patch("/admin/gallery/items/:id", requireAdmin, galleryController.updateGalleryItem);
router.delete("/admin/gallery/items/:id", requireAdmin, galleryController.deleteGalleryItem);
router.post("/admin/gallery/categories", requireAdmin, galleryController.createGalleryCategory);
router.patch("/admin/gallery/categories/:id", requireAdmin, galleryController.updateGalleryCategory);
router.delete("/admin/gallery/categories/:id", requireAdmin, galleryController.deleteGalleryCategory);

// ============ PROMOTIONS ============
// Public endpoint to see active promotions
router.get("/promotions", promotionController.listPromotions);

// Admin endpoints
router.post("/admin/promotions", requireAdmin, promotionController.createPromotion);
router.patch("/admin/promotions/timer", requireAdmin, promotionController.updatePromotionTimer);
router.get("/admin/promotions/:id", requireAdmin, promotionController.getPromotion);
router.patch("/admin/promotions/:id", requireAdmin, promotionController.updatePromotion);
router.delete("/admin/promotions/:id", requireAdmin, promotionController.deletePromotion);

// ============ UPLOADS ============
// Product images
router.post(
  "/admin/products/:productId/images",
  requireAdmin,
  uploadSingle,
  uploadController.uploadProductImage
);
router.delete(
  "/admin/images/:imageId",
  requireAdmin,
  uploadController.deleteProductImage
);
router.patch(
  "/admin/products/:productId/images/reorder",
  requireAdmin,
  uploadController.reorderProductImages
);

// Gallery media
router.post(
  "/admin/gallery/upload",
  requireAdmin,
  uploadSingle,
  uploadController.uploadGalleryMedia
);
router.delete(
  "/admin/gallery/:itemId/media",
  requireAdmin,
  uploadController.deleteGalleryMedia
);

// Blog featured images
router.post(
  "/admin/blog/posts/:postId/featured-image",
  requireAdmin,
  uploadSingle,
  uploadController.uploadBlogFeaturedImage
);
