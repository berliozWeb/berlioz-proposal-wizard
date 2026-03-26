import { useState, useEffect, useMemo } from "react";
import { addDays, format, isWeekend, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Check, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import OrderSummaryCard from "./OrderSummaryCard";

interface Props { onNext: () => void; onBack: () => void }

const TIME_SLOTS = [
  { value: "7:30-9:00", label: "7:30 – 9:00" },
  { value: "10:00-11:30", label: "10:00 – 11:30" },
  { value: "12:00-13:30", label: "12:00 – 13:30" },
  { value: "15:00-17:00", label: "15:00 – 17:00" },
];

interface Address {
  id: string;
  address_text: string;
  notes: string | null;
  is_default: boolean;
}

const CheckoutStep2Delivery = ({ onNext, onBack }: Props) => {
  const { deliveryDate, deliverySlot, deliveryAddressId, setDeliveryDate, setDeliverySlot, setDeliveryAddressId } = useCart();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    supabase.from("delivery_addresses").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data && data.length > 0) {
        setAddresses(data);
        // Pre-select default
        if (!deliveryAddressId) {
          const def = data.find((a) => a.is_default);
          if (def) setDeliveryAddressId(def.id);
        }
      } else {
        setShowNewAddress(true);
      }
    });
  }, [user]);

  // Generate next 14 business days
  const days = useMemo(() => {
    const result: Date[] = [];
    const tomorrow = addDays(startOfDay(new Date()), 1);
    let current = tomorrow;
    while (result.length < 14) {
      if (!isWeekend(current)) result.push(current);
      current = addDays(current, 1);
    }
    return result;
  }, []);

  const handleSaveNewAddress = async () => {
    if (!newAddress.trim() || !user) return;
    const { data, error } = await supabase.from("delivery_addresses").insert({
      user_id: user.id,
      address_text: newAddress.trim(),
      is_default: addresses.length === 0,
    }).select().single();
    if (data) {
      setAddresses((prev) => [...prev, data]);
      setDeliveryAddressId(data.id);
      setShowNewAddress(false);
      setNewAddress("");
    }
  };

  const canContinue = !!deliveryDate && !!deliverySlot && (!!deliveryAddressId || newAddress.trim().length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Date picker */}
          <div>
            <h2 className="font-heading text-xl text-foreground mb-4">¿Cuándo te entregamos?</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {days.map((day) => {
                const iso = format(day, "yyyy-MM-dd");
                const selected = deliveryDate === iso;
                return (
                  <button
                    key={iso}
                    onClick={() => setDeliveryDate(iso)}
                    className={cn(
                      "flex flex-col items-center px-3 py-2 rounded-xl border text-center shrink-0 transition-all min-w-[60px]",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-card hover:border-primary/40 text-foreground"
                    )}
                  >
                    <span className="font-body text-[10px] uppercase">
                      {format(day, "EEE", { locale: es })}
                    </span>
                    <span className="font-body text-lg font-semibold">{format(day, "d")}</span>
                    <span className="font-body text-[10px] text-inherit opacity-70">
                      {format(day, "MMM", { locale: es })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {deliveryDate && (
            <div>
              <h3 className="font-heading text-lg text-foreground mb-3">Horario de entrega</h3>
              <div className="grid grid-cols-2 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const selected = deliverySlot === slot.value;
                  return (
                    <button
                      key={slot.value}
                      onClick={() => setDeliverySlot(slot.value)}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <span className="font-body font-semibold text-sm">{slot.label}</span>
                      {selected && <Check className="w-4 h-4 mx-auto mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Address */}
          <div>
            <h3 className="font-heading text-lg text-foreground mb-3">¿A dónde entregamos?</h3>
            {addresses.length > 0 && !showNewAddress && (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setDeliveryAddressId(addr.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3",
                      deliveryAddressId === addr.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="font-body text-sm font-medium">{addr.address_text}</p>
                      {addr.notes && <p className="font-body text-xs text-muted-foreground mt-1">{addr.notes}</p>}
                      {addr.is_default && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-body">
                          Predeterminada
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                <button onClick={() => setShowNewAddress(true)} className="font-body text-sm text-secondary hover:underline mt-2">
                  + Agregar nueva dirección
                </button>
              </div>
            )}

            {(showNewAddress || addresses.length === 0) && (
              <div className="space-y-3">
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Escribe la dirección completa..."
                />
                {user && (
                  <Button size="sm" variant="outline" onClick={handleSaveNewAddress} disabled={!newAddress.trim()}>
                    Guardar dirección
                  </Button>
                )}
                {addresses.length > 0 && (
                  <button onClick={() => setShowNewAddress(false)} className="block font-body text-xs text-muted-foreground hover:underline">
                    ← Usar dirección guardada
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>← Carrito</Button>
            <Button onClick={onNext} disabled={!canContinue} className="flex-1">
              Continuar al pago →
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

export default CheckoutStep2Delivery;
