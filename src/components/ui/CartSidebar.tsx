import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const { items, totals, itemCount, updateQuantity, removeItem } = useCart();
  const isMobile = useIsMobile();

  if (!open) return null;

  const { subtotal, iva, shipping: envio, total } = totals;

  const Panel = (
    <div
      className={cn(
        "flex flex-col bg-card/95 backdrop-blur-xl",
        isMobile
          ? "fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] max-h-[90vh] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-500"
          : "fixed right-0 top-0 bottom-0 z-50 w-[420px] shadow-2xl border-l border-border/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-heading text-xl text-foreground">Tu pedido</h2>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-all hover:rotate-90 duration-300"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 no-scrollbar">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Tu carrito está vacío. <br /> Comienza agregando algo delicioso.
            </p>
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="group flex gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-muted-foreground/20" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
              <div>
                <p className="font-body text-sm font-semibold text-foreground truncate">{item.name}</p>
                <p className="font-body text-[11px] text-muted-foreground font-bold tracking-tight uppercase opacity-60">
                  ${item.price.toLocaleString("es-MX")} / persona
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/40">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center disabled:opacity-30 transition-all font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-xs w-8 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg hover:bg-card flex items-center justify-center transition-all font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="bg-card/50 backdrop-blur-md border-t border-border/50 px-8 py-8 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">${subtotal.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>IVA (16%)</span>
              <span className="font-medium text-foreground">${iva.toLocaleString("es-MX")}</span>
            </div>
            <div className="flex justify-between font-body text-sm text-muted-foreground">
              <span>Envío</span>
              <span className="font-semibold text-green-600">
                {envio === 0 ? "GRATIS" : `$${envio.toLocaleString("es-MX")}`}
              </span>
            </div>
            <div className="pt-4 border-t border-border/50">
              <div className="flex justify-between font-heading text-2xl text-foreground">
                <span className="font-medium">Total</span>
                <span className="font-bold">${total.toLocaleString("es-MX")}</span>
              </div>
              <p className="font-body text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold opacity-50">
                MXN incluye impuestos
              </p>
            </div>
          </div>

          <a
            href="/checkout"
            className="group flex items-center justify-center gap-3 w-full h-16 rounded-[20px] bg-primary text-primary-foreground font-body font-bold text-sm uppercase tracking-widest hover:bg-primary/95 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
          >
            Finalizar Pedido
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[8px] animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      {Panel}
    </>
  );
};

export default CartSidebar;