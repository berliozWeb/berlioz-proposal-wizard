import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, isWeekend, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Check, MapPin, CreditCard, Landmark, AlertTriangle, Info } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getShippingInfo } from "@/utils/shippingCalculator";

function formatMXN(n: number) {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// removed — CP validation now uses getShippingInfo from shippingCalculator

const TIME_SLOTS = [
  { value: "7:30", label: "7:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "15:00", label: "3:00 PM" },
];

const CheckoutPage = () => {
  const { items, totals, shippingType, notes, clearCart, setEarlySurcharge } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState(profile?.full_name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(profile?.full_name?.split(" ").slice(1).join(" ") || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [numExt, setNumExt] = useState("");
  const [numInt, setNumInt] = useState("");
  const [colonia, setColonia] = useState("");
  const [city, setCity] = useState("Ciudad de México");
  const [cp, setCp] = useState("");
  const [cpValid, setCpValid] = useState<boolean | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState("");
  const [deliverySlot, setDeliverySlot] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);

  // Redirect if empty cart
  useEffect(() => {
    if (items.length === 0) navigate("/menu");
  }, [items.length, navigate]);

  // CP validation
  useEffect(() => {
    if (cp.length === 5) {
      setCpValid(VALID_CPS.includes(cp));
    } else {
      setCpValid(null);
    }
  }, [cp]);

  // Company autocomplete
  useEffect(() => {
    if (companyName.length < 2) { setCompanySuggestions([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from("companies").select("name").ilike("name", `%${companyName}%`).limit(5);
      if (data) setCompanySuggestions(data.map(c => c.name));
    }, 300);
    return () => clearTimeout(timeout);
  }, [companyName]);

  // Early surcharge logic
  useEffect(() => {
    setEarlySurcharge(deliverySlot === "7:30" ? 290 : 0);
  }, [deliverySlot, setEarlySurcharge]);

  // Delivery time validation (90 min rule)
  useEffect(() => {
    if (!eventTime || !deliverySlot) { setTimeError(null); return; }
    const [eventH, eventM] = eventTime.split(":").map(Number);
    const [delH, delM] = deliverySlot.split(":").map(Number);
    if (isNaN(eventH) || isNaN(delH)) { setTimeError(null); return; }
    const eventMinutes = eventH * 60 + (eventM || 0);
    const deliveryMinutes = delH * 60 + (delM || 0);
    if (deliveryMinutes > eventMinutes - 90) {
      const needH = Math.floor((eventMinutes - 90) / 60);
      const needM = (eventMinutes - 90) % 60;
      setTimeError(`Necesitamos llegar 90 min antes de tu evento. Para evento a las ${eventTime}, selecciona entrega antes de las ${needH}:${String(needM).padStart(2, "0")}.`);
    } else {
      setTimeError(null);
    }
  }, [eventTime, deliverySlot]);

  // Generate available dates (3pm cutoff rule)
  const availableDates = useMemo(() => {
    const now = new Date();
    const isPast3PM = now.getHours() >= 15;
    const result: Date[] = [];
    let current = addDays(startOfDay(now), isPast3PM ? 2 : 1);
    while (result.length < 14) {
      if (!isWeekend(current)) result.push(current);
      current = addDays(current, 1);
    }
    return result;
  }, []);

  const isPast3PM = new Date().getHours() >= 15;

  const canSubmit = email && firstName && lastName && phone.length === 10 && deliveryDate && deliverySlot && termsAccepted && !timeError && (shippingType === "pickup" || (street && colonia && cp && cpValid));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const addressText = shippingType === "pickup"
        ? "Recoger en Lago Onega 265, Modelo Pensil"
        : `${street} ${numExt}${numInt ? ` Int. ${numInt}` : ""}, ${colonia}, ${city}, CP ${cp}`;

      const orderData = {
        user_id: user?.id || null,
        delivery_date: deliveryDate!,
        delivery_slot: deliverySlot!,
        delivery_address_text: addressText,
        notes: instructions || notes || null,
        subtotal: totals.subtotal,
        iva: totals.iva,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        discount_code: null,
        payment_method: paymentMethod,
        points_earned: Math.floor(totals.total / 50),
      };

      // Only insert order if user is authenticated
      if (user) {
        const { data: order, error } = await supabase.from("orders").insert({
          ...orderData,
          user_id: user.id,
        }).select("id, order_number").single();

        if (error || !order) throw error;

        // Insert order items
        await supabase.from("order_items").insert(
          items.map(item => ({
            order_id: order.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            image_url: item.image ?? null,
          }))
        );

        // Award loyalty points
        if (profile) {
          await supabase.from("profiles").update({
            loyalty_points: ((profile as any).loyalty_points ?? 0) + orderData.points_earned,
          }).eq("id", user.id);
        }

        // Save company if provided
        if (companyName.trim()) {
          await supabase.from("companies").upsert(
            { name: companyName.trim() },
            { onConflict: "name", ignoreDuplicates: true }
          ).select().maybeSingle();
        }

        clearCart();
        sessionStorage.setItem("berlioz_order_number", order.order_number);
        sessionStorage.setItem("berlioz_order_id", order.id);
        navigate("/checkout/confirmacion");
      } else {
        // Guest flow — just show confirmation
        clearCart();
        sessionStorage.setItem("berlioz_order_number", `BRL-${new Date().getFullYear()}-GUEST`);
        navigate("/checkout/confirmacion");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el pedido. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <BaseLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner */}
        <div className="mb-8 p-4 rounded-xl border-l-4 border-primary bg-amber-50">
          <p className="font-body text-sm font-semibold text-foreground">Ayúdanos a llegar a tiempo.</p>
          <p className="font-body text-xs text-muted-foreground">Contempla un margen de 90 min antes de que empiece tu junta.</p>
        </div>

        {isPast3PM && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="font-body text-sm text-destructive font-medium">
              Los pedidos recibidos después de las 3:00 PM se programan a partir del día siguiente hábil.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
          {/* LEFT — Form */}
          <div className="space-y-8">
            {/* Account section */}
            <section>
              <h2 className="font-heading text-xl mb-4 text-foreground">Cuenta</h2>
              {user ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {firstName?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-body text-sm font-semibold">{profile?.full_name || email}</p>
                    <p className="font-body text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <p className="font-body text-sm text-muted-foreground">Continúa como invitado o inicia sesión para una experiencia más rápida.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => navigate("/login")}>Iniciar sesión</Button>
                  </div>
                </div>
              )}
            </section>

            {/* Contact */}
            <section>
              <h2 className="font-heading text-xl mb-4 text-foreground">Datos de contacto</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs text-muted-foreground mb-1 block">Correo electrónico *</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground mb-1 block">Teléfono * (10 dígitos)</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="5512345678"
                    maxLength={10}
                  />
                  {phone.length > 0 && phone.length < 10 && (
                    <p className="font-body text-[10px] text-destructive mt-1">Ingresa 10 dígitos</p>
                  )}
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground mb-1 block">Nombre *</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground mb-1 block">Apellidos *</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="sm:col-span-2 relative">
                  <label className="font-body text-xs text-muted-foreground mb-1 block">Empresa *</label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  {companySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 bg-card border border-border rounded-lg mt-1 shadow-lg">
                      {companySuggestions.map((s) => (
                        <button key={s} className="w-full text-left px-4 py-2 font-body text-sm hover:bg-muted transition-colors" onClick={() => { setCompanyName(s); setCompanySuggestions([]); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Delivery address (only for delivery) */}
            {shippingType === "delivery" && (
              <section>
                <h2 className="font-heading text-xl mb-4 text-foreground">Dirección de entrega</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Calle y número exterior *</label>
                    <div className="grid grid-cols-[1fr_120px] gap-3">
                      <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Av. Paseo de la Reforma" />
                      <Input value={numExt} onChange={(e) => setNumExt(e.target.value)} placeholder="Núm." />
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Número interior</label>
                    <Input value={numInt} onChange={(e) => setNumInt(e.target.value)} placeholder="Opcional" />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Colonia *</label>
                    <Input value={colonia} onChange={(e) => setColonia(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Ciudad</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Código postal *</label>
                    <Input
                      value={cp}
                      onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      maxLength={5}
                      className={cn(cpValid === false && "border-destructive")}
                    />
                    {cpValid === false && (
                      <p className="font-body text-[10px] text-destructive mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        No tenemos cobertura en esta zona. Puedes recoger en Lago Onega 265, Modelo Pensil.
                      </p>
                    )}
                    {cpValid === true && (
                      <p className="font-body text-[10px] text-green-600 mt-1">✓ Zona con cobertura</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Delivery date/time */}
            <section>
              <h2 className="font-heading text-xl mb-4 text-foreground">Entrega y horario</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-xs text-muted-foreground mb-2 block">Fecha de entrega *</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {availableDates.map((day) => {
                      const iso = format(day, "yyyy-MM-dd");
                      const selected = deliveryDate === iso;
                      return (
                        <button
                          key={iso}
                          onClick={() => setDeliveryDate(iso)}
                          className={cn(
                            "flex flex-col items-center px-3 py-2 rounded-xl border text-center shrink-0 transition-all min-w-[60px]",
                            selected ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:border-primary/40 text-foreground"
                          )}
                        >
                          <span className="font-body text-[10px] uppercase">{format(day, "EEE", { locale: es })}</span>
                          <span className="font-body text-lg font-semibold">{format(day, "d")}</span>
                          <span className="font-body text-[10px] opacity-70">{format(day, "MMM", { locale: es })}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">¿A qué hora empieza tu evento? *</label>
                    <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-body text-xs text-muted-foreground mb-1 block">Hora de entrega *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.value}
                          onClick={() => setDeliverySlot(slot.value)}
                          className={cn(
                            "p-3 rounded-xl border text-center transition-all font-body text-sm",
                            deliverySlot === slot.value ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:border-primary/40"
                          )}
                        >
                          {slot.label}
                          {slot.value === "7:30" && <p className="text-[9px] opacity-70 mt-0.5">+$290 recargo</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {timeError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="font-body text-xs text-destructive">{timeError}</p>
                  </div>
                )}

                <div>
                  <label className="font-body text-xs text-muted-foreground mb-1 block">Instrucciones adicionales</label>
                  <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Piso, torre, indicaciones..." maxLength={300} className="resize-none" />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="font-heading text-xl mb-4 text-foreground">Método de pago</h2>
              <div className="space-y-3">
                <label className={cn("flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all", paymentMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-border bg-card")}>
                  <input type="radio" name="payment" checked={paymentMethod === "bank_transfer"} onChange={() => setPaymentMethod("bank_transfer")} className="accent-primary mt-1" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-muted-foreground" />
                      <span className="font-body text-sm font-medium">Transferencia bancaria directa</span>
                    </div>
                    {paymentMethod === "bank_transfer" && (
                      <p className="font-body text-xs text-muted-foreground mt-2">
                        Realiza tu pago a nuestra cuenta bancaria. Usa el número de pedido como referencia. Tu pedido no será enviado hasta recibir el pago.
                      </p>
                    )}
                  </div>
                </label>

                <label className={cn("flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all", paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border bg-card")}>
                  <input type="radio" name="payment" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="accent-primary mt-1" />
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-sm font-medium">Tarjeta de crédito / débito</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Terms */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="accent-primary mt-1"
                />
                <span className="font-body text-xs text-muted-foreground">
                  He leído y estoy de acuerdo con los Términos y condiciones: Acepto contemplar un margen de 90 minutos antes de mi evento al seleccionar la hora de entrega *
                </span>
              </label>

              <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full" size="lg">
                {submitting ? "Procesando..." : `REALIZAR EL PEDIDO · ${formatMXN(totals.total)}`}
              </Button>

              <p className="font-body text-[10px] text-muted-foreground text-center">
                Tus datos personales se utilizarán para procesar tu pedido y otros propósitos descritos en nuestra Política de privacidad.
              </p>
            </div>
          </div>

          {/* RIGHT — Order summary (sticky) */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-heading text-lg text-foreground mb-4">TU PEDIDO</h3>
              <div className="space-y-2 font-body text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatMXN(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMXN(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span>{totals.shipping === 0 ? "Gratis" : formatMXN(totals.shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span>{formatMXN(totals.iva)}</span>
                  </div>
                  {totals.earlySurcharge > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Recargo 7:30 AM</span>
                      <span>{formatMXN(totals.earlySurcharge)}</span>
                    </div>
                  )}
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-{formatMXN(totals.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                    <span>TOTAL</span>
                    <span className="text-primary">{formatMXN(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
};

export default CheckoutPage;
