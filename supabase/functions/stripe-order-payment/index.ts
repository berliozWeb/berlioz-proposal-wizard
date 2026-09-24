import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_PUBLISHABLE_KEY = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
const CONSUMER_KEY = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
const CONSUMER_SECRET = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");
const STORE_URL = "https://berlioz.mx";

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("intent"), order_id: z.number().int().positive() }),
  z.object({
    action: z.literal("confirm"),
    order_id: z.number().int().positive(),
    payment_intent_id: z.string().regex(/^pi_[A-Za-z0-9]+$/),
  }),
]);

async function woo(path: string, init?: RequestInit) {
  const res = await fetch(`${STORE_URL}/wp-json/wc/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Woo [${res.status}]: ${text}`);
  return JSON.parse(text);
}

async function stripe(path: string, params?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? new URLSearchParams(params) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe [${res.status}]: ${data?.error?.message ?? JSON.stringify(data)}`);
  return data;
}

const PAID = ["processing", "completed", "on-hold"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!STRIPE_SECRET_KEY || !STRIPE_PUBLISHABLE_KEY || !CONSUMER_KEY || !CONSUMER_SECRET) {
      return json({ error: "Pago no configurado" }, 500);
    }
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Datos inválidos", details: parsed.error.flatten() }, 400);
    const body = parsed.data;

    // El total siempre lo dicta WooCommerce.
    const order = await woo(`/orders/${body.order_id}`);
    const amount = Math.round(Number(order.total) * 100);
    if (!amount || amount < 1000) return json({ error: "Total del pedido inválido" }, 409);

    if (body.action === "intent") {
      if (PAID.includes(order.status)) return json({ error: "Este pedido ya está pagado" }, 409);
      const meta = (order.meta_data ?? []).find((m: any) => m.key === "_berlioz_stripe_pi")?.value;
      let pi: any = null;
      if (meta) {
        try {
          pi = await stripe(`/payment_intents/${meta}`);
          if (pi.status === "succeeded" || pi.status === "canceled") pi = null;
          else if (pi.amount !== amount) pi = await stripe(`/payment_intents/${meta}`, { amount: String(amount) });
        } catch { pi = null; }
      }
      if (!pi) {
        pi = await stripe("/payment_intents", {
          amount: String(amount),
          currency: "mxn",
          "automatic_payment_methods[enabled]": "true",
          receipt_email: order.billing?.email ?? "",
          description: `Pedido Berlioz #${order.number ?? order.id}`,
          "metadata[woo_order_id]": String(order.id),
          "metadata[origen]": "web-nueva",
        });
        await woo(`/orders/${order.id}`, {
          method: "PUT",
          body: JSON.stringify({ meta_data: [{ key: "_berlioz_stripe_pi", value: pi.id }] }),
        });
      }
      return json({
        client_secret: pi.client_secret,
        publishable_key: STRIPE_PUBLISHABLE_KEY,
        total: Number(order.total),
        order_number: order.number ?? String(order.id),
      });
    }

    // confirm
    const pi = await stripe(`/payment_intents/${body.payment_intent_id}`);
    if (pi.metadata?.woo_order_id !== String(order.id)) return json({ error: "El pago no corresponde al pedido" }, 409);
    if (pi.status !== "succeeded") return json({ error: "El pago no se completó", status: pi.status }, 402);
    if (pi.amount_received < amount) return json({ error: "Monto pagado incompleto" }, 409);

    if (!PAID.includes(order.status)) {
      // set_paid mueve el pedido a "processing": la tienda dispara correos y calendario.
      await woo(`/orders/${order.id}`, {
        method: "PUT",
        body: JSON.stringify({
          set_paid: true,
          payment_method: "stripe",
          payment_method_title: "Tarjeta (web nueva)",
          transaction_id: pi.latest_charge ?? pi.id,
        }),
      });
    }
    return json({ ok: true, order_number: order.number ?? String(order.id), total: Number(order.total) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("stripe-order-payment:", message);
    return json({ error: "No se pudo procesar el pago", details: message }, 502);
  }
});
