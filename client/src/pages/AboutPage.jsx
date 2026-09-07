import { Link } from "react-router-dom";
import { FaqSection } from "../components/FaqSection.jsx";
import "../styles/public-pages.css";

const aboutImage = "/assets/WhatsApp Image 2026-08-24 at 22.09.48 (1).jpeg";

export function AboutPage({ settings }) {
  return <div className="content-page">
    <section className="page-hero"><p className="eyebrow">About us</p><h1> About Us</h1><p>All you need to know about our company and our mission.</p></section>
    <section className="story-section"><div><p className="eyebrow">Our approach</p><h2>Who Are We</h2><p>Dr. Ortho King is a Uganda-based retailer of premium, genuinely Turkish-made orthopedic and posturopedic
mattresses. We specialise in hybrid pocket-spring mattress technology -- engineering designed to relieve back
pain, reduce partner disturbance, and give every customer a healthier, more supportive night's sleep.
Every mattress we sell is manufactured in Turkiye using genuine imported components -- pocket springs,
memory foam, latex foam, and cooling fabrics -- and brought into Uganda for sale through our own branch
network. We are not a generic foam-mattress seller; our entire catalogue is built around orthopedic support,
spinal alignment, and long-term durability.</p><p>{settings.tagline || "Orthopedic mattresses for a healthy sleep."}</p><Link to="/shop" className="button button-dark">Shop the collection</Link></div><img src={aboutImage} alt="A calm, comfortable bedroom" /></section>
    <section className="values-section"><div><strong>01</strong><h3>Quality first</h3><p>Products selected for lasting comfort and daily use.</p></div><div><strong>02</strong><h3>Personal service</h3><p>Clear advice from a team that listens to your needs.</p></div><div><strong>03</strong><h3>Better living</h3><p>Because the way you sleep shapes the way you feel.</p></div></section>
    <section className="promise-section"><div className="about-section-heading"><p className="eyebrow">Our Promise</p><h2>Comfort you can trust.</h2></div><ul className="promise-list"><li>Genuine, Turkish-manufactured mattresses, never locally assembled imitations.</li><li>A minimum 5-year warranty on every orthopedic mattress we sell.</li><li>Free delivery anywhere around Kampala.</li><li>A free pillow or bedding gift with every mattress purchase.</li><li>In-branch guidance to help you find the firmness and support level that suits you.</li></ul></section>
    <section className="audience-section"><div className="about-section-heading"><p className="eyebrow">Who We Serve</p><h2>Support for every kind of space.</h2></div><div className="audience-grid"><div><strong>01</strong><h3>Homes and families</h3><p>For homeowners upgrading from an old, sagging, or unsupportive mattress.</p></div><div><strong>02</strong><h3>Hotels and lodges</h3><p>Durable, high-quality bulk orthopedic bedding for guesthouses and hospitality teams.</p></div><div><strong>03</strong><h3>Hospitals and clinics</h3><p>Posturopedic support surfaces designed for patient comfort.</p></div><div><strong>04</strong><h3>Furniture shoppers</h3><p>Matching bedroom furniture including TV stands, sofas, and electric adjustable beds.</p></div></div></section>
    <section className="social-section"><div className="social-section-inner"><p className="eyebrow">Find Us Everywhere</p><h2>Stay close to the collection.</h2><p>Dr. Ortho King is active across our social channels under the handle “Dr. Ortho King.” Follow along for product catalogues, promotions, and new arrivals.</p></div><div className="social-channel-list"><span>YouTube</span><span>WhatsApp</span><span>X (Twitter)</span><span>Facebook</span><span>TikTok</span><span>Instagram</span></div></section>
    <FaqSection />
  </div>;
}
