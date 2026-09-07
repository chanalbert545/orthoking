import { Link } from "react-router-dom";
import { useCart } from "../features/cart/CartContext.jsx";
import "../styles/cart.css";

export function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart();

  const subtotal = items.reduce(
    (sum, item) => sum + item.regularPriceUgx * item.quantity,
    0
  );

  const shipping = items.length > 0 ? 15000 : 0; // Example shipping
  const total = subtotal + shipping;

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-container">
          {/* Cart Items */}
          <div className="cart-items">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Specifications</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.variantId} className="cart-item">
                    <td className="product-name">{item.productName}</td>
                    <td className="specs">
                      <div className="spec">Size: {item.size}</div>
                      <div className="spec">Thickness: {item.thickness}</div>
                      <div className="spec">Color: {item.color}</div>
                    </td>
                    <td className="price">
                      UGX {item.regularPriceUgx.toLocaleString()}
                    </td>
                    <td className="quantity">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.variantId,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                      />
                    </td>
                    <td className="line-total">
                      UGX {(item.regularPriceUgx * item.quantity).toLocaleString()}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-remove"
                        onClick={() => removeItem(item.variantId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>UGX {subtotal.toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span>UGX {shipping.toLocaleString()}</span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>UGX {total.toLocaleString()}</span>
              </div>

              <Link to="/checkout" className="btn btn-primary btn-block">
                Proceed to Checkout
              </Link>

              <Link to="/shop" className="btn btn-secondary btn-block">
                Continue Shopping
              </Link>

              <button
                className="btn btn-link"
                onClick={() => {
                  if (confirm("Clear your entire cart?")) {
                    clear();
                  }
                }}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
