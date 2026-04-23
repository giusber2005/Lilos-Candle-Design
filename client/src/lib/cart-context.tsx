import { createContext, useContext, useState, useEffect, ReactNode } from "react";

function getSessionId(): string {
  let id = localStorage.getItem("liloscandle_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("liloscandle_session", id);
  }
  return id;
}

interface CartContextType {
  sessionId: string;
  itemCount: number;
  setItemCount: (n: number) => void;
  refreshCount: () => void;
}

const CartContext = createContext<CartContextType>({
  sessionId: "",
  itemCount: 0,
  setItemCount: () => {},
  refreshCount: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(getSessionId);
  const [itemCount, setItemCount] = useState(0);

  const refreshCount = async () => {
    try {
      const res = await fetch(`/api/cart?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setItemCount(data.itemCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    refreshCount();
  }, []);

  return (
    <CartContext.Provider value={{ sessionId, itemCount, setItemCount, refreshCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
