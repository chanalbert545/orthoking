import { useState } from "react";
import { api } from "../lib/api.js";

export function AdminLoginPage() {
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      window.location.assign("/admin");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page admin-login-page">
      <h1>Admin sign in</h1>
      <form onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        {error ? <p className="alert">{error}</p> : null}
        <button className="btn" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
