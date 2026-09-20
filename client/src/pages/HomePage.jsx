import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaqSection } from "../components/FaqSection.jsx";
import { api } from "../lib/api.js";
import "../styles/home.css";

const slides = [
  { title: "Genuine Turkish Orthopedic\u00a0Mattresses", text: "Orthopedic mattresses made with quality materials and thoughtful support for every night.", image: "/assets/hero5.webp", mobileImage: "/assets/mobile%201.jpg" },
  { title: "Genuine Turkish Orthopedic\u00a0Mattresses", text: "Choose the feel and finish that make your bedroom feel like home.", image: "/assets/hero1.jpeg", mobileImage: "/assets/mobile%202.jpg" },
    { title: "Better Support for a Happier Back.", text: "Experience exceptional comfort and support for a deeper, healthier night's sleep.", image: "/assets/drs.webp", mobileImage: "/assets/mobile%203.jpg" },
];
const categories = [
  ["Orthopedic Mattresses", "Supportive comfort for restorative sleep.", "/assets/orth.jpeg"],
  ["Pillows & Toppers", "The finishing touch to your sleep setup.", "/assets/toppers.jpeg"],
  ["Home & Hotel Solutions", "Reliable comfort for every room.", "/assets/home.jpeg"],
];
const fallback = [
  ["Cool Fabric Milano", "/assets/coolfabricmilano.png"],
  ["Smart Milano", "/assets/smartmillano.png"],
  ["Super Luxe", "/assets/superluxe.png"],
  ["Super Rio", "/assets/superrio.png"],
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
  useEffect(() => { api("/api/products?limit=4&active=true&listing=true").then((data) => setProducts(data.products || [])).catch(() => {}); api("/api/blog/posts?limit=3").then((data) => setBlogs(data.posts || [])).catch(() => {}); api("/api/promotions?active=true&limit=1").then((data) => setPromotions(data.promotions || [])).catch(() => {}); }, []);
  useEffect(() => { const timer = window.setInterval(() => setSlide((current) => (current + 1) % slides.length), 6000); return () => window.clearInterval(timer); }, []);
  const shownProducts = products.length ? products.slice(0, 4) : fallback.map(([name, image], index) => ({ id: index, slug: "", name, image }));
  return <div className="euro-home">
    <section className="euro-hero"><picture><source media="(max-width: 800px)" srcSet={slides[slide].mobileImage} /><img src={slides[slide].image} alt="Comfortable bedroom" /></picture><div className="euro-hero-shade" /><div className="euro-hero-copy"><h1>{slides[slide].title}</h1><p>{slides[slide].text}</p><div><Link to="/shop" className="euro-button gold">Shop Now</Link></div></div><div className="slide-dots">{slides.map((item, index) => <button key={item.title} className={slide === index ? "selected" : ""} onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}`} />)}</div></section>
    {promotions.length > 0 && <section className="home-promotion-banner"><div className="promotion-copy"><p className="eyebrow">New month sale <span className="promotion-discount" aria-label="40 percent off">40% <small>off</small></span></p><h2>Sleep better for less.</h2><p>Selected mattresses are now available at a special price.</p></div><CountdownTimer endsAt={promotions[0].endsAt} /><Link to="/shop" className="euro-button gold">Shop the sale</Link></section>}
    <section className="home-services" aria-label="Store benefits"><div><b>Made In Turkiye</b><span>Genuine imported quality</span></div><div><b>Four Branches</b><span>Countrywide reach</span></div><div><b>5-year warranty</b><span>On every mattress</span></div><div><b>Free delivery</b><span>Around Kampala</span></div></section>
    <section className="euro-section product-section collection-section"><div className="euro-heading collection-heading"><p className="eyebrow">The collection</p><h2>Our Bestselling Mattresses</h2></div><div className="product-row">{shownProducts.map((product) => { const variant = product.variants?.[0]; const currentPrice = variant?.regularPriceUgx || product.price; const formerPrice = variant?.formerPriceUgx; const discount = currentPrice && formerPrice ? Math.round((1 - currentPrice / formerPrice) * 100) : null; return <Link to={product.slug ? `/products/${product.slug}` : "/shop"} className="home-product" key={product.id}><div className="collection-image-wrap">{discount > 0 && <span className="collection-discount">-{discount}% OFF</span>}<img src={product.images?.[0]?.publicUrl || product.image} alt={product.name} /></div><div className="collection-product-info"><h3>{product.name}</h3>{formerPrice && <span className="collection-former-price">UGX {formerPrice.toLocaleString()}</span>}{currentPrice && <b>UGX {currentPrice.toLocaleString()}</b>}</div></Link>; })}</div><Link to="/shop" className="collection-view-all">View all products →</Link></section>
    <section className="euro-section find-your-fit-section"><div className="euro-heading"><p className="eyebrow">Find your fit</p><h2>Explore our collections</h2><p>From everyday essentials to elevated comfort, find what belongs in your room.</p></div><div className="category-row">{categories.map(([title, text, image]) => <Link to="/shop" className="category-card" key={title}><img src={image} alt="" /><div><h3>{title}</h3><p>{text}</p><span>Explore collection →</span></div></Link>)}</div></section>
    {blogs.length > 0 && <section className="euro-section journal"><div className="euro-heading row"><div><p className="eyebrow">From the journal</p><h2>Notes for better sleep</h2></div><Link to="/blog" className="red-link">Read all articles →</Link></div><div className="article-row">{blogs.map((blog) => <Link to={`/blog/${blog.slug}`} key={blog.id}><div>{blog.featuredImageUrl && (blog.mediaType === "video" ? <video src={blog.featuredImageUrl} muted playsInline /> : <img src={blog.featuredImageUrl} alt="" />)}</div><p className="eyebrow">Sleep well</p><h3>{blog.title}</h3><span>{blog.ctaText || "Read article"} →</span></Link>)}</div></section>}
    <FaqSection />
  </div>;
  }
