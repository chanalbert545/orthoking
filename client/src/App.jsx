import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./lib/api.js";
import { AdminLayout } from "./layouts/AdminLayout.jsx";
import { PublicLayout } from "./layouts/PublicLayout.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { AdminLoginPage } from "./pages/AdminLoginPage.jsx";
import { BlogPage } from "./pages/BlogPage.jsx";
import { BlogPostPage } from "./pages/BlogPostPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { ContactPage } from "./pages/ContactPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { ProductPage } from "./pages/ProductPage.jsx";
import { PromotionsPage } from "./pages/PromotionsPage.jsx";
import { ShopPage } from "./pages/ShopPage.jsx";

export default function App() {
  const [settings, setSettings] = useState({});
  const [admin, setAdmin] = useState(undefined);

  useEffect(() => {
    api("/api/settings")
      .then((data) => setSettings(data.settings || {}))
      .catch(() => setSettings({}));

    api("/api/auth/me")
      .then((data) => setAdmin(data.user))
      .catch(() => setAdmin(null));
  }, []);

  return (
    <Routes>
      <Route
        path="/*"
        element={
          <PublicLayout settings={settings}>
            <Routes>
              <Route path="/" element={<HomePage settings={settings} />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/products/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage settings={settings} />} />
              <Route path="/about" element={<AboutPage settings={settings} />} />
              <Route
                path="/contact"
                element={<ContactPage settings={settings} />}
              />
              <Route path="/products" element={<Navigate to="/shop" replace />} />
              <Route path="/gallery" element={<Navigate to="/shop" replace />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="*" element={<p className="page">Page not found.</p>} />
            </Routes>
          </PublicLayout>
        }
      />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          admin === undefined ? (
            <p className="page">Loading…</p>
          ) : admin ? (
            <AdminLayout user={admin}>
              <AdminDashboardPage user={admin} settings={settings} />
            </AdminLayout>
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
    </Routes>
  );
}
