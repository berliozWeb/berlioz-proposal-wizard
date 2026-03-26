import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Star, MessageCircle, CalendarPlus, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatMXN } from "@/domain/value-objects/Money";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props { orderId: string | null }

interface OrderData {
  id: string;
  order_number: string;
  delivery_date: string;
  delivery_slot: string;
  delivery_address_text: string | null;
  total: number;
  points_earned: number;
  rating: number | null;
  items: { product_name: string; quantity: number; unit_price: number }[];
}

const CheckoutStep4Confirmation = ({ orderId }: Props) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

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
    if (!order) return;
    const text = encodeURIComponent(
      `🍱 ¡Pedido confirmado en Berlioz!\nPedido: ${order.order_number}\nEntrega: ${order.delivery_date} · ${order.delivery_slot}\nTotal: ${formatMXN(order.total)}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const loyaltyPoints = (profile as any)?.loyalty_points ?? 0;
  const nextReward = 500;

  if (!order) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-pulse font-body text-muted-foreground">Cargando confirmación...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
      {/* Animated checkmark */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center animate-[scale-in_0.5s_ease-out]">
        <Check className="w-10 h-10 text-success animate-[draw-check_0.3s_0.3s_ease-out_both]" strokeWidth={3} />
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl text-foreground mb-2">¡Tu pedido está confirmado!</h1>
      <p className="font-body text-muted-foreground mb-8">Pedido #{order.order_number}</p>

      {/* Order summary card */}
      <div className="rounded-xl border border-border bg-card p-6 text-left mb-8">
        <h3 className="font-heading text-lg mb-4">Resumen del pedido</h3>
        <div className="space-y-2 font-body text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{formatMXN(item.unit_price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entrega</span>
              <span>{order.delivery_date} · {order.delivery_slot}</span>
            </div>
            {order.delivery_address_text && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dirección</span>
                <span className="text-right max-w-[200px] truncate">{order.delivery_address_text}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base mt-2">
              <span>Total</span>
              <span className="text-primary">{formatMXN(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Points earned */}
      <div className="rounded-xl bg-success/5 border border-success/20 p-5 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-5 h-5 text-success fill-success" />
          <span className="font-body font-semibold text-success">
            Ganaste +{order.points_earned} puntos Berlioz
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-1">
          <div
            className="bg-success h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (loyaltyPoints / nextReward) * 100)}%` }}
          />
        </div>
        <p className="font-body text-xs text-muted-foreground">
          {loyaltyPoints} / {nextReward} puntos para tu próxima recompensa
        </p>
        <button onClick={() => navigate("/dashboard/recompensas")} className="font-body text-xs text-secondary hover:underline mt-1">
          Ver mis recompensas →
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Button onClick={() => navigate("/menu")} className="flex-1 gap-2">
          <CalendarPlus className="w-4 h-4" /> Programar próximo pedido
        </Button>
        <Button variant="outline" onClick={shareWhatsApp} className="flex-1 gap-2">
          <MessageCircle className="w-4 h-4" /> Compartir por WhatsApp
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")} className="flex-1 gap-2">
          <Home className="w-4 h-4" /> Volver al inicio
        </Button>
      </div>

      {/* Rating */}
      {showRating && !ratingSubmitted && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-xl border border-border bg-card p-6">
          <p className="font-heading text-lg mb-3">¿Cómo estuvo tu experiencia?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => handleRate(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    (hoveredStar >= star || selectedRating >= star)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}
      {ratingSubmitted && (
        <p className="font-body text-success font-medium">¡Gracias por tu opinión! ⭐</p>
      )}
    </div>
  );
};

export default CheckoutStep4Confirmation;
