import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api.js";

export function AdminLayout({ user, children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    navigate("/admin/login");
  }

  return (
    <div>
      <header className="site-header admin-site-header">
        <div className={`header-inner${menuOpen ? " admin-menu-open" : ""}`}>
          <div className="brand">
            <img src="/logo.png" alt="" />
            {/*<div>
              <strong>Admin</strong>
              <span>{user?.email}</span>
            </div>*/}
          </div>
          <button className="admin-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <svg className="menu-close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg> : <><span /><span /><span /></>}
          </button>
          <nav id="admin-navigation" className={`nav admin-nav${menuOpen ? " menu-open" : ""}`}>
            <NavLink to="/admin" end onClick={() => setMenuOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/" onClick={() => setMenuOpen(false)}>View site</NavLink>
            <button className="admin-menu-signout" type="button" onClick={logout}>
              Sign out
            </button>
          </nav>
          <button className="btn secondary" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="page admin-main">{children}</main>
    </div>
  );
}
