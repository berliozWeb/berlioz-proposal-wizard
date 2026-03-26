import { X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart();
  const isMobile = useIsMobile();

  if (!open) return null;

  const iva = Math.round(subtotal * 0.16);
  const envio = items.length > 0 ? 360 : 0;
  const total = subtotal + iva + envio;

  const Panel = (
    <div
      className={cn(
        "flex flex-col bg-card",
        isMobile
          ? "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl max-h-[85vh] shadow-2xl animate-slide-up"
          : "fixed right-0 top-0 bottom-0 z-50 w-[360px] shadow-2xl border-l border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-heading text-lg text-foreground">Tu pedido ({itemCount})</h2>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {items.length === 0 && (
          <p className="text-center font-body text-sm text-muted-foreground py-8">
            Tu carrito está vacío
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="font-body text-xs text-muted-foreground">
                ${(item.price * item.quantity).toLocaleString("es-MX")}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-6 h-6 rounded border border-border flex items-center justify-center disabled:opacity-30"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono text-xs w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded border border-border flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-border px-5 py-4 space-y-2">
          <div className="flex justify-between font-body text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString("es-MX")}</span>
          </div>
          <div className="flex justify-between font-body text-sm text-muted-foreground">
            <span>IVA 16%</span>
            <span>${iva.toLocaleString("es-MX")}</span>
          </div>
          <div className="flex justify-between font-body text-sm text-muted-foreground">
            <span>Envío</span>
            <span>${envio.toLocaleString("es-MX")}</span>
          </div>
          <div className="flex justify-between font-body text-base font-bold text-foreground pt-2 border-t border-border">
            <span>Total</span>
            <span>${total.toLocaleString("es-MX")}</span>
          </div>
          <a
            href="/checkout"
            className="flex items-center justify-center gap-2 w-full h-12 mt-3 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Ir al pago
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      {Panel}
    </>
  );
};

export default CartSidebar;