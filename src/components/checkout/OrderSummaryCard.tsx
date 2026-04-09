import { useCart } from "@/contexts/CartContext";
import { formatMXN } from "@/domain/value-objects/Money";
import { MapPin } from "lucide-react";

const OrderSummaryCard = ({ children }: { children?: React.ReactNode }) => {
  const { totals, shippingZone } = useCart();

  return (
    <div className="rounded-xl border border-border bg-card p-6 sticky top-28">
      <h3 className="font-heading text-lg text-foreground mb-4">Resumen del pedido</h3>
      <div className="space-y-2 font-body text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatMXN(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Envío {shippingZone !== null && shippingZone !== 0 ? `(Zona ${shippingZone})` : ""}
          </span>
          <span className={totals.shipping === 0 ? "text-success" : ""}>
            {totals.shipping === 0 ? "Gratis" : formatMXN(totals.shipping)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">IVA (16%)</span>
          <span>{formatMXN(totals.iva)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Descuento</span>
            <span>-{formatMXN(totals.discount)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-base">
          <span>Total</span>
          <span className="text-primary">{formatMXN(totals.total)}</span>
        </div>
      </div>
      {children}
    </div>
  );
};

export default OrderSummaryCard;
