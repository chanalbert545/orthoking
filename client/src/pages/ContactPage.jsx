import { useState } from "react";
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
      const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
      if (!accessKey) {
        throw new Error("Contact form is not configured yet");
      }

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
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

  return <div className="content-page contact-page"><section className="page-hero contact-hero"><p className="eyebrow">Contact</p><h1>We are here to help.</h1><p>Questions about a mattress, delivery or choosing the right support? Send us a note.</p></section><section className="contact-layout"><div><p className="eyebrow">Talk to us</p><h2 className="contact-phone">{(settings.phones || []).join(" or ") || "+256 700 000 000"}</h2><p>Our team is ready to help you find a comfortable fit for your home.</p><a className="map-link" href="https://maps.app.goo.gl/SooBTRkzLkrBZyfB8" target="_blank" rel="noreferrer">Kisaasi Showroom on Google Maps</a><div className="map-frame"><iframe title="Kisaasi showroom map" src="https://www.google.com/maps?q=Kisaasi%20Showroom%20Kampala&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></div><form onSubmit={onSubmit}><label>Full name<input name="name" placeholder="Your name" required /></label><label>Phone<input name="phone" placeholder="Your phone number" /></label><label>Email<input name="email" type="email" placeholder="you@example.com" /></label><label>Message<textarea name="message" rows="5" placeholder="How can we help?" required /></label>{error && <p className="alert">{error}</p>}{status && <p className="form-status">{status}</p>}<button className="button button-dark" type="submit">Send message</button></form></section><section className="ordering-section"><div className="ordering-heading"><p className="eyebrow">Ordering, payment &amp; delivery</p><h2>Everything you need to place your order.</h2><p>Choose the payment option that works best for you, then our team will arrange delivery.</p></div><div className="ordering-grid"><article><span className="ordering-number">01</span><h3>How to order</h3><ul><li>Call one of our sales lines, message us on WhatsApp, or visit any branch directly.</li><li>Confirm the model, size, and current discounted price with a sales representative.</li><li>Place your order and confirm your delivery address if it is outside the branch you are ordering from.</li><li>Free delivery is arranged for addresses around Kampala. Upcountry delivery, including the Mbarara area, can be arranged on request.</li></ul></article><article><span className="ordering-number">02</span><h3>Option A: Pay in full</h3><p>Pay in full via MTN MoMo Pay:</p><ol><li>Dial <strong>*165*3#</strong> on your MTN line.</li><li>Select <strong>Pay Merchant</strong> and enter merchant code <strong>725905</strong>.</li><li>The name on screen will show as <strong>Matelas Distributors</strong>. This is our registered business name.</li><li>Enter the agreed amount and complete the transaction.</li><li>Send a screenshot of the payment confirmation to your sales representative.</li></ol></article><article><span className="ordering-number">03</span><h3>Option B: Commitment fee</h3><p>Pay a small commitment fee and settle the balance in cash on delivery. This is not a deposit. It secures your exact size and delivery slot, and is fully deducted from the total on delivery.</p><ul><li><strong>Double / Queen:</strong> UGX 50,000</li><li><strong>King:</strong> UGX 100,000</li><li>Pay via MTN MoMo Pay using merchant code <strong>725905</strong>.</li><li>Pay the remaining balance in cash directly to the delivery team when the mattress arrives.</li></ul></article></div><div className="after-sales"><p className="eyebrow">After-sales</p><h3>Keep your receipt safe.</h3><p>Retain your receipt or invoice, as it is required for any 5-Year Warranty claim. For warranty claims, contact the branch where the mattress was purchased or call our main sales lines directly.</p></div></section><section className="branch-section"><h2>Our Branches</h2><div className="branch-table-wrap"><table className="branch-table"><thead><tr><th>Branch</th><th>Address</th></tr></thead><tbody>{branches.map(([name, address]) => <tr key={name}><th scope="row">{name}</th><td>{address}</td></tr>)}</tbody></table></div></section></div>;
}
