import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import "../styles/shop.css";

const categoryNames = [
  "Box Euro Top Hybrid -- Carbon Memory Foam Range",
  "Box Euro Top Hybrid -- Natural Latex Foam Range",
  "Tight Top Firm Hybrid Pocket Spring Range",
  "Dual Nano Spring Collection (Japanese Patented Technology)",
  "Turkish Dr. Ortho Spring Range (Compressed Pocket Spring)",
];

const sizePriority = ["small", "queen", "king"];
const promotionCutoff = new Date("2026-09-07T00:00:00Z");

function preferredVariant(variants = []) {
  const ordered = sizePriority
    .map((size) => variants.find((variant) => variant.size?.trim().toLowerCase() === size))
    .filter(Boolean);
  return ordered.find((variant) => variant.stock > 0) || ordered[0] || variants[0];
}

export function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [promotions, setPromotions] = useState([]);
  const categoryScrollerRef = useRef(null);

  const availableCategoryNames = useMemo(() => {
    const apiCategoryNames = categories.map((category) => category.name);
    return [...new Set([...apiCategoryNames, ...categoryNames])];
  }, [categories]);

  useEffect(() => {
    loadCategories();
    loadProducts();
    api("/api/promotions?active=true&limit=20").then((data) => setPromotions(data.promotions || [])).catch(() => {});
  }, []);

  async function loadCategories() {
    try {
      const data = await api("/api/categories");
      setCategories(data.categories || data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  async function loadProducts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", 1);
      params.append("limit", 50);

      const data = await api(`/api/products?${params}`);
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
      const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const promotionProducts = useMemo(() => {
    const explicitIds = new Set(promotions.map((promotion) => promotion.productId));
    return products.filter((product) => new Date(product.createdAt) <= promotionCutoff || explicitIds.has(product.id));
  }, [products, promotions]);

  function selectCategory(name) {
    setSelectedCategory(name);
  }

  function scrollCategories(direction) {
    categoryScrollerRef.current?.scrollBy({
      left: direction * Math.max(categoryScrollerRef.current.clientWidth * 0.8, 220),
      behavior: "smooth",
    });
  }

  return (
    <div className="shop-page">
      <div className="shop-toolbar">
        <div className="shop-category-scroller">
          <button className="category-scroll-button" type="button" aria-label="Previous categories" onClick={() => scrollCategories(-1)}>&lt;</button>
          <nav className="shop-categories" aria-label="Shop categories" ref={categoryScrollerRef}>
            <button className={!selectedCategory ? "active" : ""} onClick={() => setSelectedCategory("")}>All Products</button>
            {availableCategoryNames.map((name) => <button className={selectedCategory === name ? "active" : ""} key={name} onClick={() => selectCategory(name)}>{name}</button>)}
          </nav>
          <button className="category-scroll-button" type="button" aria-label="Next categories" onClick={() => scrollCategories(1)}>&gt;</button>
        </div>
        <label className="shop-search" htmlFor="shop-search">Filter by
          <input id="shop-search" type="search" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
          <span aria-hidden="true">☷</span>
        </label>
      </div>
      <main className="shop-products">
        {promotionProducts.length > 0 && <aside className="promotion-rail"><p className="eyebrow">Limited-time offers</p><h2>Shop the sale</h2>{promotionProducts.slice(0, 4).map((product) => { const promotion = promotions.find((item) => item.productId === product.id); const image = product.images?.[0]?.publicUrl; return <Link to={`/products/${product.slug}`} className="promotion-rail-item" key={product.id}>{image && <img src={image} alt="" loading="lazy" decoding="async" />}<div><strong>{product.name}</strong><span>{promotion ? promotion.discountType === "percent" ? `${promotion.percent}% off` : `UGX ${promotion.amountUgx?.toLocaleString()} off` : "Special offer"}</span></div></Link>; })}<Link to="/promotions" className="red-link">View all offers →</Link></aside>}
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error">Error: {error}</div>
          ) : visibleProducts.length === 0 ? (
            <div className="no-products">No products found</div>
          ) : (
            <>
              <div className="products-grid">
                {visibleProducts.map((product) => {
                  const productImage = product.images?.[0];
                  const variantImage = product.variants?.flatMap((variant) => variant.images || [])[0];
                  const image = productImage || variantImage;
                  const imageUrl = image?.publicUrl || product.image;
                  const priceVariant = preferredVariant(product.variants);
                  const card = <>
                    <div className="product-image-wrap">{imageUrl ? <img src={imageUrl} alt={image?.altText || product.name} className="product-image" loading="lazy" decoding="async" /> : <div className="image-placeholder">No image</div>}</div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      {product.description && (
                        <p className="product-description">
                          {product.description.substring(0, 100)}...
                        </p>
                      )}
                      {product.variants && product.variants.length > 0 && (
                        <p className="product-variants">
                          {product.variants.length} variant
                          {product.variants.length !== 1 ? "s" : ""}
                        </p>
                      )}
                      {priceVariant?.regularPriceUgx && (
                          <p className="product-price" style={{ color: "green" }}>
                            From UGX {priceVariant.regularPriceUgx.toLocaleString()}
                          </p>
                        )}
                    </div>
                  </>;
                  return product.slug ? <Link key={product.id} to={`/products/${product.slug}`} className="product-card">{card}</Link> : <article key={product.id} className="product-card">{card}</article>;
                })}
              </div>
            </>
          )}
        </main>
    </div>
  );
}
