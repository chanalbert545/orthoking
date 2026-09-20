import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useCart } from "../features/cart/CartContext.jsx";

function formatCountdown(endsAt) {
  if (!endsAt) return "";

  const totalMs = new Date(endsAt).getTime() - Date.now();
  if (totalMs <= 0) return "expires soon";

  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${String(hours).padStart(2, "0")}h`);
  if (minutes || hours || days) parts.push(`${String(minutes).padStart(2, "0")}m`);
  parts.push(`${String(seconds).padStart(2, "0")}s`);

  return parts.slice(0, 3).join(" ");
}

export function PublicLayout({ settings, children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [promoEndsAt, setPromoEndsAt] = useState("");
  const [countdown, setCountdown] = useState("");
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const phones = settings.phones || [];
  const branches = settings.branches || [];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 500);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    api("/api/promotions?active=true&limit=20")
      .then((data) => {
        const nextPromotion = (data.promotions || [])[0];
        if (nextPromotion?.endsAt) {
          setPromoEndsAt(nextPromotion.endsAt);
        }
      })
      .catch(() => setPromoEndsAt(""));
  }, []);

  useEffect(() => {
    if (!promoEndsAt) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => setCountdown(formatCountdown(promoEndsAt));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [promoEndsAt]);

  const promoMessage = settings.promotionTitle || "Special offer";

  return (
    <div className={location.pathname === "/" ? "public-site home-site" : "public-site"}>
      <div className="header-topbar">
        <div className="header-topbar-message">
          <span className="header-topbar-promo">{promoMessage}</span>
          {countdown && <span className="header-topbar-countdown">Ends in {countdown}</span>}
        </div>
        <div className="header-topbar-contact">
          <a className="header-topbar-email" href="mailto:info@drorthoking.com"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3V5Zm0 1 9 7 9-7" /></svg><span>info@drorthoking.com</span></a>
          <a className="header-topbar-phone" href={`tel:${phones[0] || "0800386000"}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5 9.2 3l2 4.7-1.8 1.5a15 15 0 0 0 5.4 5.4l1.5-1.8 4.7 2-.5 2.6c-.2 1-1.1 1.7-2.1 1.6C10.8 18.1 5.9 13.2 5 5.6c-.1-1 .6-1.9 1.6-2.1Z" /></svg><span>{phones[0] || "0800 386 000"}</span></a>
        </div>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand">
            <img src="/logo.png" alt="Dr.Ortho King" />
          </NavLink>
          <div className="header-actions">
            <NavLink className="cart-link" to="/cart" aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`} title="Cart">
              <svg className="cart-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20.5 8H6" />
                <circle cx="10" cy="20" r="1.2" />
                <circle cx="18" cy="20" r="1.2" />
              </svg>
              <span className="cart-count">{count}</span>
            </NavLink>
          </div>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <svg className="menu-close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg> : <><span /><span /><span /></>}
          </button>
          <nav className={`nav${menuOpen ? " menu-open" : ""}`} aria-label="Main navigation">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/about" onClick={() => setMenuOpen(false)}>About Us</NavLink>
            <NavLink to="/products" onClick={() => setMenuOpen(false)}>Products</NavLink>
            <NavLink to="/blog" onClick={() => setMenuOpen(false)}>Blog</NavLink>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
            <NavLink to="/shop" className="shop-btn" onClick={() => setMenuOpen(false)}>Shop Now</NavLink>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      {showScrollTop && <button className="scroll-top-button" type="button" aria-label="Back to top" title="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>}
      <a className="whatsapp-float" href="https://wa.me/256767696979" target="_blank" rel="noreferrer" aria-label="Chat with Dr. Ortho King on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .4 5.2.4 11.7c0 2.1.6 4.1 1.6 5.9L.3 24l6.6-1.7a11.7 11.7 0 0 0 5.2 1.2h.1c6.4 0 11.7-5.2 11.7-11.7 0-3.1-1.2-6.1-3.4-8.3Zm-8.4 18c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3.9 1 1-3.8-.2-.3a9.7 9.7 0 1 1 8 4.5Zm5.3-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.3 3.5 5.6 4.9 2.1.9 2.5.7 3 .7.5 0 1.8-.7 2-1.3.3-.6.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4Z" /></svg><span>Chat on WhatsApp</span></a>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-help">
            <img className="footer-origin-logo" src="/assets/made-in-turkey.png" alt="Best quality, made in Turkey" />
            <h3>We're Here to Help</h3>
            <p className="footer-hours">All Working Days, 8am to 8pm EAT</p>
            <div className="footer-contact-grid">
              <div>
                <strong>Call or Whatsapp</strong>
                <p>{phones[0] || "0800 386 000 (Toll Free)"}</p>
                <p>{phones[1] || "0707 600 567 (Whatsapp)"}</p>
              </div>
              <div>
                <strong>Email</strong>
                <a href="mailto:info@drorthoking.com">info@drorthoking.com</a>
              </div>
            </div>
            <div className="footer-social">
              <span>Connect with us</span>
              <div>
                <a href="#facebook" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.3 0-5 1.7-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z" /></svg></a>
                <a href="https://x.com/DrOrthoKin33362" target="_blank" rel="noreferrer" aria-label="X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.2l3.1 4.4L16.2 4H19l-5.3 6.1L19.5 20h-4.2l-3.6-5.1L7.8 20H5l5.7-6.7L5 4Zm2.7 2 7.8 12h1.3L9 6H7.7Z" /></svg></a>
                <a href="https://www.instagram.com/dr.ortho_king_ug/?hl=en" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.3" cy="6.8" r="1" className="social-icon-fill" /></svg></a>
                <a href="https://www.tiktok.com/@dr..ortho.king.or" target="_blank" rel="noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h3.1c.3 1.8 1.4 3.1 3 3.7v3.1c-1.1-.1-2.1-.5-3-1.1V15a5 5 0 1 1-5-5v3.2a1.9 1.9 0 1 0 1.9 1.9V4Z" /></svg></a>
              </div>
            </div>
          </div>
          <div>
            <h3>Products</h3>
            <ul>
              <li><NavLink to="/shop">Classic Turkish Bed</NavLink></li>
              <li><NavLink to="/shop">Imported Genuine Leather Sofa</NavLink></li>
              <li><NavLink to="/shop">Recliner Chairs</NavLink></li>
              <li><NavLink to="/shop">Functional Electric Massage Bed (Heavy Duty)</NavLink></li>
              <li><NavLink to="/shop">Foam Mattresses</NavLink></li>
              <li><NavLink to="/shop">Spring Mattresses</NavLink></li>
              <li><NavLink to="/shop">Pillows</NavLink></li>
              <li><NavLink to="/shop">Cushions</NavLink></li>
              <li><NavLink to="/shop">Foam Sheets</NavLink></li>
              <li><NavLink to="/shop">Divans &amp; Headboards</NavLink></li>
            </ul>
          </div>
          <div>
            <h3>Our Branches</h3>
            <ul>
              <li><NavLink to="/contact">Bukoto</NavLink></li>
              <li><NavLink to="/contact">Kisaasi</NavLink></li>
              <li><NavLink to="/contact">Kyanja</NavLink></li>
              <li><NavLink to="/contact">Mbarara</NavLink></li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li><NavLink to="/about">About Us</NavLink></li>
              <li><NavLink to="/blog">News &amp; Events</NavLink></li>
              <li><NavLink to="/contact">Careers</NavLink></li>
              <li><NavLink to="/about">Giving Back</NavLink></li>
              <li><NavLink to="/contact">Contact us</NavLink></li>
              <li><NavLink to="/contact">Terms and Conditions</NavLink></li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          &copy; 2026 {settings.legalName || "Dr.Ortho King"}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
