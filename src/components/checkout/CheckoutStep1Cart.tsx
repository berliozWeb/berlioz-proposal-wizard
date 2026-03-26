import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatMXN } from "@/domain/value-objects/Money";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import OrderSummaryCard from "./OrderSummaryCard";
import { toast } from "sonner";

interface Props { onNext: () => void }

const CheckoutStep1Cart = ({ onNext }: Props) => {
  const { items, updateQuantity, removeItem, notes, setNotes, applyDiscount, discountCode } = useCart();
  const [discountInput, setDiscountInput] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setApplyingDiscount(true);
    await applyDiscount(discountInput);
    setApplyingDiscount(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT — Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading text-2xl text-foreground">Tu carrito</h2>

          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">🍱</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-foreground truncate">{item.name}</p>
                <p className="font-body text-xs text-muted-foreground">{formatMXN(item.price)} / persona</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (item.quantity <= 10) {
                      toast.error("Mínimo 10 unidades");
                      return;
                    }
                    updateQuantity(item.id, item.quantity - 1);
                  }}
                  className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  title="mín. 10"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-body text-sm w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="font-body font-semibold text-sm w-24 text-right">{formatMXN(item.price * item.quantity)}</p>
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Notes */}
          <div className="mt-6">
            <label className="font-body text-sm font-medium text-foreground mb-2 block">Nota del pedido</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones especiales, restricciones no contempladas, indicaciones de entrega..."
              maxLength={300}
              className="resize-none"
            />
            <p className="font-body text-xs text-muted-foreground mt-1 text-right">{notes.length}/300</p>
          </div>
        </div>

        {/* RIGHT — Summary */}
        <div>
          <OrderSummaryCard>
            {/* Discount */}
            <Collapsible className="mt-4">
              <CollapsibleTrigger className="font-body text-sm text-secondary hover:underline">
                {discountCode ? `Código: ${discountCode} ✓` : "¿Código de descuento?"}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex gap-2">
                  <Input
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO"
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleApplyDiscount} disabled={applyingDiscount}>
                    Aplicar
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              onClick={onNext}
              disabled={items.length === 0}
              className="w-full mt-6"
              size="lg"
            >
              Continuar a entrega →
            </Button>
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
};

export default CheckoutStep1Cart;
