import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isPerPerson?: boolean;
}

interface CartState {
  items: CartItem[];
  deliveryDate: string | null;
  deliverySlot: string | null;
}

interface CartContextType {
  items: CartItem[];
  deliveryDate: string | null;
  deliverySlot: string | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setDeliveryDate: (date: string | null) => void;
  setDeliverySlot: (slot: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CART_KEY = "berlioz_cart";

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { items: [], deliveryDate: null, deliverySlot: null };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setState(prev => {
      const existing = prev.items.find(i => i.id === item.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
          ),
        };
      }
      return { ...prev, items: [...prev.items, { ...item, quantity: item.quantity ?? 1 }] };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => (i.id === id ? { ...i, quantity } : i)),
    }));
  }, []);

  const setDeliveryDate = useCallback((date: string | null) => {
    setState(prev => ({ ...prev, deliveryDate: date }));
  }, []);

  const setDeliverySlot = useCallback((slot: string | null) => {
    setState(prev => ({ ...prev, deliverySlot: slot }));
  }, []);

  const clearCart = useCallback(() => {
    setState({ items: [], deliveryDate: null, deliverySlot: null });
  }, []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        deliveryDate: state.deliveryDate,
        deliverySlot: state.deliverySlot,
        addItem,
        removeItem,
        updateQuantity,
        setDeliveryDate,
        setDeliverySlot,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}