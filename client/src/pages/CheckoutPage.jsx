import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../features/cart/CartContext.jsx";
import "../styles/checkout.css";

function getShippingFee() {
  return 0;
}

export function CheckoutPage({ settings }) {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pesapal");
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    country: "Uganda",
    notes: "",
  });

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <h1>Checkout</h1>
          <p>Your cart is empty. Add some products before checking out.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/shop")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.regularPriceUgx * item.quantity,
    0
  );
  const shipping = getShippingFee();
  const total = subtotal + shipping;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Prepare order items
      const orderItems = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      // Create order
      const orderData = {
        ...formData,
        deliveryAddress: [formData.address, formData.apartment, formData.city, formData.country].filter(Boolean).join(", "),
        items: orderItems,
        shippingUgx: shipping,
        discountUgx: 0,
        paymentMethod,
      };

      const response = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      // Clear the cart only after the payment page has been created.
      clear();
      if (response.paymentUrl) {
        window.location.assign(response.paymentUrl);
      } else {
        navigate(`/payment-success?orderNumber=${encodeURIComponent(response.id)}`);
      }
    } catch (err) {
      setError(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-heading">
        <p className="eyebrow">Secure checkout</p>
        <h1>Complete your order.</h1>
        <p>Enter your details and choose how you would like your order delivered.</p>
      </div>

      <div className="checkout-container">
        {/* Checkout Form */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="checkout-section">
            <div className="section-title"><span>01</span><div><h2>Contact information</h2><p>We will use these details to confirm your order.</p></div></div>
            <div className="checkout-fields">
              <div className="form-group full-field">
                <label htmlFor="customerName">Full name</label>
                <input id="customerName" type="text" name="customerName" required value={formData.customerName} onChange={handleChange} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone number</label>
                <input id="phone" type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+256 700 000 000" />
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <div className="section-title"><span>02</span><div><h2>Delivery address</h2><p>Where should we bring your order?</p></div></div>
            <div className="checkout-fields">
              <div className="form-group full-field"><label htmlFor="address">Address</label><input id="address" name="address" required value={formData.address} onChange={handleChange} placeholder="Street address" /></div>
              <div className="form-group"><label htmlFor="apartment">Apartment / suite</label><input id="apartment" name="apartment" value={formData.apartment} onChange={handleChange} placeholder="Apartment, suite, etc. (optional)" /></div>
              <div className="form-group"><label htmlFor="city">City</label><input id="city" name="city" required value={formData.city} onChange={handleChange} placeholder="Kampala" /></div>
              <div className="form-group full-field"><label htmlFor="country">Country</label><select id="country" name="country" required value={formData.country} onChange={handleChange}><option value="Uganda">Uganda</option></select></div>
            </div>
            <div className="shipping-choice"><span>Standard delivery</span><strong>{formData.city ? "FREE" : "Enter city"}</strong><small>{formData.city ? "Free delivery to all areas and locations." : "Enter your city to calculate delivery."}</small></div>
          </section>

          <section className="checkout-section">
            <div className="section-title"><span>03</span><div><h2>Payment</h2><p>All transactions are secure and encrypted.</p></div></div>
            <div className="payment-methods">
              <label className={`payment-choice ${paymentMethod === "pesapal" ? "selected" : ""}`}><input type="radio" name="paymentMethod" value="pesapal" checked={paymentMethod === "pesapal"} onChange={(event) => setPaymentMethod(event.target.value)} /><span className="payment-brand"><img src="/assets/pesapal-logo.png" alt="PesaPal" className="payment-brand-logo" /><strong>PesaPal</strong></span><span>Cards and mobile money</span></label>
            </div>
            <p className="payment-note">You will receive payment instructions after your order is validated.</p>
          </section>

          <section className="checkout-section">
            <div className="section-title"><span>04</span><div><h2>Order notes</h2><p>Optional instructions for our delivery team.</p></div></div>
            <div className="form-group full-field">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any special instructions..." rows="3" />
            </div>
          </section>

          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay now"}
          </button>

          <p className="terms">
            By completing this order, you agree to our terms and conditions.
          </p>
        </form>

        {/* Order Summary */}
        <aside className="order-summary">
          <div className="summary-heading"><h2>Your order</h2><button type="button" onClick={() => navigate("/cart")}>Edit cart</button></div>
          <div className="order-items">
            {items.map((item) => (
              <div key={item.variantId} className="order-item">
                <div className="item-thumb"><span>{item.quantity}</span><b>{item.productName.slice(0, 1)}</b></div>
                <div className="item-details"><h4>{item.productName}</h4><p className="specs">{item.size} · {item.thickness} · {item.color}</p></div>
                <div className="item-price">UGX {(item.regularPriceUgx * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <div className="total-row"><span>Subtotal</span><span>UGX {subtotal.toLocaleString()}</span></div>
            <div className="total-row"><span>Shipping</span><span>{shipping === 0 ? "FREE" : `UGX ${shipping.toLocaleString()}`}</span></div>
            <div className="total-row grand-total"><span>Total</span><strong><small>UGX</small> {total.toLocaleString()}</strong></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
