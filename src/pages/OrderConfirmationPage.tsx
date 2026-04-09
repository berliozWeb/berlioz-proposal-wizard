import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Star, MessageCircle, CalendarPlus, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BaseLayout from "@/components/layout/BaseLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatMXN(n: number) {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface OrderData {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_slot: string;
  delivery_address_text: string | null;
  total: number;
  payment_method: string;
  points_earned: number;
  rating: number | null;
  items: { product_name: string; quantity: number; unit_price: number }[];
}

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const orderNumber = sessionStorage.getItem("berlioz_order_number");
  const orderId = sessionStorage.getItem("berlioz_order_id");

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (!o) return;
      const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setOrder({ ...o, items: items ?? [] } as any);
    };
    load();
    const timer = setTimeout(() => setShowRating(true), 2000);
    return () => clearTimeout(timer);
  }, [orderId]);

  const handleRate = async (stars: number) => {
    setSelectedRating(stars);
    if (!orderId) return;
    await supabase.from("orders").update({ rating: stars }).eq("id", orderId);
    setRatingSubmitted(true);
    toast.success("¡Gracias por tu opinión!");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🍱 ¡Pedido confirmado en Berlioz!\nPedido: ${orderNumber}\nTotal: ${order ? formatMXN(order.total) : ""}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <BaseLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        {/* Checkmark */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-foreground mb-2">¡Tu pedido está confirmado!</h1>
        <p className="font-body text-muted-foreground mb-8">Pedido #{orderNumber || "---"}</p>

        {/* Bank transfer instructions */}
        {order?.payment_method === "bank_transfer" && (
          <div className="rounded-xl border border-border bg-amber-50 p-5 text-left mb-8">
            <h3 className="font-heading text-sm mb-3">Instrucciones de pago por transferencia</h3>
            <div className="font-body text-sm space-y-1">
              <p><strong>Banco:</strong> BBVA</p>
              <p><strong>CLABE:</strong> 012180001234567890</p>
              <p><strong>Beneficiario:</strong> BERLIOZ SA DE CV</p>
              <p><strong>Referencia:</strong> {orderNumber}</p>
            </div>
            <p className="font-body text-xs text-muted-foreground mt-3">
              Tu pedido se confirma al recibir la transferencia. Envíanos el comprobante a pedidos@berlioz.mx
            </p>
          </div>
        )}

        {/* Order summary */}
        {order && (
          <div className="rounded-xl border border-border bg-card p-6 text-left mb-8">
            <h3 className="font-heading text-lg mb-4">Resumen del pedido</h3>
            <div className="space-y-2 font-body text-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>{formatMXN(item.unit_price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Entrega</span><span>{order.delivery_date} · {order.delivery_slot}</span></div>
                {order.delivery_address_text && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Dirección</span><span className="text-right max-w-[200px] truncate">{order.delivery_address_text}</span></div>
                )}
                <div className="flex justify-between font-semibold text-base mt-2"><span>Total</span><span className="text-primary">{formatMXN(order.total)}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Points */}
        {order && order.points_earned > 0 && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-5 mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-green-600 fill-green-600" />
              <span className="font-body font-semibold text-green-700">Ganaste +{order.points_earned} puntos Berlioz</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button onClick={() => navigate("/menu")} className="flex-1 gap-2">
            <CalendarPlus className="w-4 h-4" /> Nuevo pedido
          </Button>
          <Button variant="outline" onClick={shareWhatsApp} className="flex-1 gap-2">
            <MessageCircle className="w-4 h-4" /> Compartir por WhatsApp
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} className="flex-1 gap-2">
            <Home className="w-4 h-4" /> Volver al inicio
          </Button>
        </div>

        {/* Rating */}
        {showRating && !ratingSubmitted && order && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-xl border border-border bg-card p-6">
            <p className="font-heading text-lg mb-3">¿Cómo estuvo tu experiencia?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} onClick={() => handleRate(star)} className="transition-transform hover:scale-110">
                  <Star className={cn("w-8 h-8 transition-colors", (hoveredStar >= star || selectedRating >= star) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>
        )}
        {ratingSubmitted && <p className="font-body text-green-600 font-medium">¡Gracias por tu opinión! ⭐</p>}
      </div>
    </BaseLayout>
  );
};

export default OrderConfirmationPage;
