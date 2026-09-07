import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import "../styles/home.css";

const slides = [
  { title: "For High Quality Orthopedic Mattresses", text: "Orthopedic mattresses made with quality materials and thoughtful support for every night.", image: "/assets/hero5.webp" },
  { title: "Comfort made for the way you sleep.", text: "Choose the feel and finish that make your bedroom feel like home.", image: "/assets/hero1.jpeg" },
    { title: "Better Support for a Happier Back.", text: "Experience exceptional comfort and support for a deeper, healthier night's sleep.", image: "/assets/drs.webp" },
];
const categories = [
  ["Orthopedic Mattresses", "Supportive comfort for restorative sleep.", "/assets/orth.jpeg"],
  ["Pillows & Toppers", "The finishing touch to your sleep setup.", "/assets/toppers.jpeg"],
  ["Home & Hotel Solutions", "Reliable comfort for every room.", "/assets/home.jpeg"],
];
const gallery = ["/assets/WhatsApp Image 2026-08-24 at 22.09.44.jpeg", "/assets/WhatsApp Image 2026-08-24 at 22.09.45 (1).jpeg", "/assets/WhatsApp Image 2026-08-24 at 22.09.48.jpeg", "/assets/WhatsApp Image 2026-08-24 at 22.09.49.jpeg"];
const fallback = [
  ["Cool Fabric Milano", "/assets/coolfabricmilano.png"],
  ["Smart Milano", "/assets/smartmillano.png"],
  ["Super Luxe", "/assets/superluxe.png"],
  ["Super Rio", "/assets/superrio.png"],
];
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

function CountdownTimer({ endsAt, compact = false }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return <div className={`countdown-timer${compact ? " compact" : ""}`} aria-label="Promotion countdown"><span><b>{String(days).padStart(2, "0")}</b><small>Days</small></span><span><b>{String(hours).padStart(2, "0")}</b><small>Hours</small></span><span><b>{String(minutes).padStart(2, "0")}</b><small>Minutes</small></span><span><b>{String(seconds).padStart(2, "0")}</b><small>Seconds</small></span></div>;
}

export function HomePage({ settings }) {
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [slide, setSlide] = useState(0);
  useEffect(() => { api("/api/products?limit=8").then((data) => setProducts(data.products || [])).catch(() => {}); api("/api/blog/posts?limit=3").then((data) => setBlogs(data.posts || [])).catch(() => {}); api("/api/promotions?active=true&limit=20").then((data) => setPromotions(data.promotions || [])).catch(() => {}); }, []);
  useEffect(() => { const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 6000); return () => window.clearInterval(timer); }, []);
  const shownProducts = products.length ? products.slice(0, 4) : fallback.map(([name, image], index) => ({ id: index, slug: "", name, image }));
  return <div className="euro-home">
    <section className="euro-hero"><img src={slides[slide].image} alt="Comfortable bedroom" /><div className="euro-hero-shade" /><div className="euro-hero-copy"><h1>{slides[slide].title}</h1><p>{slides[slide].text}</p><div><Link to="/shop" className="euro-button gold">Shop mattresses</Link><Link to="/about" className="euro-button light">Our story</Link></div></div><div className="slide-dots">{slides.map((item, index) => <button key={item.title} className={slide === index ? "selected" : ""} onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}`} />)}</div></section>
    {promotions.length > 0 && <section className="home-promotion-banner"><div><p className="eyebrow">Limited-time offer</p><h2>{promotions[0].name || "Promotion"}</h2><p>Special prices are available across selected mattresses while this offer lasts.</p></div><CountdownTimer endsAt={promotions[0].endsAt} /><Link to="/shop" className="euro-button gold">Shop the sale</Link></section>}
    <section className="home-services"><div><b>Made In Turkiye</b><span>Genuine imported quality</span></div><div><b>Four Branches</b><span>Countrywide reach</span></div><div><b>5-year warranty</b><span>On every mattress</span></div><div><b>Free delivery</b><span>Around Kampala</span></div></section>
    <section className="euro-section"><div className="euro-heading"><p className="eyebrow">Find your fit</p><h2>Explore our collections</h2><p>From everyday essentials to elevated comfort, find what belongs in your room.</p></div><div className="category-row">{categories.map(([title, text, image]) => <Link to="/shop" className="category-card" key={title}><img src={image} alt="" /><div><h3>{title}</h3><p>{text}</p><span>Explore collection →</span></div></Link>)}</div></section>
    <section className="euro-section product-section"><div className="euro-heading row"><div><p className="eyebrow">The collection</p><h2>Made for better mornings</h2></div><Link to="/shop" className="red-link">View all products →</Link></div><div className="product-row">{shownProducts.map((product) => <Link to={product.slug ? `/products/${product.slug}` : "/shop"} className="home-product" key={product.id}><div><img src={product.images?.[0]?.publicUrl || product.image} alt={product.name} /></div><h3>{product.name}</h3><p>Orthopedic mattress</p>{product.price && <b>UGX {product.price.toLocaleString()}</b>}</Link>)}</div></section>
    <section className="home-feature"><div><p className="eyebrow">New Arrivals</p><h2> Turkiye Cool Fabric Collection</h2><p>Our latest shipment of orthopedic mattresses, made in Turkiye with cool fabric and anti-static material, currently
at 40% off. Four finishes available in-branch: charcoal grey, cream, navy-trim white, and grey-diamond quilted.
  Contact a branch for current sizes and pricing on this collection.</p><div className="product-range-index"><h3>Product Range Quick Index</h3><ul>{productRangeIndex.map(([name, description]) => <li key={name}><strong>{name}</strong><span>{description}</span></li>)}</ul></div><Link to="/about" className="euro-button navy">Discover More</Link></div><img src={gallery[0]} alt="Bright comfortable bedroom" /></section>
    <section className="belona-section"><div className="belona-copy"><p className="eyebrow">Premium Collection &amp; Bedroom Furniture</p><h2>Belona Turkish Classic</h2><p className="belona-lede">Our top-of-range orthopedic and posturopedic hybrid pocket-spring collection, currently discounted 40% off.</p><p>Designed for customers furnishing a complete bedroom or living space, Belona brings statement-making comfort beyond a standalone mattress.</p><div className="belona-actions"><Link to="/shop" className="euro-button navy">Explore mattresses</Link><Link to="/contact" className="red-link">Contact a branch →</Link></div></div><div className="belona-details"><div><h3>Belona Turkish Classic features</h3><ul><li>Genuine vegan leather headboard and upholstery options.</li><li>Genuine Turkish fabric covers.</li><li>Genuine Turkish leather trims.</li><li>Walnut veneer finished detailing.</li><li>Full orthopedic and posturopedic hybrid pocket-spring core.</li></ul></div><div><h3>Matching furniture range</h3><ul><li><strong>Electric Bed:</strong> adjustable electric bed base with heavy-duty stand.</li><li><strong>Venice Sofa:</strong> 3-seater sofa in genuine vegan leather.</li><li><strong>Venice TV Stand:</strong> matching bedroom or living-room TV console.</li></ul></div></div></section>
    <section className="euro-section"><div className="euro-heading"><p className="eyebrow">Inside Dr. Ortho King</p><h2>Comfort, in every detail</h2></div><div className="home-gallery">{gallery.map((image) => <Link to="/shop" key={image}><img src={image} alt="Dr. Ortho King interior" /></Link>)}</div></section>
    {blogs.length > 0 && <section className="euro-section journal"><div className="euro-heading row"><div><p className="eyebrow">From the journal</p><h2>Notes for better sleep</h2></div><Link to="/blog" className="red-link">Read all articles →</Link></div><div className="article-row">{blogs.map((blog) => <Link to={`/blog/${blog.slug}`} key={blog.id}><div>{blog.featuredImageUrl && (blog.mediaType === "video" ? <video src={blog.featuredImageUrl} muted playsInline /> : <img src={blog.featuredImageUrl} alt="" />)}</div><p className="eyebrow">Sleep well</p><h3>{blog.title}</h3><span>{blog.ctaText || "Read article"} →</span></Link>)}</div></section>}
    <section className="offers-section"><div className="offers-heading"><p className="eyebrow">Warranty, Guarantees &amp; Current Offers</p><h2>More comfort, more confidence.</h2><p>We stand behind every mattress with practical support, clear warranty terms, and offers that add value to your purchase.</p></div><div className="offers-grid"><article><span className="offer-number">5.1</span><h3>5-Year Warranty</h3><ul><li>Every orthopedic mattress carries a 5-year warranty as standard.</li><li>Covers manufacturing defects including spring failure, structural sagging beyond normal wear, and seam or cover defects under normal household use.</li><li>Keep your receipt or invoice, which is required for warranty claims.</li></ul></article><article><span className="offer-number">5.2</span><h3>Current Promotions</h3><ul><li>30% off most Hybrid Pocket Spring and Dual Nano Spring ranges.</li><li>40% off the Belona Turkish Classic premium collection and Turkiye Cool Fabric arrivals.</li></ul></article><article><span className="offer-number">5.3</span><h3>Free Gifts With Purchase</h3><ul><li>Free memory foam luxury pillow with any hybrid pocket-spring orthopedic mattress.</li><li>Select purchases may include 2 standard pillows plus a bedspread or comforter set.</li><li>Gift bundles vary by promotion period and branch stock; confirm the active offer before quoting.</li></ul></article><article><span className="offer-number">5.4</span><h3>Delivery</h3><ul><li>Free delivery anywhere around Kampala.</li><li>Deliveries to Mbarara and other upcountry areas can be arranged.</li><li>Confirm delivery fees and lead time with your branch for the specific location.</li></ul></article></div></section>
    <section className="technology-glossary"><div className="euro-heading"><p className="eyebrow">Mattress Technology Glossary</p><h2>What makes the difference?</h2><p>Every Dr. Ortho King mattress is built around one or more of these core technologies. Here is how each one affects the way a mattress feels and performs.</p></div><div className="technology-grid">{technologyGlossary.map(([name, description]) => <article key={name}><h3>{name}</h3><p>{description}</p></article>)}</div><p className="technology-summary"><strong>In short:</strong> Pocket spring means support and motion isolation. Nano spring adds a plush top layer. Memory, latex, and H.D. foam shape comfort and feel. Cooling fabric controls temperature. Firm edge support adds durability and full-surface usability.</p></section>
    <section className="home-contact"><p className="eyebrow">Need a hand choosing?</p><h2>Let's find your best night's sleep.</h2><p>Speak to our team on <a href={`tel:${settings.phones?.[0] || ""}`}>{settings.phones?.[0] || "+256 700 000 000"}</a></p><Link to="/contact" className="euro-button gold">Talk to us</Link></section>
  </div>;
  }
