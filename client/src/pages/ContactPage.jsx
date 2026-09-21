import { useState } from "react";
import { Seo } from "../components/Seo.jsx";
import "../styles/public-pages.css";

const branches = [
  ["Bukoto", "Bukoto-Kisaasi Road, next to Pepsi Depot"],
  ["Kisaasi", "Ntinda-Kisaasi Road, Loy Plaza"],
  ["Kyanja", "Kyanja Ring Road (opposite Maria Complex)"],
  ["Mbarara", "High Street, opposite UBA Bank"],
];

export function ContactPage({ settings }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const accessKey = "90d2d92d-6711-40f6-8a7d-33aacd8f3029";
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          to: "info@drorthoking.com",
          subject: "New website contact message",
          from_name: form.get("name"),
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Message could not be sent");
      setStatus("Message sent. We will get back to you.");
      formElement.reset();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <Seo
        title="Contact Dr. Ortho King"
        description="Talk to Dr. Ortho King for mattress advice, delivery questions, branch locations, and order support in Uganda."
        path="/contact"
      />
      <div className="content-page contact-page">
        <section className="page-hero contact-hero">
          <p className="eyebrow"></p>
          <h1 style={{ color: "white" }}>Reach Out To Us</h1>
          <p>Questions about a mattress, delivery or choosing the right support? Send us a note.</p>
        </section>

        <section className="contact-layout">
          <div>
            <p className="eyebrow">Talk to us</p>
            <h2 className="contact-phone">{(settings.phones || []).join(" or ") || "+256 700 000 000"}</h2>
            <p>Our team is ready to help you find a comfortable fit for your home.</p>
            <a className="map-link" href="https://maps.app.goo.gl/SooBTRkzLkrBZyfB8" target="_blank" rel="noreferrer">
              Kisaasi Showroom on Google Maps
            </a>
            <div className="map-frame">
              <iframe
                title="Kisaasi showroom map"
                src="https://www.google.com/maps?q=Kisaasi%20Showroom%20Kampala&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <label>
              Full name
              <input name="name" placeholder="Your name" required />
            </label>
            <label>
              Phone
              <input name="phone" placeholder="Your phone number" />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="you@example.com" />
            </label>
            <label>
              Message
              <textarea name="message" rows="5" placeholder="How can we help?" required />
            </label>
            {error && <p className="alert">{error}</p>}
            {status && <p className="form-status">{status}</p>}
            <button className="button button-dark" type="submit">Send message</button>
          </form>
        </section>

        <section className="ordering-section">
          <div className="ordering-heading">
            <p className="eyebrow">Ordering, payment &amp; delivery</p>
            <h2>Everything you need to place your order.</h2>
            <p>Choose the payment option that works best for you, then our team will arrange delivery.</p>
          </div>
          <div className="ordering-grid">
            <article>
              <span className="ordering-number">01</span>
              <h3>How to order</h3>
              <ul>
                <li>Call one of our sales lines, message us on WhatsApp, or visit any branch directly.</li>
                <li>Confirm the model, size, and current discounted price with a sales representative.</li>
                <li>Provide your preferred delivery location and choose a payment method that works for you.</li>
                <li>Collect your order or have it delivered directly to your home or business.</li>
              </ul>
            </article>
            <article>
              <span className="ordering-number">02</span>
              <h3>Payments</h3>
              <ul>
                <li>Cash, bank transfer, mobile money, and card payments may be available depending on branch and product.</li>
                <li>Confirm the accepted option before placing an order.</li>
                <li>Some offers may require upfront payment or a deposit.</li>
              </ul>
            </article>
            <article>
              <span className="ordering-number">03</span>
              <h3>Delivery</h3>
              <ul>
                <li>Free delivery around Kampala on eligible items.</li>
                <li>Deliveries outside Kampala can be coordinated on request.</li>
                <li>Our team can help with the best time slot for your purchase.</li>
              </ul>
            </article>
          </div>
          <div className="after-sales">
            <p className="eyebrow">After sales support</p>
            <h3>We stay with you after checkout.</h3>
            <p>Need help with assembly, warranty, or return questions? We are here to help.</p>
          </div>
        </section>

        <section className="branch-section">
          <h2>Visit a branch</h2>
          <div className="branch-table-wrap">
            <table className="branch-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Address</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(([name, address]) => (
                  <tr key={name}>
                    <th>{name}</th>
                    <td>{address}</td>
                    <td>{(settings.phones || [])[0] || "0800 386 000"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
