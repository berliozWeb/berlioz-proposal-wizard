import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/domain/value-objects/Money";
import { Lock } from "lucide-react";

export interface PaymentSession {
  orderId: number;
  orderNumber: string;
  clientSecret: string;
  publishableKey: string;
  total: number;
  payUrl: string;
}

interface Props {
  session: PaymentSession | null;
  onClose: () => void;
  onPaid: (orderNumber: string) => void;
}

function PayForm({ session, onPaid }: { session: PaymentSession; onPaid: Props["onPaid"] }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    sessionStorage.setItem("berlioz_pending_order_id", String(session.orderId));
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/pedido-pagado` },
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message ?? "No se pudo procesar la tarjeta.");
      setPaying(false);
      return;
    }
    const { data, error: fnError } = await supabase.functions.invoke("stripe-order-payment", {
      body: { action: "confirm", order_id: session.orderId, payment_intent_id: paymentIntent!.id },
    });
    if (fnError || !(data as any)?.ok) {
      setError("Tu pago se recibió, pero no pudimos confirmarlo en la tienda. Escríbenos por WhatsApp con tu número de pedido.");
      setPaying(false);
      return;
    }
    onPaid(session.orderNumber);
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="font-body text-sm text-destructive">{error}</p>}
      <Button onClick={pay} disabled={!stripe || paying} className="w-full" size="lg">
        <Lock className="w-4 h-4 mr-2" />
        {paying ? "Procesando pago..." : `PAGAR ${formatMXN(session.total)}`}
      </Button>
      <p className="font-body text-[11px] text-muted-foreground text-center">
        ¿Problemas con tu tarjeta?{" "}
        <a href={session.payUrl} className="text-primary underline">Paga en berlioz.mx</a>
      </p>
    </div>
  );
}

const StripePaymentDialog = ({ session, onClose, onPaid }: Props) => {
  const stripePromise = useMemo(
    () => (session ? loadStripe(session.publishableKey) : null),
    [session?.publishableKey],
  );

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Pago con tarjeta</DialogTitle>
          <DialogDescription className="font-body text-xs">
            Pedido #{session?.orderNumber} · Total con IVA y envío: {session ? formatMXN(session.total) : ""}
          </DialogDescription>
        </DialogHeader>
        {session && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: session.clientSecret,
              locale: "es",
              appearance: { theme: "stripe", variables: { colorPrimary: "#014D6F", fontFamily: "Montserrat, sans-serif" } },
            }}
          >
            <PayForm session={session} onPaid={onPaid} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentDialog;
