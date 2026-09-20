import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import "../styles/public-pages.css";

export function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const data = await api(`/api/orders/${encodeURIComponent(orderNumber.trim())}/track?phone=${encodeURIComponent(phone.trim())}`);
      setOrder(data);
    } catch (requestError) {
      setError(requestError.message || "Order not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-page">
      <section className="page-hero">
        <p className="eyebrow">Order tracking</p>
        <h1>Track your order.</h1>
        <p>Enter the order number and phone number used at checkout.</p>
      </section>
      <section className="payment-result-content">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="form-group"><label htmlFor="track-order-number">Order number</label><input id="track-order-number" required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Order UUID" /></div>
          <div className="form-group"><label htmlFor="track-phone">Phone number</label><input id="track-phone" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone used at checkout" /></div>
          {error && <p className="error-message">{error}</p>}
          <button className="button button-dark" type="submit" disabled={loading}>{loading ? "Checking..." : "Track order"}</button>
        </form>
        {order && <div className="payment-reference"><h2>Order status</h2><p><strong>Order:</strong> {order.orderNumber}</p><p><strong>Payment:</strong> {order.paymentStatus}</p><p><strong>Delivery:</strong> {order.orderStatus}</p><p><strong>Total:</strong> UGX {Number(order.totalUgx).toLocaleString()}</p>{order.items?.map((item) => <p key={`${item.productName}-${item.size}`}><strong>{item.productName}</strong> ({item.size}) x{item.quantity}</p>)}</div>}
        <Link className="button payment-result-secondary" to="/shop">Continue shopping</Link>
      </section>
    </div>
  );
}