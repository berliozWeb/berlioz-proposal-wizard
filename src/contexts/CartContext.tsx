import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  isPerPerson?: boolean;
}

type ShippingType = "delivery" | "pickup";

interface CartState {
  items: CartItem[];
  shippingType: ShippingType;
  notes: string;
  discountCode: string | null;
  discountAmount: number;
  discountType: "fixed" | "percentage";
  earlySurcharge: number;
  shippingZone: number | null;
  shippingPrice: number | null;
  postalCode: string;
}

interface CartTotals {
  subtotal: number;
  iva: number;
  shipping: number;
  earlySurcharge: number;
  discount: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  shippingType: ShippingType;
  notes: string;
  discountCode: string | null;
  discountAmount: number;
  shippingZone: number | null;
  shippingPrice: number | null;
  postalCode: string;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setShippingType: (type: ShippingType) => void;
  setNotes: (text: string) => void;
  applyDiscount: (code: string) => Promise<boolean>;
  clearCart: () => void;
  setEarlySurcharge: (amount: number) => void;
  setPostalCode: (cp: string) => void;
  itemCount: number;
  totalUnits: number;
  subtotal: number;
  totals: CartTotals;
  isInCart: (productId: string) => boolean;
}

const CART_KEY = "berlioz_cart";
const EMPTY_STATE: CartState = {
  items: [],
  shippingType: "delivery",
  notes: "",
  discountCode: null,
  discountAmount: 0,
  discountType: "fixed",
  earlySurcharge: 0,
  shippingZone: null,
  shippingPrice: null,
  postalCode: "",
};

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return EMPTY_STATE;
    return { ...EMPTY_STATE, ...JSON.parse(raw) };
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
    const qty = Math.max(1, item.quantity ?? 1);
    setState((prev) => {
      const existing = prev.items.find((i) => i.id === item.id);
      if (existing) {
        toast.success(`${item.name} actualizado en el carrito`);
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      toast.success(`${item.name} añadido al carrito`);
      return { ...prev, items: [...prev.items, { ...item, quantity: qty }] };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    toast("Producto eliminado del carrito");
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
  }, []);

  const setShippingType = useCallback((type: ShippingType) => {
    setState((prev) => ({ ...prev, shippingType: type }));
  }, []);

  const setNotes = useCallback((text: string) => {
    setState((prev) => ({ ...prev, notes: text.slice(0, 300) }));
  }, []);

  const setEarlySurcharge = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, earlySurcharge: amount }));
  }, []);

  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    try {
      // Try coupons table first, then discount_codes as fallback
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
          toast.error("Este cupón ha alcanzado su límite de usos");
          return false;
        }
        setState((prev) => ({
          ...prev,
          discountCode: coupon.code,
          discountAmount: Number(coupon.discount_value) || 0,
          discountType: coupon.discount_type as "fixed" | "percentage",
        }));
        toast.success(`Cupón "${coupon.code}" aplicado`);
        return true;
      }

      // Fallback to discount_codes table
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
        discountType: (data.discount_type as "fixed" | "percentage") || "fixed",
      }));
      toast.success(`Código "${data.code}" aplicado`);
      return true;
    } catch {
      toast.error("Error al validar código");
      return false;
    }
  }, []);

  const clearCart = useCallback(() => {
    setState(EMPTY_STATE);
    localStorage.removeItem(CART_KEY);
  }, []);

  const isInCart = useCallback((productId: string) => {
    return state.items.some((i) => i.id === productId);
  }, [state.items]);

  const itemCount = state.items.length;
  const totalUnits = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const totals = useMemo((): CartTotals => {
    const shipping = state.shippingType === "pickup" ? 0 : 360;
    const earlySurcharge = state.earlySurcharge;
    const iva = Math.round(subtotal * 0.16);
    let discount = 0;
    if (state.discountAmount > 0) {
      if (state.discountType === "percentage") {
        discount = Math.round(subtotal * (state.discountAmount / 100));
      } else {
        discount = state.discountAmount;
      }
    }
    const total = Math.max(0, subtotal + iva + shipping + earlySurcharge - discount);
    return { subtotal, iva, shipping, earlySurcharge, discount, total };
  }, [subtotal, state.shippingType, state.discountAmount, state.discountType, state.earlySurcharge]);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        shippingType: state.shippingType,
        notes: state.notes,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
        addItem,
        removeItem,
        updateQuantity,
        setShippingType,
        setNotes,
        applyDiscount,
        clearCart,
        setEarlySurcharge,
        itemCount,
        totalUnits,
        subtotal,
        totals,
        isInCart,
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
