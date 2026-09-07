import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import "../styles/public-pages.css";

export function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    api(`/api/blog/posts/${slug}`).then(setPost).catch(() => setPost(null));
  }, [slug]);

  return <div className="content-page"><article className="article-page"><p className="eyebrow">Dr. Ortho King journal</p><h1>{post?.title || slug?.replaceAll("-", " ") || "Article"}</h1>{post ? <><p className="article-lede">{post.excerpt}</p>{post.featuredImageUrl && (post.mediaType === "video" ? <video className="article-media" src={post.featuredImageUrl} controls /> : <img className="article-media" src={post.featuredImageUrl} alt="" />)}<div className="article-content">{post.content}</div>{post.ctaText && post.ctaUrl && <a className="button button-dark article-cta" href={post.ctaUrl}>{post.ctaText}</a>}</> : <div className="article-placeholder">This article is not available yet.</div>}<Link to="/blog" className="text-link">← Back to the journal</Link></article></div>;
}
