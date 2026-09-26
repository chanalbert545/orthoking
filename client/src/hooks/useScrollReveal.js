import { useEffect } from "react";

const REVEAL_SELECTORS = [
  "section:not(.euro-hero)",
  ".euro-heading",
  ".home-promotion-banner > *",
  ".home-services > div",
  ".home-product",
  ".category-card",
  ".article-row > a",
  ".product-card",
  ".page-hero",
  ".story-section > *",
  ".values-section > div",
  ".promise-section > .about-section-heading",
  ".promise-section > .promise-list",
  ".audience-section > *",
  ".social-section-inner",
  ".social-channel-list span",
  ".offers-grid > article",
  ".technology-grid > article",
  ".belona-section > *",
  ".faq-heading",
  ".faq-item",
  ".contact-layout > *",
  ".payment-result-content > *",
  ".shop-toolbar",
  ".article-card",
  ".cart-container",
  ".cart-items",
  ".empty-cart",
  ".checkout-heading",
  ".checkout-section",
  ".checkout-summary",
  ".product-container > *",
  ".article-page > *",
  ".collection-view-all",
  ".empty-content",
];

export function useScrollReveal(pathname) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let observer;
    const claimed = new WeakSet();

    function bindRevealTargets() {
      const root = document.getElementById("main-content");
      if (!root) return;

      const nodes = [];
      for (const selector of REVEAL_SELECTORS) {
        root.querySelectorAll(selector).forEach((element) => {
          if (claimed.has(element)) return;
          claimed.add(element);
          nodes.push(element);
        });
      }

      if (!observer) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("revealed");
              observer.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
        );
      }

      nodes.forEach((element) => {
        if (element.classList.contains("revealed")) return;
        element.classList.add("reveal");
        const parent = element.parentElement;
        let stagger = 0;
        if (parent) {
          stagger = Array.from(parent.children).indexOf(element);
        }
        element.style.setProperty(
          "--reveal-delay",
          `${Math.min(Math.max(stagger, 0), 8) * 65}ms`
        );
        observer.observe(element);
      });
    }

    bindRevealTargets();
    const retryFast = window.setTimeout(bindRevealTargets, 350);
    const retrySlow = window.setTimeout(bindRevealTargets, 1400);

    return () => {
      window.clearTimeout(retryFast);
      window.clearTimeout(retrySlow);
      observer?.disconnect();
    };
  }, [pathname]);
}
