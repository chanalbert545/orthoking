import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";

const CartContext = createContext(null);
const STORAGE_KEY = "dr-ortho-cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const variantIds = [...new Set(items.map((item) => item.variantId))].sort();
  const variantIdKey = variantIds.join(",");

  useEffect(() => {
    if (!variantIdKey) return undefined;

    let isCurrent = true;
    async function refreshPrices() {
      try {
        const data = await api(`/api/products/pricing?variantIds=${encodeURIComponent(variantIdKey)}`);
        if (!isCurrent) return;

        const pricesByVariantId = new Map((data.prices || []).map((price) => [price.variantId, price]));
        setItems((current) => {
          let changed = false;
          const next = current.map((item) => {
            const price = pricesByVariantId.get(item.variantId);
            if (!price || (item.regularPriceUgx === price.currentPriceUgx && item.promotionId === price.promotionId)) return item;
            changed = true;
            return { ...item, regularPriceUgx: price.currentPriceUgx, promotionId: price.promotionId };
          });

          if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return changed ? next : current;
        });
      } catch {
        // Keep the last known cart prices while the API is unavailable.
      }
    }

    refreshPrices();
    const timer = window.setInterval(refreshPrices, 60000);
    return () => {
      isCurrent = false;
      window.clearInterval(timer);
    };
  }, [variantIdKey]);

  const value = useMemo(() => {
    function persist(next) {
      setItems(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }

    return {
      items,
      addItem(item) {
        const existing = items.find((row) => row.variantId === item.variantId);
        if (existing) {
          persist(
            items.map((row) =>
              row.variantId === item.variantId
                ? { ...row, quantity: row.quantity + item.quantity }
                : row
            )
          );
          return;
        }
        persist([...items, item]);
      },
      updateQuantity(variantId, quantity) {
        persist(
          items
            .map((row) =>
              row.variantId === variantId ? { ...row, quantity } : row
            )
            .filter((row) => row.quantity > 0)
        );
      },
      removeItem(variantId) {
        persist(items.filter((row) => row.variantId !== variantId));
      },
      clear() {
        persist([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
