import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, X, Trash2, ArrowLeft, ShoppingBag, Sparkles, MapPin } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function formatMXN(n: number) {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Recommendation {
  productName: string;
  reason: string;
  urgencyMessage: string;
}

const CartPage = () => {
  const {
    items, removeItem, updateQuantity, totals, shippingType, setShippingType,
    discountCode, applyDiscount, itemCount, totalUnits, subtotal,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discountInput, setDiscountInput] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch AI recommendations
  useEffect(() => {
    if (items.length === 0) return;
    setLoadingRecs(true);
    const payload = {
      cartItems: items.map(i => ({ productId: i.id, name: i.name, category: i.category, price: i.price, qty: i.quantity })),
      cartTotal: subtotal,
    };

    supabase.functions.invoke("cart-recommendations", { body: payload })
      .then(({ data, error }) => {
        if (!error && data?.recommendations) {
          setRecommendations(data.recommendations);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, [items.length]);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setApplyingDiscount(true);
    await applyDiscount(discountInput);
    setApplyingDiscount(false);
  };

  if (items.length === 0) {
    return (
      <BaseLayout>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h1 className="font-heading text-3xl text-foreground mb-3">Tu carrito está vacío</h1>
          <p className="font-body text-muted-foreground mb-8">Explora nuestro menú y agrega algo delicioso.</p>
          <Button onClick={() => navigate("/menu")} size="lg">Explorar menú</Button>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-3xl text-foreground mb-8">Tu carrito</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* LEFT — Product list */}
          <div className="space-y-6">
            {/* Table header (desktop) */}
            <div className="hidden md:grid grid-cols-[1fr_120px_140px_100px_40px] gap-4 px-4 font-body text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b border-border pb-3">
              <span>Producto</span>
              <span className="text-center">Precio unit.</span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>

            {/* Items */}
            {items.map((item) => (
              <div key={item.id} className="md:grid md:grid-cols-[1fr_120px_140px_100px_40px] md:gap-4 md:items-center p-4 rounded-xl border border-border bg-card">
                {/* Product info */}
                <div className="flex items-center gap-4">
                  <div className="w-[60px] h-[60px] rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/producto/${item.id}`} className="font-body font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block">
                      {item.name}
                    </Link>
                    {item.category && <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{item.category}</p>}
                  </div>
                </div>

                {/* Price */}
                <p className="hidden md:block text-center font-body text-sm">{formatMXN(item.price)}</p>

                {/* Quantity stepper */}
                <div className="flex items-center justify-center gap-1 mt-3 md:mt-0">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) {
                        setConfirmDelete(item.id);
                      } else {
                        updateQuantity(item.id, item.quantity - 1);
                      }
                    }}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (v >= 1) updateQuantity(item.id, v);
                    }}
                    className="w-14 h-8 text-center font-body text-sm font-semibold border border-border rounded-lg bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal */}
                <p className="hidden md:block text-right font-body text-sm font-semibold">{formatMXN(item.price * item.quantity)}</p>

                {/* Delete */}
                <div className="hidden md:flex justify-center">
                  <button
                    onClick={() => setConfirmDelete(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile price/delete row */}
                <div className="flex md:hidden items-center justify-between mt-3">
                  <span className="font-body text-sm font-semibold">{formatMXN(item.price * item.quantity)}</span>
                  <button onClick={() => setConfirmDelete(item.id)} className="text-destructive text-xs font-body flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            ))}

            {/* Confirm delete modal */}
            {confirmDelete && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
                <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-heading text-lg mb-2">¿Eliminar producto?</h3>
                  <p className="font-body text-sm text-muted-foreground mb-6">Se quitará de tu carrito.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">Cancelar</Button>
                    <Button variant="destructive" onClick={() => { removeItem(confirmDelete); setConfirmDelete(null); }} className="flex-1">Eliminar</Button>
                  </div>
                </div>
              </div>
            )}

            <Link to="/menu" className="inline-flex items-center gap-2 font-body text-sm text-primary hover:underline mt-4">
              <ArrowLeft className="w-4 h-4" /> Seguir comprando
            </Link>

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-heading text-xl text-foreground">Puede que estés interesado en...</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <h3 className="font-body text-sm font-semibold text-foreground">{rec.productName}</h3>
                      <p className="font-body text-xs text-muted-foreground">{rec.reason}</p>
                      <p className="font-body text-[10px] text-primary font-medium">{rec.urgencyMessage}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {loadingRecs && (
              <div className="mt-10 flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="font-body text-sm">Buscando recomendaciones...</span>
              </div>
            )}
          </div>

          {/* RIGHT — Order Summary */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h3 className="font-heading text-lg text-foreground">Totales del carrito</h3>

              <div className="space-y-3 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatMXN(totals.subtotal)}</span>
                </div>

                {/* Shipping type */}
                <div className="space-y-2">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Envío</span>
                  <label className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", shippingType === "delivery" ? "border-primary bg-primary/5" : "border-border")}>
                    <input type="radio" name="shipping" checked={shippingType === "delivery"} onChange={() => setShippingType("delivery")} className="accent-primary" />
                    <div className="flex-1">
                      <span className="font-medium">Entrega a domicilio</span>
                      <span className="ml-2 font-semibold">$360.00</span>
                    </div>
                  </label>
                  <label className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all", shippingType === "pickup" ? "border-primary bg-primary/5" : "border-border")}>
                    <input type="radio" name="shipping" checked={shippingType === "pickup"} onChange={() => setShippingType("pickup")} className="accent-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Recoger en sucursal</span>
                        <span className="font-semibold text-green-600">Gratis</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Lago Onega 265, Modelo Pensil
                      </p>
                    </div>
                  </label>
                  {totalUnits <= 10 && shippingType === "delivery" && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
                      💡 Para grupos de hasta 10 personas recomendamos recoger tu pedido. Ahorra $360 en envío.
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span>{formatMXN(totals.iva)}</span>
                </div>

                {totals.earlySurcharge > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Recargo entrega temprana</span>
                    <span>{formatMXN(totals.earlySurcharge)}</span>
                  </div>
                )}

                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatMXN(totals.discount)}</span>
                  </div>
                )}

                <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatMXN(totals.total)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div>
                {discountCode ? (
                  <p className="font-body text-xs text-green-600 font-medium">✓ Cupón "{discountCode}" aplicado</p>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="Código de cupón"
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={handleApplyDiscount} disabled={applyingDiscount}>
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>

              <Button onClick={() => navigate("/checkout")} className="w-full" size="lg">
                FINALIZAR COMPRA →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};

export default CartPage;
