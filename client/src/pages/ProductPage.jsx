import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../features/cart/CartContext.jsx";
import "../styles/product.css";

const sizePriority = ["small", "queen", "king"];

function preferredVariant(variants) {
  const ordered = sizePriority
    .map((size) => variants.find((variant) => variant.size.toLowerCase() === size))
    .filter(Boolean);
  const available = ordered.find((variant) => variant.stock > 0);
  return available || ordered[0] || variants[0];
}

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [stockNotice, setStockNotice] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  async function loadProduct() {
    try {
      setLoading(true);
      const data = await api(`/api/products/${slug}`);
      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(preferredVariant(data.variants));
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!selectedVariant) {
      setMessage("Please select a variant");
      return;
    }

    if (selectedVariant.stock < 1 || Number(quantity) > selectedVariant.stock) {
      setStockNotice(true);
      return;
    }

    cart.addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      size: selectedVariant.size,
      thickness: selectedVariant.thickness,
      color: selectedVariant.color,
      regularPriceUgx: selectedVariant.regularPriceUgx,
      quantity: parseInt(quantity),
    });

    setMessage("Added to cart!");
    setTimeout(() => setMessage(""), 3000);
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-page">
      <div className="product-container">
        {/* Product Images */}
        <div className="product-images">
          {product.images && product.images.length > 0 && (
            <>
              <img
                src={product.images[0].publicUrl}
                alt={product.images[0].altText || product.name}
                className="main-image"
              />
              {product.images.length > 1 && (
                <div className="thumbnail-images">
                  {product.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.publicUrl}
                      alt={img.altText || "Product"}
                      className="thumbnail"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {!product.images || product.images.length === 0 && (
            <div className="image-placeholder">No Images Available</div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-details">
          <div className="breadcrumb">
            <a onClick={() => navigate("/shop")}>Shop</a>
            {product.category && (
              <>
                <span> / </span>
                <a
                  onClick={() =>
                    navigate(`/shop?categoryId=${product.category.id}`)
                  }
                >
                  {product.category.name}
                </a>
              </>
            )}
            <span> / </span>
            <span>{product.name}</span>
          </div>

          <h1>{product.name}</h1>

          {selectedVariant && (
            <p className="starting-price">
              From UGX {selectedVariant.regularPriceUgx.toLocaleString()}
            </p>
          )}

          {product.description && (
            <div className="description">{product.description}</div>
          )}

          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="variants">
              <h3>Available Options</h3>
              <div className="variant-list">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`variant-option ${
                      selectedVariant?.id === variant.id ? "active" : ""
                    } ${variant.stock < 1 ? "out-of-stock" : ""}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div className="variant-specs">
                      <span className="size">{variant.size}</span>
                      <span className="thickness">{variant.thickness}</span>
                      <span className="color">{variant.color}</span>
                    </div>
                    <div className="variant-price">
                      UGX {variant.regularPriceUgx.toLocaleString()}
                    </div>
                    <div className="variant-stock">
                      {variant.stock > 0
                        ? `${variant.stock} remaining`
                        : "Out of stock"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          {selectedVariant && (
            <div className="cart-section">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedVariant.stock || 100}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>

              {message && <div className="message">{message}</div>}

              <div className="price-summary">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Unit Price:</span>
                  <span>UGX {selectedVariant.regularPriceUgx.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>
                    UGX{" "}
                    {(
                      selectedVariant.regularPriceUgx * quantity
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {stockNotice && (
        <div className="stock-modal-backdrop" role="presentation" onClick={() => setStockNotice(false)}>
          <div className="stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="stock-modal-title">Product out of stock</h2>
            <p>{selectedVariant?.size} size is currently unavailable. Please choose another size.</p>
            <button className="btn btn-primary" onClick={() => setStockNotice(false)}>Choose another size</button>
          </div>
        </div>
      )}
    </div>
  );
}
