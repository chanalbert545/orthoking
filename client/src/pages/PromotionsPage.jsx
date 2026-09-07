import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import "../styles/shop.css";
import "../styles/public-pages.css";

const promotionCutoff = new Date("2026-09-07T00:00:00Z");
const sizePriority = ["small", "queen", "king"];

function preferredVariant(variants = []) {
  const ordered = sizePriority
    .map((size) => variants.find((variant) => variant.size?.trim().toLowerCase() === size))
    .filter(Boolean);
  return ordered.find((variant) => variant.stock > 0) || variants.find((variant) => variant.stock > 0) || ordered[0] || variants[0];
}

export function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/api/promotions?active=true&limit=100"),
      api("/api/products?limit=100"),
    ]).then(([promotionData, productData]) => {
      setPromotions(promotionData.promotions || []);
      setProducts(productData.products || []);
    }).catch(() => {
      setPromotions([]);
      setProducts([]);
    }).finally(() => setLoading(false));
  }, []);

  const promotedProducts = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]));
    const explicitPromotions = new Map(promotions.map((promotion) => [promotion.productId, promotion]));
    return products
      .filter((product) => new Date(product.createdAt) <= promotionCutoff || explicitPromotions.has(product.id))
      .map((product) => ({ promotion: explicitPromotions.get(product.id), product: productMap.get(product.id) || product }));
  }, [products, promotions]);

  return <div className="content-page promotions-page"><section className="page-hero"><p className="eyebrow">Limited-time offers</p><h1>Shop all promotions.</h1><p>Explore every product currently included in our active offers.</p></section><main className="shop-products promotion-products">{loading ? <div className="loading">Loading promotions...</div> : promotedProducts.length === 0 ? <div className="empty-content"><h2>No active promotions right now.</h2><p>Check back soon for the next offer.</p><Link to="/shop" className="red-link">Browse all products →</Link></div> : <div className="products-grid">{promotedProducts.map(({ promotion, product }) => { const image = product.images?.[0]; const variant = preferredVariant(product.variants); const formerPrice = variant?.formerPriceUgx; const currentPrice = variant?.regularPriceUgx; return <Link key={product.id} to={`/products/${product.slug}`} className="product-card"><div className="product-image-wrap">{image?.publicUrl ? <img src={image.publicUrl} alt={image.altText || product.name} className="product-image" loading="lazy" decoding="async" /> : <div className="image-placeholder">No image</div>}</div><div className="product-info">{promotion && <p className="promotion-badge">{promotion.discountType === "percent" ? `${promotion.percent}% off` : `UGX ${promotion.amountUgx?.toLocaleString()} off`}</p>}<h3>{product.name}</h3>{formerPrice && <p className="former-price">Former price: UGX {formerPrice.toLocaleString()}</p>}{currentPrice && <p className="product-price">From: UGX {currentPrice.toLocaleString()}</p>}</div></Link>; })}</div>}</main></div>;
}
