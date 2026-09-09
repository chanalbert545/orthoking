import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../features/cart/CartContext.jsx";

export function PublicLayout({ settings, children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const phones = settings.phones || [];
  const branches = settings.branches || [];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className={location.pathname === "/" ? "public-site home-site" : "public-site"}>
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
      <a className="whatsapp-float" href="https://wa.me/256766530447" target="_blank" rel="noreferrer" aria-label="Chat with Dr. Ortho King on WhatsApp" title="Chat on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .4 5.2.4 11.7c0 2.1.6 4.1 1.6 5.9L.3 24l6.6-1.7a11.7 11.7 0 0 0 5.2 1.2h.1c6.4 0 11.7-5.2 11.7-11.7 0-3.1-1.2-6.1-3.4-8.3Zm-8.4 18c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3.9 1 1-3.8-.2-.3a9.7 9.7 0 1 1 8 4.5Zm5.3-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.3 3.5 5.6 4.9 2.1.9 2.5.7 3 .7.5 0 1.8-.7 2-1.3.3-.6.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4Z" /></svg><span>Chat on WhatsApp</span></a>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-help">
            <img className="footer-origin-logo" src="/assets/made-in-turkey.png" alt="Best quality, made in Turkey" />
            <h3>We're Here to Help</h3>
            <p className="footer-hours">All Working Days, 9am to 5pm EAT</p>
            <div className="footer-contact-grid">
              <div>
                <strong>Call or Whatsapp</strong>
                <p>{phones[0] || "0800 386 000 (Toll Free)"}</p>
                <p>{phones[1] || "0707 600 567 (Whatsapp)"}</p>
              </div>
              <div>
                <strong>Email</strong>
                <a href="mailto:orthoking824@gmail.com">orthoking824@gmail.com</a>
              </div>
            </div>
            <div className="footer-social">
              <span>Connect with us</span>
              <div>
                <a href="#facebook" aria-label="Facebook">f</a>
                <a href="https://x.com/DrOrthoKin33362" target="_blank" rel="noreferrer" aria-label="X">t</a>
                <a href="https://www.instagram.com/dr.ortho_king_ug/?hl=en" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a>
                <a href="https://www.tiktok.com/@dr..ortho.king.or" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a>
              </div>
            </div>
          </div>
          <div>
            <h3>Products</h3>
            <ul>
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
