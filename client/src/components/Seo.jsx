import { useEffect } from "react";

const siteName = "Dr. Ortho King";
const defaultDescription =
  "Premium orthopedic mattresses, bedroom furniture, and sleep essentials in Uganda from Dr. Ortho King.";

function ensureMeta(property, content, type = "name") {
  const selector = type === "property" ? `meta[property="${property}"]` : `meta[name="${property}"]`;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    if (type === "property") {
      tag.setAttribute("property", property);
    } else {
      tag.setAttribute("name", property);
    }
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

export function Seo({
  title,
  description = defaultDescription,
  path = "/",
  image = "/logo.png",
  type = "website",
}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${siteName}` : siteName;
    const canonicalPath = path.startsWith("/") ? path : `/${path}`;
    const canonicalUrl = `https://drorthoking.com${canonicalPath}`;
    const ogImage = image.startsWith("http") ? image : `https://drorthoking.com${image}`;

    document.title = pageTitle;

    ensureMeta("description", description);
    ensureMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    ensureMeta("theme-color", "#07090b");
    ensureMeta("og:title", pageTitle, "property");
    ensureMeta("og:description", description, "property");
    ensureMeta("og:type", type, "property");
    ensureMeta("og:url", canonicalUrl, "property");
    ensureMeta("og:image", ogImage, "property");
    ensureMeta("og:site_name", siteName, "property");
    ensureMeta("twitter:card", "summary_large_image");
    ensureMeta("twitter:title", pageTitle);
    ensureMeta("twitter:description", description);
    ensureMeta("twitter:image", ogImage);

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);
  }, [description, image, path, title, type]);

  return null;
}
