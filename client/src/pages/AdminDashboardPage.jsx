import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import "../styles/admin.css";

const productCategories = [
  { name: "Box Euro Top Hybrid -- Carbon Memory Foam Range", slug: "box-euro-top-hybrid-carbon-memory-foam-range" },
  { name: "Box Euro Top Hybrid -- Natural Latex Foam Range", slug: "box-euro-top-hybrid-natural-latex-foam-range" },
  { name: "Tight Top Firm Hybrid Pocket Spring Range", slug: "tight-top-firm-hybrid-pocket-spring-range" },
  { name: "Dual Nano Spring Collection (Japanese Patented Technology)", slug: "dual-nano-spring-collection-japanese-patented-technology" },
  { name: "Turkish Dr. Ortho Spring Range (Compressed Pocket Spring)", slug: "turkish-dr-ortho-spring-range-compressed-pocket-spring" },
];

const initialVariants = [
  { size: "King", dimensions: "", price: "", formerPrice: "", stock: "" },
  { size: "Queen", dimensions: "", price: "", formerPrice: "", stock: "" },
  { size: "Small", dimensions: "", price: "", formerPrice: "", stock: "" },
];

function toProductSlug(name, products = []) {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `product-${Date.now()}`;
  const usedSlugs = new Set(products.map((product) => product.slug));
  if (!usedSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

export function AdminDashboardPage({ user, settings }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Load basic stats
      const [products, orders] = await Promise.all([
        api("/api/products?limit=1"),
        api("/api/admin/orders?limit=1"),
      ]);

      setStats({
        totalProducts: products.pagination?.total || 0,
        totalOrders: orders.pagination?.total || 0,
        pendingOrders: orders.orders?.filter((o) => o.orderStatus === "pending").length || 0,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Signed in as <strong>{user?.email}</strong></p>
      </div>

      {/* Tab Navigation */}
      <nav className="admin-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={`tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          className={`tab ${activeTab === "blog" ? "active" : ""}`}
          onClick={() => setActiveTab("blog")}
        >
          Blog
        </button>
        <button
          className={`tab ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          Gallery
        </button>
        <button
          className={`tab ${activeTab === "promotions" ? "active" : ""}`}
          onClick={() => setActiveTab("promotions")}
        >
          Promotions
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </nav>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === "overview" && <OverviewTab stats={stats} />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "blog" && <BlogTab />}
        {activeTab === "gallery" && <GalleryTab />}
        {activeTab === "promotions" && <PromotionsTab />}
        {activeTab === "settings" && <SettingsTab settings={settings} />}
      </div>
    </div>
  );
}

function OverviewTab({ stats }) {
  return (
    <div className="tab-content">
      <h2>Dashboard Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>
        <div className="stat-card highlight">
          <h3>Pending Orders</h3>
          <p className="stat-value">{stats.pendingOrders}</p>
        </div>
      </div>
      <div className="info-card">
        <h3>Quick Start</h3>
        <ul>
          <li>Create product categories first</li>
          <li>Add products with variants (size, thickness, color)</li>
          <li>Upload product images</li>
          <li>Create promotions for discounts</li>
          <li>Manage blog posts and gallery</li>
        </ul>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const editFormRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    variants: initialVariants.map((variant) => ({ ...variant })),
    isFeatured: false,
    isActive: true,
  });

  useEffect(() => {
    loadProducts();
    loadProductCategories();
  }, []);

  useEffect(() => {
    if (!editingProduct || !editFormRef.current) return;
    editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    editFormRef.current.querySelector("input")?.focus({ preventScroll: true });
  }, [editingProduct]);

  async function loadProductCategories() {
    try {
      const data = await api("/api/categories?active=true");
      let availableCategories = data.categories || data || [];
      const existingSlugs = new Set(availableCategories.map((category) => category.slug));
      const missingCategories = productCategories.filter((category) => !existingSlugs.has(category.slug));

      if (missingCategories.length > 0) {
        const createdCategories = await Promise.all(
          missingCategories.map((category) => api("/api/admin/categories", {
            method: "POST",
            body: JSON.stringify(category),
          }))
        );
        availableCategories = [...availableCategories, ...createdCategories];
      }

      setCategories(availableCategories);
    } catch (err) {
      console.error("Failed to load product categories:", err);
    }
  }

  async function loadProducts() {
    try {
      const data = await api("/api/products?limit=100");
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    let createStep = "product";
    let productToCleanup = null;
    try {
      const slug = toProductSlug(formData.name, products);
      const product = await api("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          slug,
          description: formData.description,
          categoryId: formData.categoryId || null,
          isFeatured: formData.isFeatured,
          isActive: formData.isActive,
        }),
      });
      productToCleanup = product;
      createStep = "variant";
      const skuSuffix = Date.now();
      await Promise.all(formData.variants.map((variant, index) => api(`/api/admin/products/${product.id}/variants`, {
        method: "POST",
        body: JSON.stringify({
          sku: `${product.slug}-${variant.size.toLowerCase()}-${skuSuffix}-${index}`,
          size: variant.size,
          thickness: variant.dimensions,
          color: "Default",
          regularPriceUgx: Number(variant.price),
          formerPriceUgx: variant.formerPrice ? Number(variant.formerPrice) : null,
          stock: Number(variant.stock),
          isActive: true,
        }),
      })));
      if (imageFile) {
        createStep = "image upload";
        const upload = new FormData();
        upload.append("file", imageFile);
        upload.append("altText", formData.name);
        await api(`/api/admin/products/${product.id}/images`, {
          method: "POST",
          body: upload,
        });
      }
      productToCleanup = null;
      setFormData({ name: "", slug: "", description: "", categoryId: "", variants: initialVariants.map((variant) => ({ ...variant })), isFeatured: false, isActive: true });
      setImageFile(null);
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      if (productToCleanup) {
        try {
          await api(`/api/admin/products/${productToCleanup.id}`, { method: "DELETE" });
        } catch (cleanupError) {
          console.error("Failed to clean up incomplete product:", cleanupError);
        }
      }
      alert(`Error creating product during ${createStep}: ${err.message}`);
    }
  }

  function startEditing(product) {
    setEditingProduct({
      ...product,
      categoryId: product.categoryId || "",
      variants: (product.variants || []).map((variant) => ({ ...variant })),
    });
    setEditImageFile(null);
    setShowForm(false);
  }

  function updateVariantField(variantId, field, value) {
    setEditingProduct((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      ),
    }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { variants, ...productFields } = editingProduct;
      await api(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...productFields,
          categoryId: productFields.categoryId || null,
        }),
      });
      await Promise.all(
        variants.map((variant) =>
          api(`/api/admin/variants/${variant.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              sku: variant.sku,
              size: variant.size,
              thickness: variant.thickness,
              color: variant.color,
              regularPriceUgx: Number(variant.regularPriceUgx),
              formerPriceUgx: variant.formerPriceUgx ? Number(variant.formerPriceUgx) : null,
              stock: Number(variant.stock),
              isActive: variant.isActive,
            }),
          })
        )
      );
      if (editImageFile) {
        const upload = new FormData();
        upload.append("file", editImageFile);
        upload.append("altText", editingProduct.name);
        await api(`/api/admin/products/${editingProduct.id}/images`, {
          method: "POST",
          body: upload,
        });
      }
      setEditingProduct(null);
      setEditImageFile(null);
      await loadProducts();
    } catch (err) {
      alert("Error updating product: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await api(`/api/admin/products/${id}`, { method: "DELETE" });
      loadProducts();
    } catch (err) {
      alert("Error deleting product: " + err.message);
    }
  }

  return (
    <div className="tab-content">
      <h2>Products</h2>
      
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Cancel" : "Add New Product"}
      </button>

      {showForm && (
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
              <option value="">Select a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>

          <h3>Size options</h3>
          <div className="new-variant-list">
            {formData.variants.map((variant, index) => (
              <fieldset className="new-variant" key={variant.size}>
                <legend>{variant.size} size</legend>
                <div className="form-group">
                  <label htmlFor={`dimensions-${variant.size}`}>Dimensions</label>
                  <input id={`dimensions-${variant.size}`} required value={variant.dimensions} onChange={(e) => setFormData({ ...formData, variants: formData.variants.map((item, itemIndex) => itemIndex === index ? { ...item, dimensions: e.target.value } : item) })} placeholder="e.g. 72 x 78 x 10 inches" />
                </div>
                <div className="form-group">
                  <label htmlFor={`price-${variant.size}`}>Price (UGX)</label>
                  <input id={`price-${variant.size}`} required min="1" type="number" value={variant.price} onChange={(e) => setFormData({ ...formData, variants: formData.variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: e.target.value } : item) })} />
                </div>
                <div className="form-group">
                  <label htmlFor={`former-price-${variant.size}`}>Former price (UGX)</label>
                  <input id={`former-price-${variant.size}`} min="1" type="number" value={variant.formerPrice} onChange={(e) => setFormData({ ...formData, variants: formData.variants.map((item, itemIndex) => itemIndex === index ? { ...item, formerPrice: e.target.value } : item) })} />
                </div>
                <div className="form-group">
                  <label htmlFor={`stock-${variant.size}`}>Stock quantity</label>
                  <input id={`stock-${variant.size}`} required min="0" type="number" value={variant.stock} onChange={(e) => setFormData({ ...formData, variants: formData.variants.map((item, itemIndex) => itemIndex === index ? { ...item, stock: e.target.value } : item) })} />
                </div>
              </fieldset>
            ))}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setImageFile(e.target.files[0] || null)} />
          </div>

          <button type="submit" className="btn btn-primary">
            Create Product
          </button>
        </form>
      )}

      {editingProduct && (
        <form ref={editFormRef} className="admin-form product-edit-form" onSubmit={handleUpdate}>
          <h3>Edit Product</h3>
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input type="text" required value={editingProduct.slug} onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={editingProduct.description || ""} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Product Image</label>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setEditImageFile(e.target.files[0] || null)} />
          </div>
          <label className="admin-checkbox"><input type="checkbox" checked={editingProduct.isFeatured} onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })} /> Featured product</label>
          <label className="admin-checkbox"><input type="checkbox" checked={editingProduct.isActive} onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })} /> Active product</label>

          <h4>Variants and Prices</h4>
          {editingProduct.variants.length === 0 && <p>This product has no variants yet.</p>}
          {editingProduct.variants.map((variant) => (
            <div className="variant-edit" key={variant.id}>
              <div className="form-group"><label>SKU</label><input required value={variant.sku} onChange={(e) => updateVariantField(variant.id, "sku", e.target.value)} /></div>
              <div className="form-group"><label>Size</label><input required value={variant.size} onChange={(e) => updateVariantField(variant.id, "size", e.target.value)} /></div>
              <div className="form-group"><label>Thickness</label><input required value={variant.thickness} onChange={(e) => updateVariantField(variant.id, "thickness", e.target.value)} /></div>
              <div className="form-group"><label>Color</label><input required value={variant.color} onChange={(e) => updateVariantField(variant.id, "color", e.target.value)} /></div>
              <div className="form-group"><label>Price (UGX)</label><input required min="1" type="number" value={variant.regularPriceUgx} onChange={(e) => updateVariantField(variant.id, "regularPriceUgx", e.target.value)} /></div>
              <div className="form-group"><label>Former price (UGX)</label><input min="1" type="number" value={variant.formerPriceUgx || ""} onChange={(e) => updateVariantField(variant.id, "formerPriceUgx", e.target.value)} /></div>
              <div className="form-group"><label>Stock</label><input required min="0" type="number" value={variant.stock} onChange={(e) => updateVariantField(variant.id, "stock", e.target.value)} /></div>
              <label className="admin-checkbox"><input type="checkbox" checked={variant.isActive} onChange={(e) => updateVariantField(variant.id, "isActive", e.target.checked)} /> Active variant</label>
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)} disabled={saving}>Cancel</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Variants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.slug}</td>
                  <td>{product.variants?.length || 0}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => startEditing(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await api("/api/categories");
      setCategories(data.categories || data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setFormData({ name: "", slug: "", description: "" });
      setShowForm(false);
      loadCategories();
    } catch (err) {
      alert("Error creating category: " + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category?")) return;
    try {
      await api(`/api/admin/categories/${id}`, { method: "DELETE" });
      loadCategories();
    } catch (err) {
      alert("Error deleting category: " + err.message);
    }
  }

  return (
    <div className="tab-content">
      <h2>Categories</h2>
      
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Cancel" : "Add New Category"}
      </button>

      {showForm && (
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Slug</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Create Category
          </button>
        </form>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category._count?.products || 0}</td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(category.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await api("/api/admin/orders?limit=50");
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, newStatus) {
    try {
      await api(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      loadOrders();
    } catch (err) {
      alert("Error updating order: " + err.message);
    }
  }

  return (
    <div className="tab-content">
      <h2>Orders</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id.substring(0, 8)}...</td>
                  <td>{order.customerName}</td>
                  <td>{order.email}</td>
                  <td>UGX {order.totalUgx.toLocaleString()}</td>
                  <td>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        const details = order.items
                          .map((item) => `${item.productName} x${item.quantity}`)
                          .join("\n");
                        alert(`Order Details:\n${details}`);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BlogTab() {
  const emptyPost = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    ctaText: "",
    ctaUrl: "",
    status: "draft",
    mediaType: "image",
  };
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState(emptyPost);
  const [mediaFile, setMediaFile] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await api("/api/blog/posts?status=&limit=100");
      setPosts(data.posts || []);
    } catch (err) {
      alert(`Could not load blog posts: ${err.message}`);
    }
  }

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function startNewPost() {
    setEditingPost(null);
    setFormData(emptyPost);
    setMediaFile(null);
    setShowForm(true);
  }

  function startEditing(post) {
    setEditingPost(post);
    setFormData({ ...emptyPost, ...post, ctaText: post.ctaText || "", ctaUrl: post.ctaUrl || "" });
    setMediaFile(null);
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const baseSlug = formData.slug || formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `post-${Date.now()}`;
      const usedSlugs = new Set(posts.filter((post) => post.id !== editingPost?.id).map((post) => post.slug));
      let slug = baseSlug;
      let suffix = 2;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      const payload = {
        title: formData.title,
        slug,
        excerpt: formData.excerpt || null,
        content: formData.content || null,
        ctaText: formData.ctaText || null,
        ctaUrl: formData.ctaUrl || null,
        status: formData.status,
        mediaType: formData.mediaType,
      };
      const post = await api(editingPost ? `/api/admin/blog/posts/${editingPost.id}` : "/api/admin/blog/posts", {
        method: editingPost ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (mediaFile) {
        const upload = new FormData();
        upload.append("file", mediaFile);
        await api(`/api/admin/blog/posts/${post.id}/featured-image`, { method: "POST", body: upload });
      }
      setShowForm(false);
      setMediaFile(null);
      await loadPosts();
    } catch (err) {
      alert(`Could not save blog post: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function removePost(post) {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    try {
      await api(`/api/admin/blog/posts/${post.id}`, { method: "DELETE" });
      await loadPosts();
    } catch (err) {
      alert(`Could not delete blog post: ${err.message}`);
    }
  }

  return (
    <div className="tab-content">
      <div className="section-heading-row">
        <div><p className="eyebrow">Content studio</p><h2>Blog Posts</h2></div>
        <button className="btn btn-primary" onClick={startNewPost}>New post</button>
      </div>
      {showForm && <form className="admin-form blog-form" onSubmit={handleSubmit}>
        <div className="section-heading-row"><h3>{editingPost ? "Edit post" : "Create post"}</h3><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button></div>
        <div className="blog-form-grid">
          <div className="form-group"><label htmlFor="blog-title">Headline</label><input id="blog-title" required value={formData.title} onChange={(event) => updateField("title", event.target.value)} placeholder="The headline your readers will see" /></div>
          <div className="form-group"><label htmlFor="blog-slug">URL slug</label><input id="blog-slug" value={formData.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="leave blank to generate" /></div>
        </div>
        <div className="form-group"><label htmlFor="blog-excerpt">Subheadline / message preview</label><textarea id="blog-excerpt" rows="3" value={formData.excerpt} onChange={(event) => updateField("excerpt", event.target.value)} placeholder="A short supporting message for cards and previews" /></div>
        <div className="form-group"><label htmlFor="blog-content">Message</label><textarea id="blog-content" rows="8" value={formData.content} onChange={(event) => updateField("content", event.target.value)} placeholder="Write the full message or article content" /></div>
        <div className="blog-form-grid">
          <div className="form-group"><label htmlFor="blog-cta-text">CTA label</label><input id="blog-cta-text" value={formData.ctaText} onChange={(event) => updateField("ctaText", event.target.value)} placeholder="Read more" /></div>
          <div className="form-group"><label htmlFor="blog-cta-url">CTA link</label><input id="blog-cta-url" value={formData.ctaUrl} onChange={(event) => updateField("ctaUrl", event.target.value)} placeholder="/shop or https://..." /></div>
        </div>
        <div className="blog-form-grid">
          <div className="form-group"><label htmlFor="blog-media-type">Media type</label><select id="blog-media-type" value={formData.mediaType} onChange={(event) => updateField("mediaType", event.target.value)}><option value="image">Image</option><option value="video">Video</option></select></div>
          <div className="form-group"><label htmlFor="blog-media">Featured image or video</label><input id="blog-media" type="file" accept={formData.mediaType === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"} onChange={(event) => setMediaFile(event.target.files[0] || null)} /><small>{editingPost?.featuredImageUrl && !mediaFile ? "A media file is already attached. Choose a new file to replace it." : "Maximum file size: 50MB"}</small></div>
        </div>
        <div className="blog-form-grid">
          <div className="form-group"><label htmlFor="blog-status">Publishing status</label><select id="blog-status" value={formData.status} onChange={(event) => updateField("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingPost ? "Save changes" : "Create post"}</button>
      </form>}
      {posts.length ? <div className="data-table"><table><thead><tr><th>Post</th><th>Media</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{posts.map((post) => <tr key={post.id}><td><strong>{post.title}</strong><br /><small>{post.excerpt || "No subheadline"}</small></td><td>{post.mediaType === "video" ? "Video" : "Image"}</td><td>{post.status}</td><td>{new Date(post.updatedAt).toLocaleDateString()}</td><td><button className="btn-secondary" onClick={() => startEditing(post)}>Edit</button> <button className="btn-danger" onClick={() => removePost(post)}>Delete</button></td></tr>)}</tbody></table></div> : <div className="empty-content"><h3>No blog posts yet.</h3><p>Create a post with a headline, message, media, and CTA.</p></div>}
    </div>
  );
}

function GalleryTab() {
  return (
    <div className="tab-content">
      <h2>Gallery</h2>
      <p>Gallery management UI coming soon...</p>
    </div>
  );
}

function PromotionsTab() {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [timerEndsAt, setTimerEndsAt] = useState("");
  const [formData, setFormData] = useState({ productId: "", discountType: "percent", percent: "", amountUgx: "", startsAt: "", endsAt: "", name: "" });

  useEffect(() => {
    loadPromotions();
    api("/api/products?limit=100").then((data) => setProducts(data.products || [])).catch(() => {});
  }, []);

  async function loadPromotions() {
    try {
      const data = await api("/api/promotions?limit=100");
      setPromotions(data.promotions || []);
    } catch (err) {
      alert(`Could not load promotions: ${err.message}`);
    }
  }

  function updatePromotionField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function toIso(value) {
    return value ? new Date(value).toISOString() : "";
  }

  function toDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function startNewPromotion() {
    setEditingPromotion(null);
    setFormData({ productId: "", discountType: "percent", percent: "", amountUgx: "", startsAt: "", endsAt: "", name: "" });
    setShowForm(true);
  }

  function startEditingPromotion(promotion) {
    setEditingPromotion(promotion);
    setFormData({
      productId: promotion.productId,
      discountType: promotion.discountType,
      percent: promotion.percent || "",
      amountUgx: promotion.amountUgx || "",
      startsAt: toDateTimeLocal(promotion.startsAt),
      endsAt: toDateTimeLocal(promotion.endsAt),
      name: promotion.name || "",
    });
    setShowForm(true);
  }

  async function savePromotion(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api(editingPromotion ? `/api/admin/promotions/${editingPromotion.id}` : "/api/admin/promotions", {
        method: editingPromotion ? "PATCH" : "POST",
        body: JSON.stringify({
          productId: formData.productId,
          discountType: formData.discountType,
          percent: formData.discountType === "percent" ? Number(formData.percent) : undefined,
          amountUgx: formData.discountType === "amount" ? Number(formData.amountUgx) : undefined,
          startsAt: toIso(formData.startsAt),
          endsAt: toIso(formData.endsAt),
          name: formData.name || undefined,
          isActive: editingPromotion ? editingPromotion.isActive : true,
        }),
      });
      setFormData({ productId: "", discountType: "percent", percent: "", amountUgx: "", startsAt: "", endsAt: "", name: "" });
      setShowForm(false);
      await loadPromotions();
    } catch (err) {
      alert(`Could not save promotion: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function setGeneralTimer(event) {
    event.preventDefault();
    try {
      const result = await api("/api/admin/promotions/timer", { method: "PATCH", body: JSON.stringify({ endsAt: toIso(timerEndsAt) }) });
      alert(`Updated ${result.updated} promotion${result.updated === 1 ? "" : "s"}.`);
      setTimerEndsAt("");
      await loadPromotions();
    } catch (err) {
      alert(`Could not update promotion timer: ${err.message}`);
    }
  }

  async function deletePromotion(id) {
    if (!window.confirm("Delete this promotion?")) return;
    try {
      await api(`/api/admin/promotions/${id}`, { method: "DELETE" });
      await loadPromotions();
    } catch (err) {
      alert(`Could not delete promotion: ${err.message}`);
    }
  }

  return (
    <div className="tab-content">
      <h2>Promotions</h2>
      <div className="section-heading-row"><p>Choose products, set a discount, and control the shared countdown end time.</p><button className="btn btn-primary" onClick={startNewPromotion}>New promotion</button></div>
      <form className="admin-form promotion-timer-form" onSubmit={setGeneralTimer}><div className="form-group"><label htmlFor="promotion-timer">General countdown end</label><input id="promotion-timer" required type="datetime-local" value={timerEndsAt} onChange={(event) => setTimerEndsAt(event.target.value)} /></div><button className="btn btn-secondary" type="submit">Apply to active promotions</button></form>
      {showForm && <form className="admin-form blog-form" onSubmit={savePromotion}><div className="section-heading-row"><h3>{editingPromotion ? "Edit promotion" : "New promotion"}</h3><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button></div><div className="blog-form-grid"><div className="form-group"><label htmlFor="promotion-product">Product</label><select id="promotion-product" required value={formData.productId} onChange={(event) => updatePromotionField("productId", event.target.value)}><option value="">Choose a product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div><div className="form-group"><label htmlFor="promotion-name">Promotion name</label><input id="promotion-name" value={formData.name} onChange={(event) => updatePromotionField("name", event.target.value)} placeholder="Weekend sale" /></div></div><div className="blog-form-grid"><div className="form-group"><label htmlFor="promotion-type">Discount type</label><select id="promotion-type" value={formData.discountType} onChange={(event) => updatePromotionField("discountType", event.target.value)}><option value="percent">Percentage</option><option value="amount">Fixed UGX amount</option></select></div>{formData.discountType === "percent" ? <div className="form-group"><label htmlFor="promotion-percent">Discount percent</label><input id="promotion-percent" required type="number" min="1" max="100" value={formData.percent} onChange={(event) => updatePromotionField("percent", event.target.value)} /></div> : <div className="form-group"><label htmlFor="promotion-amount">Discount amount (UGX)</label><input id="promotion-amount" required type="number" min="1" value={formData.amountUgx} onChange={(event) => updatePromotionField("amountUgx", event.target.value)} /></div>}</div><div className="blog-form-grid"><div className="form-group"><label htmlFor="promotion-start">Starts</label><input id="promotion-start" required type="datetime-local" value={formData.startsAt} onChange={(event) => updatePromotionField("startsAt", event.target.value)} /></div><div className="form-group"><label htmlFor="promotion-end">Ends</label><input id="promotion-end" required type="datetime-local" value={formData.endsAt} onChange={(event) => updatePromotionField("endsAt", event.target.value)} /></div></div><button className="btn btn-primary" disabled={saving} type="submit">{saving ? "Saving..." : editingPromotion ? "Save changes" : "Create promotion"}</button></form>}
      {promotions.length ? <div className="data-table"><table><thead><tr><th>Promotion</th><th>Discount</th><th>Ends</th><th>Status</th><th>Actions</th></tr></thead><tbody>{promotions.map((promotion) => <tr key={promotion.id}><td><strong>{promotion.name || "Promotion"}</strong><br /><small>{promotion.product?.name}</small></td><td>{promotion.discountType === "percent" ? `${promotion.percent}%` : `UGX ${promotion.amountUgx?.toLocaleString()}`}</td><td>{new Date(promotion.endsAt).toLocaleString()}</td><td>{promotion.isActive && new Date(promotion.endsAt) >= new Date() ? "Active" : "Inactive"}</td><td><button className="btn-secondary" onClick={() => startEditingPromotion(promotion)}>Edit</button> <button className="btn-danger" onClick={() => deletePromotion(promotion.id)}>Delete</button></td></tr>)}</tbody></table></div> : <div className="empty-content"><h3>No promotions yet.</h3><p>Add promoted products here and they will appear on the homepage and shop page.</p></div>}
    </div>
  );
}

function SettingsTab({ settings }) {
  const [shippingUgx, setShippingUgx] = useState(String(settings?.shippingUgx ?? 15000));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await api("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ ...settings, shippingUgx: Number(shippingUgx) }),
      });
      setShippingUgx(String(data.settings.shippingUgx));
      setMessage("Shipping fee saved.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tab-content">
      <h2>Site Settings</h2>
      <form className="admin-form settings-form" onSubmit={saveSettings}>
        <div className="form-group">
          <label htmlFor="settings-shipping-fee">Out-of-Kampala shipping fee (UGX)</label>
          <input id="settings-shipping-fee" type="number" min="0" step="1000" required value={shippingUgx} onChange={(event) => setShippingUgx(event.target.value)} />
          <small>Kampala delivery remains free. This fee applies automatically to every other city.</small>
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save shipping fee"}</button>
        {message && <p className="form-status">{message}</p>}
      </form>
    </div>
  );
}
