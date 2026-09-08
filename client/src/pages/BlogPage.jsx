import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, assetUrl } from "../lib/api.js";
import { FaqSection } from "../components/FaqSection.jsx";
import "../styles/public-pages.css";

export function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  useEffect(() => { api("/api/blog/posts?limit=12").then((data) => setBlogs(data.posts || [])).catch(() => {}); }, []);
  return <div className="content-page"><section className="page-hero"><p className="eyebrow">Journal</p><h1>Ideas for better sleep.</h1><p>Advice, care tips and simple ways to make your bedroom work harder for you.</p></section><section className="article-grid">{blogs.length ? blogs.map((blog) => <Link className="article-card" to={`/blog/${blog.slug}`} key={blog.id}>{blog.featuredImageUrl && (blog.mediaType === "video" ? <video src={assetUrl(blog.featuredImageUrl)} muted playsInline /> : <img src={assetUrl(blog.featuredImageUrl)} alt="" />)}<div><p className="eyebrow">Sleep well</p><h2>{blog.title}</h2><p>{blog.excerpt || blog.content?.slice(0, 130)}</p><span>{blog.ctaText || "Read article"} →</span></div></Link>) : <div className="empty-content"><h2>Your journal is coming soon.</h2><p>Add published posts from the admin area and they will appear here.</p></div>}</section><FaqSection /></div>;
}
