import { Link, useSearchParams } from "react-router-dom";
import "../styles/public-pages.css";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const trackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  return (
    <div className="content-page payment-result-page">
      <section className="page-hero payment-result-hero">
        <p className="eyebrow">Payment received</p>
        <h1>Thank you for your order.</h1>
        <p>
          Pesapal has returned you to Dr.Ortho King. We are confirming your
          payment and will begin preparing your order shortly.
        </p>
      </section>
      <section className="payment-result-content">
        <div className="payment-result-mark" aria-hidden="true">✓</div>
        <h2>Your payment is being confirmed</h2>
        <p>
          Keep this page for your records. Our team will contact you using the
          details provided during checkout if anything else is needed.
        </p>
        {(trackingId || merchantReference) && (
          <dl className="payment-reference">
            {merchantReference && (
              <div>
                <dt>Order reference</dt>
                <dd>{merchantReference}</dd>
              </div>
            )}
            {trackingId && (
              <div>
                <dt>Payment reference</dt>
                <dd>{trackingId}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="payment-result-actions">
          <Link className="button button-dark" to="/shop">Continue shopping</Link>
          <Link className="button payment-result-secondary" to="/">Back to home</Link>
        </div>
      </section>
    </div>
  );
}
