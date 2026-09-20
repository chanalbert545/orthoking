import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import "../styles/public-pages.css";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || searchParams.get("OrderMerchantReference");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) return;

    let cancelled = false;
    let pollTimer;
    async function loadStatus() {
      try {
        const data = await api(`/api/orders/${encodeURIComponent(orderNumber)}/status`);
        if (cancelled) return;
        setOrder(data);
        if (data.paymentMethod === "mtn" && data.paymentStatus === "pending") {
          await api(`/api/orders/${encodeURIComponent(orderNumber)}/payments/mtn/status`);
          pollTimer = window.setTimeout(loadStatus, 5000);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Payment status is still being verified.");
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
      window.clearTimeout(pollTimer);
    };
  }, [orderNumber]);

  const paymentStatus = order?.paymentStatus || "pending";
  const isPaid = paymentStatus === "completed";
  const isFailed = ["failed", "cancelled"].includes(paymentStatus);

  return (
    <div className="content-page payment-result-page">
      <section className="page-hero payment-result-hero">
        <p className="eyebrow">{isPaid ? "Payment confirmed" : isFailed ? "Payment not completed" : "Payment verification"}</p>
        <h1>{isPaid ? "Thank you for your order." : isFailed ? "We could not confirm this payment." : "We are verifying your payment."}</h1>
        <p>
          {isPaid ? "Your payment has been successfully confirmed, and we have received your order." : "Please keep this page open while we check the payment status with the payment provider."}
        </p>
      </section>
      <section className="payment-result-content">
        <div className="payment-result-mark" aria-hidden="true">{isPaid ? "✓" : isFailed ? "!" : "..."}</div>
        {error && <p className="error-message">{error}</p>}
        {order && (
          <dl className="payment-reference">
            <div><dt>Order number</dt><dd>{order.orderNumber}</dd></div>
            <div><dt>Customer</dt><dd>{order.customerName}</dd></div>
            <div><dt>Amount</dt><dd>UGX {Number(order.totalUgx).toLocaleString()}</dd></div>
            <div><dt>Payment status</dt><dd>{order.paymentStatus}</dd></div>
            <div><dt>Order status</dt><dd>{order.orderStatus}</dd></div>
          </dl>
        )}
        <div className="payment-result-actions">
          {order && <Link className="button button-dark" to={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}>Track order</Link>}
          <Link className="button button-dark" to="/shop">Continue shopping</Link>
          <Link className="button payment-result-secondary" to="/">Back to home</Link>
        </div>
      </section>
    </div>
  );
}
