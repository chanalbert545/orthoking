import { Link } from "react-router-dom";
import { FaqSection } from "../components/FaqSection.jsx";
import { Seo } from "../components/Seo.jsx";
import "../styles/public-pages.css";
import "../styles/home.css";

const aboutImage = "/assets/WhatsApp Image 2026-08-24 at 22.09.48 (1).jpeg";
const gallery = ["/assets/gal.jpeg", "/assets/gal2.jpeg", "/assets/gal3.jpeg", "/assets/gal4.jpeg"];
const productRangeIndex = [
  ["Tight Top", "Firmest everyday orthopedic option (10 inch)."],
  ["Super Luxe", "Value hybrid pocket spring with a box top, including Brown and Anthracite finishes."],
  ["Super Alaska", "Pillow top hybrid pocket spring with cool fabric."],
  ["Super Tesla", "Antistatic hybrid pocket spring with a pillow topper."],
  ["Carbon Memory Foam range", "Cooling memory-foam comfort layer."],
  ["Natural Latex Foam range", "Breathable, hypoallergenic comfort layer."],
  ["Dual Nano Spring range", "Cool Milano, Smart Milano, Cool Fiora, Super Rio and Casa Rio with Japanese patented dual-spring technology."],
];
const technologyGlossary = [
  ["Hybrid Pocket Spring System", "Hundreds of individually wrapped steel springs work independently to contour to the sleeper's body, isolate motion, and provide the foundation for nearly every Dr. Ortho King mattress."],
  ["Dual Nano Spring Topper", "A finer layer of miniature nano springs adds a plush, pressure-relieving top layer while preserving firm orthopedic support. This Japanese-patented technology features in the Milano, Rio, and Fiora ranges."],
  ["Carbon Infused Memory Foam", "Carbon particles improve heat dissipation while the slow-recovery foam provides body-hugging comfort and pressure relief around the shoulders and hips."],
  ["Natural Latex Foam", "A breathable, responsive, hypoallergenic topper with resistance to dust mites and long-term resilience against sagging."],
  ["High-Density H.D. Relief Foam", "Dense support foam combined with a hybrid pocket-spring core for a firmer, more durable feel and extra structural support."],
  ["Cooling / Antistatic Fabric", "A moisture-wicking, temperature-regulating cover used on Cool Fiora, Cool Fabric Milano, and Antistatic Tesla mattresses for warmer climates and hot sleepers."],
  ["Firm Edge Support & Foam Encasement", "A reinforced foam border that reduces roll-off, increases usable sleeping surface, and extends the mattress's structural life."],
];

export function AboutPage({ settings }) {
  return <>
    <Seo
      title="About Dr. Ortho King"
      description="Learn about Dr. Ortho King, our Turkish-made orthopedic mattresses, quality promise, and better sleep mission in Uganda."
      path="/about"
    />
    <div className="content-page about-page">
    <section className="page-hero page-hero-dark"><p className="eyebrow">About us</p><h1> About Us</h1><p>All you need to know about our company and our mission.</p></section>
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
    <section className="home-feature"><div><p className="eyebrow">New Arrivals</p><h2>Turkiye Cool Fabric Collection</h2><p>Our latest shipment of orthopedic mattresses, made in Turkiye with cool fabric and anti-static material, currently at 40% off. Four finishes available in-branch: charcoal grey, cream, navy-trim white, and grey-diamond quilted. Contact a branch for current sizes and pricing on this collection.</p><div className="product-range-index"><h3>Product Range Quick Index</h3><ul>{productRangeIndex.map(([name, description]) => <li key={name}><strong>{name}</strong><span>{description}</span></li>)}</ul></div><Link to="/shop" className="euro-button navy">Shop arrivals</Link></div><img src={aboutImage} alt="Dr. Ortho King storefront" /></section>
    <section className="belona-section"><div className="belona-copy"><p className="eyebrow">Premium Collection &amp; Bedroom Furniture</p><h2>Belona Turkish Classic</h2><p className="belona-lede">Our top-of-range orthopedic and posturopedic hybrid pocket-spring collection, currently discounted 40% off.</p><p>Designed for customers furnishing a complete bedroom or living space, Belona brings statement-making comfort beyond a standalone mattress.</p><div className="belona-actions"><Link to="/shop" className="euro-button navy">Explore mattresses</Link><Link to="/contact" className="red-link">Contact a branch →</Link></div></div><div className="belona-details"><div><h3>Belona Turkish Classic features</h3><ul><li>Genuine vegan leather headboard and upholstery options.</li><li>Genuine Turkish fabric covers.</li><li>Genuine Turkish leather trims.</li><li>Walnut veneer finished detailing.</li><li>Full orthopedic and posturopedic hybrid pocket-spring core.</li></ul></div><div><h3>Matching furniture range</h3><ul><li><strong>Electric Bed:</strong> adjustable electric bed base with heavy-duty stand.</li><li><strong>Venice Sofa:</strong> 3-seater sofa in genuine vegan leather.</li><li><strong>Venice TV Stand:</strong> matching bedroom or living-room TV console.</li></ul></div></div></section>
    <section className="euro-section about-gallery-section"><div className="euro-heading"><p className="eyebrow">Inside Dr. Ortho King</p><h2>Comfort, in every detail</h2></div><div className="home-gallery">{gallery.map((image) => <Link to="/shop" key={image}><img src={image} alt="Dr. Ortho King interior" /></Link>)}</div></section>
    <section className="offers-section"><div className="offers-heading"><p className="eyebrow">Warranty, Guarantees &amp; Current Offers</p><h2>More comfort, more confidence.</h2><p>We stand behind every mattress with practical support, clear warranty terms, and offers that add value to your purchase.</p></div><div className="offers-grid"><article><span className="offer-number">5.1</span><h3>5-Year Warranty</h3><ul><li>Every orthopedic mattress carries a 5-year warranty as standard.</li><li>Covers manufacturing defects including spring failure, structural sagging beyond normal wear, and seam or cover defects under normal household use.</li><li>Keep your receipt or invoice, which is required for warranty claims.</li></ul></article><article><span className="offer-number">5.2</span><h3>Current Promotions</h3><ul><li>30% off most Hybrid Pocket Spring and Dual Nano Spring ranges.</li><li>40% off the Belona Turkish Classic premium collection and Turkiye Cool Fabric arrivals.</li></ul></article><article><span className="offer-number">5.3</span><h3>Free Gifts With Purchase</h3><ul><li>Free memory foam luxury pillow with any hybrid pocket-spring orthopedic mattress.</li><li>Select purchases may include 2 standard pillows plus a bedspread or comforter set.</li><li>Gift bundles vary by promotion period and branch stock; confirm the active offer before quoting.</li></ul></article><article><span className="offer-number">5.4</span><h3>Delivery</h3><ul><li>Free delivery anywhere around Kampala.</li><li>Deliveries to Mbarara and other upcountry areas can be arranged.</li><li>Confirm delivery fees and lead time with your branch for the specific location.</li></ul></article></div></section>
    <section className="technology-glossary"><div className="euro-heading"><p className="eyebrow">Mattress Technology Glossary</p><h2>What makes the difference?</h2><p>Every Dr. Ortho King mattress is built around one or more of these core technologies. Here is how each one affects the way a mattress feels and performs.</p></div><div className="technology-grid">{technologyGlossary.map(([name, description]) => <article key={name}><h3>{name}</h3><p>{description}</p></article>)}</div><p className="technology-summary"><strong>In short:</strong> Pocket spring means support and motion isolation. Nano spring adds a plush top layer. Memory, latex, and H.D. foam shape comfort and feel. Cooling fabric controls temperature. Firm edge support adds durability and full-surface usability.</p></section>
    <FaqSection />
    </div>
  </>;
}
