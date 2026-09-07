import { createContext, useContext, useMemo, useState } from "react";

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
