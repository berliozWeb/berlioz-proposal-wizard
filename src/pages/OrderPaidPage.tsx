import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

const OrderPaidPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { clearCart } = useCart();
  const [state, setState] = useState<"ok" | "loading" | "error">("ok");
  const [orderNumber, setOrderNumber] = useState(sessionStorage.getItem("berlioz_woo_order_number") ?? "");

  useEffect(() => {
    // Regreso tras verificación 3D Secure: confirmar aquí.
    const pi = params.get("payment_intent");
    const orderId = Number(sessionStorage.getItem("berlioz_pending_order_id"));
    if (!pi || !orderId) return;
    setState("loading");
    supabase.functions
      .invoke("stripe-order-payment", { body: { action: "confirm", order_id: orderId, payment_intent_id: pi } })
      .then(({ data, error }) => {
        if (error || !(data as any)?.ok) return setState("error");
        setOrderNumber((data as any).order_number);
        sessionStorage.removeItem("berlioz_pending_order_id");
        clearCart();
        setState("ok");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BaseLayout>
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        {state === "loading" ? (
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
        ) : state === "error" ? (
          <>
            <h1 className="font-heading text-2xl mb-3">No pudimos confirmar tu pago</h1>
            <p className="font-body text-muted-foreground mb-6">
              Si se hizo el cargo, escríbenos por WhatsApp al 55 8237 5469 y lo revisamos.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-10 h-10 text-primary" strokeWidth={3} />
            </div>
            <h1 className="font-heading text-3xl mb-2">¡Pago recibido!</h1>
            <p className="font-body text-muted-foreground mb-8">
              {orderNumber ? `Pedido #${orderNumber} confirmado. ` : ""}Te enviamos la confirmación por correo.
            </p>
          </>
        )}
        <Button onClick={() => navigate("/menu")}>Hacer otro pedido</Button>
      </div>
    </BaseLayout>
  );
};

export default OrderPaidPage;
