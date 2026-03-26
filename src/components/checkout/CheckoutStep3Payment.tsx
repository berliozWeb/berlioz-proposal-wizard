import { useState } from "react";
import { CreditCard, Building2, Landmark } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/domain/value-objects/Money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import OrderSummaryCard from "./OrderSummaryCard";

interface Props { onNext: (orderId: string) => void; onBack: () => void }

const CheckoutStep3Payment = ({ onNext, onBack }: Props) => {
  const { items, totals, deliveryDate, deliverySlot, deliveryAddressId, notes, discountCode, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);

  // Card form state (UI only — TODO: Stripe/Conekta integration)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Invoice
  const [showInvoice, setShowInvoice] = useState(false);
  const [rfc, setRfc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [usoCfdi, setUsoCfdi] = useState("G03");

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handleConfirmOrder = async () => {
    if (!user) { toast.error("Inicia sesión para confirmar tu pedido"); return; }
    setSubmitting(true);

    try {
      // Get address text
      let addressText = "";
      if (deliveryAddressId) {
        const { data: addr } = await supabase.from("delivery_addresses").select("address_text").eq("id", deliveryAddressId).single();
        addressText = addr?.address_text ?? "";
      }

      const pointsEarned = Math.floor(totals.total / 50);

      // Create order
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        user_id: user.id,
        delivery_date: deliveryDate!,
        delivery_slot: deliverySlot!,
        delivery_address_id: deliveryAddressId,
        delivery_address_text: addressText,
        notes,
        subtotal: totals.subtotal,
        iva: totals.iva,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        discount_code: discountCode,
        payment_method: paymentMethod,
        invoice_rfc: showInvoice ? rfc : null,
        invoice_razon_social: showInvoice ? razonSocial : null,
        invoice_uso_cfdi: showInvoice ? usoCfdi : null,
        points_earned: pointsEarned,
      }).select("id, order_number").single();

      if (orderErr || !order) throw orderErr;

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        image_url: item.image ?? null,
      }));
      await supabase.from("order_items").insert(orderItems);

      // Award loyalty points
      const currentPoints = (profile as any)?.loyalty_points ?? 0;
      await supabase.from("profiles").update({
        loyalty_points: currentPoints + pointsEarned,
      }).eq("id", user.id);

      clearCart();
      onNext(order.id);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const isCompany = profile?.profile_type === "company";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="font-heading text-xl text-foreground">Método de pago</h2>

          <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
            <TabsList className="w-full grid grid-cols-2 lg:grid-cols-3">
              <TabsTrigger value="card" className="gap-2"><CreditCard className="w-4 h-4" /> Tarjeta</TabsTrigger>
              <TabsTrigger value="spei" className="gap-2"><Landmark className="w-4 h-4" /> SPEI</TabsTrigger>
              {isCompany && (
                <TabsTrigger value="account" className="gap-2"><Building2 className="w-4 h-4" /> Cuenta empresa</TabsTrigger>
              )}
            </TabsList>

            {/* TAB 1: Card — TODO: Stripe/Conekta integration */}
            <TabsContent value="card" className="space-y-4 mt-4">
              <Input placeholder="Nombre del titular" value={cardName} onChange={(e) => setCardName(e.target.value)} />
              <Input
                placeholder="Número de tarjeta"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} />
                <Input placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} type="password" />
              </div>
              <p className="font-body text-xs text-muted-foreground">Tus datos de pago están seguros y encriptados.</p>
            </TabsContent>

            {/* TAB 2: SPEI */}
            <TabsContent value="spei" className="mt-4">
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                <p className="font-body text-sm"><strong>Banco:</strong> BBVA</p>
                <p className="font-body text-sm"><strong>CLABE:</strong> 012180001234567890</p>
                <p className="font-body text-sm"><strong>Beneficiario:</strong> BERLIOZ SA DE CV</p>
                <p className="font-body text-xs text-muted-foreground mt-3">
                  Tu pedido se confirma al recibir la transferencia. Envíanos el comprobante a pedidos@berlioz.mx
                </p>
              </div>
            </TabsContent>

            {/* TAB 3: Company account */}
            {isCompany && (
              <TabsContent value="account" className="mt-4">
                <div className="rounded-xl border border-border bg-muted/30 p-5">
                  <p className="font-body text-sm">
                    Se facturará a <strong>{profile?.company_name || "tu empresa"}</strong>.
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-2">
                    Recibirás la factura mensual consolidada al cierre del mes.
                  </p>
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Invoice */}
          <Collapsible open={showInvoice} onOpenChange={setShowInvoice}>
            <CollapsibleTrigger className="font-body text-sm text-secondary hover:underline">
              {showInvoice ? "Ocultar datos de facturación" : "¿Necesitas factura?"}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <Input placeholder="RFC" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} maxLength={13} />
              <Input placeholder="Razón social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
              <Select value={usoCfdi} onValueChange={setUsoCfdi}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="G03">G03 – Gastos en general</SelectItem>
                  <SelectItem value="G01">G01 – Adquisición de mercancías</SelectItem>
                  <SelectItem value="P01">P01 – Por definir</SelectItem>
                </SelectContent>
              </Select>
            </CollapsibleContent>
          </Collapsible>

          {/* Order review */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-sm text-foreground mb-3">Resumen final</h3>
            <div className="grid grid-cols-2 gap-2 font-body text-sm">
              <span className="text-muted-foreground">Entrega:</span>
              <span>{deliveryDate} · {deliverySlot}</span>
              <span className="text-muted-foreground">Productos:</span>
              <span>{items.length} producto{items.length > 1 ? "s" : ""}</span>
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-primary">{formatMXN(totals.total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>← Entrega</Button>
            <Button onClick={handleConfirmOrder} disabled={submitting} className="flex-1" size="lg">
              {submitting ? "Procesando..." : `Confirmar pedido · ${formatMXN(totals.total)}`}
            </Button>
          </div>
        </div>

        <div>
          <OrderSummaryCard />
        </div>
      </div>
    </div>
  );
};

export default CheckoutStep3Payment;
