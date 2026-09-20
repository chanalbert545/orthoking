import { Link } from "react-router-dom";

export function CartAddedModal({ productName, priceLabel, onClose }) {
  return (
    <div className="cart-added-backdrop" role="presentation" onClick={onClose}>
      <div className="cart-added-modal" role="dialog" aria-modal="true" aria-label="Product added to cart" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="cart-added-close" aria-label="Close cart popup" onClick={onClose}>×</button>

        <div className="cart-added-body">
          <div className="cart-added-copy">
            <p className="eyebrow">What&apos;s included:</p>
            <ul>
              <li>2 free pillows</li>
            </ul>
          </div>

          <div className="cart-added-summary">
            <div className="cart-added-row">
              <div className="cart-added-count">1</div>
              <div className="cart-added-item">
                <div className="cart-added-thumb" aria-hidden="true">✓</div>
                <div className="cart-added-meta">
                  <span className="cart-added-name">{productName}</span>
                  <span className="cart-added-price">{priceLabel}</span>
                </div>
              </div>
            </div>
            <div className="cart-added-actions">
              <Link to="/cart" className="cart-added-button" onClick={onClose}>View cart</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
