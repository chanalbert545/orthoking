import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../features/cart/CartContext.jsx";
import { CartAddedModal } from "../components/CartAddedModal.jsx";
import "../styles/shop.css";

const categoryNames = [
  "Box Euro Top Hybrid -- Carbon Memory Foam Range",
  "Box Euro Top Hybrid -- Natural Latex Foam Range",
  "Tight Top Firm Hybrid Pocket Spring Range",
  "Dual Nano Spring Collection (Japanese Patented Technology)",
  "Turkish Dr. Ortho Spring Range (Compressed Pocket Spring)",
];

const sizePriority = ["queen", "king", "small"];
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [promotions, setPromotions] = useState([]);
  const [addedProductId, setAddedProductId] = useState(null);
  const [cartAddedItem, setCartAddedItem] = useState(null);
  const categoryScrollerRef = useRef(null);
  const { addItem } = useCart();

  const availableCategoryNames = useMemo(() => {
    const apiCategoryNames = categories.map((category) => category.name);
    return [...new Set([...apiCategoryNames, ...categoryNames])];
  }, [categories]);

  useEffect(() => {
    loadCategories();
    api("/api/promotions?active=true&limit=4").then((data) => setPromotions(data.promotions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts(1, false);
  }, [selectedCategory, search]);

  async function loadCategories() {
    try {
      const data = await api("/api/categories");
      setCategories(data.categories || data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  async function loadProducts(page = 1, append = false) {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 100);
      params.append("active", "true");
      params.append("listing", "true");
      if (search.trim()) params.append("search", search.trim());
      const category = categories.find((item) => item.name === selectedCategory);
      if (category?.id) params.append("categoryId", category.id);

      const data = await api(`/api/products?${params}`);
      setProducts((current) => append ? [...current, ...(data.products || [])] : (data.products || []));
      setHasMore(Boolean(data.hasMore ?? data.pagination?.hasMore));
      setError(null);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
      const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase()) || product.variants?.some((variant) => variant.size?.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const productSizeCards = useMemo(() => visibleProducts
    .flatMap((product) => {
      const variants = product.variants?.filter((variant) => variant.isActive !== false) || [];
      return variants.length > 0
        ? variants.map((variant) => ({ product, variant }))
        : [{ product, variant: null }];
    })
    .sort((first, second) => {
      const furnitureNameTerms = ["sofa", "night stand", "nightstand", "tv stand", "genuine leather", "vegan leather", "adjustable bed", " bed"];
      const firstProductText = `${first.product.name || ""} ${first.product.category?.name || ""} ${first.product.category?.slug || ""}`.toLowerCase();
      const secondProductText = `${second.product.name || ""} ${second.product.category?.name || ""} ${second.product.category?.slug || ""}`.toLowerCase();
      const firstIsHomeFurniture = firstProductText.includes("furniture") || furnitureNameTerms.some((term) => firstProductText.includes(term));
      const secondIsHomeFurniture = secondProductText.includes("furniture") || furnitureNameTerms.some((term) => secondProductText.includes(term));
      if (firstIsHomeFurniture !== secondIsHomeFurniture) {
        return Number(firstIsHomeFurniture) - Number(secondIsHomeFurniture);
      }
      const firstIndex = sizePriority.indexOf(first.variant?.size?.trim().toLowerCase());
      const secondIndex = sizePriority.indexOf(second.variant?.size?.trim().toLowerCase());
      return (firstIndex < 0 ? sizePriority.length : firstIndex) - (secondIndex < 0 ? sizePriority.length : secondIndex);
    }), [visibleProducts]);

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

  function handleAddToCart(product, variant) {
    if (!variant || variant.stock < 1) return;
    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      size: variant.size,
      thickness: variant.thickness,
      color: variant.color,
      regularPriceUgx: variant.regularPriceUgx,
      quantity: 1,
    });
    setAddedProductId(product.id);
    setCartAddedItem({
      productName: `${product.name} (${variant.size})`,
      priceLabel: `UGX ${Number(variant.regularPriceUgx).toLocaleString()}`,
    });
    window.setTimeout(() => setAddedProductId(null), 1800);
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
        {cartAddedItem && (
          <CartAddedModal
            productName={cartAddedItem.productName}
            priceLabel={cartAddedItem.priceLabel}
            onClose={() => setCartAddedItem(null)}
          />
        )}
        {false && promotionProducts.length > 0 && <aside className="promotion-rail"><p className="eyebrow">Limited-time offers</p><h2>Shop the sale</h2>{promotionProducts.slice(0, 4).map((product) => { const promotion = promotions.find((item) => item.productId === product.id); const image = product.images?.[0]?.publicUrl; return <Link to={`/products/${product.slug}`} className="promotion-rail-item" key={product.id}>{image && <img src={image} alt="" loading="lazy" decoding="async" />}<div><strong>{product.name}</strong><span>{promotion ? promotion.discountType === "percent" ? `${promotion.percent}% off` : `UGX ${promotion.amountUgx?.toLocaleString()} off` : "Special offer"}</span></div></Link>; })}<Link to="/promotions" className="red-link">View all offers →</Link></aside>}
          {loading ? (
            <div className="products-grid shop-skeleton-grid" aria-label="Loading products">
              {Array.from({ length: 4 }, (_, index) => (
                <div className="product-card shop-skeleton-card" key={index}>
                  <div className="shop-skeleton-image" />
                  <div className="shop-skeleton-info"><span /><span /></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="error">Error: {error}</div>
          ) : visibleProducts.length === 0 ? (
            <div className="no-products">No products found</div>
          ) : (
            <>
              <div className="products-grid">
                {productSizeCards.map(({ product, variant }) => {
                  const image = product.images?.[0];
                  const imageUrl = image?.publicUrl || product.image;
                  const displayName = variant?.size ? `${product.name} (${variant.size})` : product.name;
                  const priceVariant = variant || preferredVariant(product.variants);
                  const card = <>
                    <div className="product-image-wrap">{imageUrl ? <img src={imageUrl} alt={image?.altText || displayName} className="product-image" loading="lazy" decoding="async" /> : <div className="image-placeholder">No image</div>}</div>
                    <div className="product-info">
                      <h3>{displayName}</h3>
                      {product.description && (
                        <p className="product-description">
                          {product.description.substring(0, 100)}...
                        </p>
                      )}
                      {priceVariant?.regularPriceUgx && <p className="product-price">UGX {priceVariant.regularPriceUgx.toLocaleString()}</p>}
                      {priceVariant?.formerPriceUgx && <p className="former-price">UGX {priceVariant.formerPriceUgx.toLocaleString()}</p>}
                    </div>
                  </>;
                    const canAddToCart = Boolean(priceVariant && priceVariant.stock > 0);
                    return <article key={`${product.id}-${variant?.id || "default"}`} className="product-card">
                      {product.slug ? <Link to={`/products/${product.slug}`} className="product-card-link">{card}</Link> : card}
                      <button className="shop-add-button" type="button" disabled={!canAddToCart} onClick={() => handleAddToCart(product, priceVariant)}>
                        {!canAddToCart ? "Out of stock" : addedProductId === product.id ? "Added to cart" : "Add to cart"}
                      </button>
                    </article>;
                })}
              </div>
              {hasMore && (
                <button className="shop-load-more" type="button" onClick={() => loadProducts(products.length / 100 + 1, true)} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load more products"}
                </button>
              )}
            </>
          )}
        </main>
    </div>
  );
}
