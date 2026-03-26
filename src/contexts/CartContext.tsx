import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  deliveryAddressId: string | null;
  notes: string;
  discountCode: string | null;
  discountAmount: number;
}

interface CartTotals {
  subtotal: number;
  iva: number;
  shipping: number;
  discount: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  deliveryDate: string | null;
  deliverySlot: string | null;
  deliveryAddressId: string | null;
  notes: string;
  discountCode: string | null;
  discountAmount: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setDeliveryDate: (date: string | null) => void;
  setDeliverySlot: (slot: string | null) => void;
  setDeliveryAddressId: (id: string | null) => void;
  setNotes: (text: string) => void;
  applyDiscount: (code: string) => Promise<boolean>;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  totals: CartTotals;
  isValid: boolean;
}

const CART_KEY = "berlioz_cart";
const EMPTY_STATE: CartState = {
  items: [],
  deliveryDate: null,
  deliverySlot: null,
  deliveryAddressId: null,
  notes: "",
  discountCode: null,
  discountAmount: 0,
};

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as CartState;

    // Check for past delivery date
    if (parsed.deliveryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const delivery = new Date(parsed.deliveryDate + "T00:00:00");
      if (delivery < today) {
        parsed.deliveryDate = null;
        parsed.deliverySlot = null;
        setTimeout(() => toast.warning("Tu fecha de entrega anterior ya pasó — elige una nueva."), 500);
      }
    }
    return { ...EMPTY_STATE, ...parsed };
  } catch {
    return EMPTY_STATE;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = Math.max(10, item.quantity ?? 10);
    setState((prev) => {
      const existing = prev.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      return { ...prev, items: [...prev.items, { ...item, quantity: qty }] };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 10) {
      toast.error("Mínimo 10 unidades por producto");
      return;
    }
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
  }, []);

  const setDeliveryDate = useCallback((date: string | null) => {
    setState((prev) => ({ ...prev, deliveryDate: date }));
  }, []);

  const setDeliverySlot = useCallback((slot: string | null) => {
    setState((prev) => ({ ...prev, deliverySlot: slot }));
  }, []);

  const setDeliveryAddressId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, deliveryAddressId: id }));
  }, []);

  const setNotes = useCallback((text: string) => {
    setState((prev) => ({ ...prev, notes: text.slice(0, 300) }));
  }, []);

  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .maybeSingle();

      if (error || !data) {
        toast.error("Código no válido");
        setState((prev) => ({ ...prev, discountCode: null, discountAmount: 0 }));
        return false;
      }
      setState((prev) => ({
        ...prev,
        discountCode: data.code,
        discountAmount: Number(data.discount_amount) || 0,
      }));
      toast.success(`Código "${data.code}" aplicado: -$${Number(data.discount_amount).toLocaleString()}`);
      return true;
    } catch {
      toast.error("Error al validar código");
      return false;
    }
  }, []);

  const clearCart = useCallback(() => {
    setState(EMPTY_STATE);
  }, []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const totals = useMemo((): CartTotals => {
    const iva = Math.round(subtotal * 0.16);
    const shipping = subtotal > 2000 ? 0 : 150;
    const discount = state.discountAmount;
    const total = Math.max(0, subtotal + iva + shipping - discount);
    return { subtotal, iva, shipping, discount, total };
  }, [subtotal, state.discountAmount]);

  const isValid = state.items.length > 0 && !!state.deliveryDate && !!state.deliverySlot;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        deliveryDate: state.deliveryDate,
        deliverySlot: state.deliverySlot,
        deliveryAddressId: state.deliveryAddressId,
        notes: state.notes,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
        addItem,
        removeItem,
        updateQuantity,
        setDeliveryDate,
        setDeliverySlot,
        setDeliveryAddressId,
        setNotes,
        applyDiscount,
        clearCart,
        itemCount,
        subtotal,
        totals,
        isValid,
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
