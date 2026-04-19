import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-wc-webhook-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const secret = Deno.env.get("WOO_WEBHOOK_SECRET");
    const body = await req.text();

    if (body.trim().startsWith('webhook_id=') || body.trim() === '') {
      return new Response(JSON.stringify({ received: true, type: 'ping' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature only if secret is configured
    if (secret) {
      const signature = req.headers.get("x-wc-webhook-signature");
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sigBytes = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(body),
      );
      const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
      if (signature !== expected) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
    }

    let order;
    try {
      order = JSON.parse(body);
    } catch {
      const params = new URLSearchParams(body);
      const jsonStr = params.get('payload') || body;
      try {
        order = JSON.parse(jsonStr);
      } catch {
        console.error('Body recibido:', body.substring(0, 200));
        return new Response(JSON.stringify({ error: 'Invalid payload', received: body.substring(0, 100) }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const empresa =
      order.billing?.company ||
      `${order.billing?.first_name ?? ""} ${order.billing?.last_name ?? ""}`.trim();
    const email = order.billing?.email || "";
    const orderTotal = parseFloat(order.total || "0");
    const orderDate = order.date_created
      ? new Date(order.date_created).toISOString()
      : new Date().toISOString();

    const findMeta = (arr: any[] | undefined, key: string) =>
      arr?.find((m: any) => m.key === key)?.value || "";

    const deliveryDate = findMeta(order.meta_data, "Fecha de Entrega");
    const deliverySchedule = findMeta(order.meta_data, "Horario de Entrega");

    const items = (order.line_items || []).map((item: any) => ({
      woo_order_id: order.id,
      order_date: orderDate,
      empresa,
      email,
      product_name: item.name,
      product_id: item.product_id,
      sku: item.sku || "",
      category:
        findMeta(item.meta_data, "_category") ||
        item.categories?.[0]?.name ||
        "",
      quantity: item.quantity,
      unit_price: parseFloat(item.price || "0"),
      order_total: orderTotal,
      delivery_date: deliveryDate,
      delivery_schedule: deliverySchedule,
      payment_method: order.payment_method_title || "",
    }));

    if (items.length > 0) {
      const { error } = await supabase.from("woo_order_items").insert(items);
      if (error) throw error;
      await refreshInsights(supabase);
    }

    return new Response(
      JSON.stringify({ received: true, items: items.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("woo-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function refreshInsights(supabase: any) {
  const { data: rows } = await supabase
    .from("woo_order_items")
    .select("product_name, category, quantity");

  if (!rows?.length) return;

  const byCategory: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const cat = (row.category || "sin_categoria").toLowerCase().replace(/\s+/g, "_");
    if (!byCategory[cat]) byCategory[cat] = {};
    byCategory[cat][row.product_name] =
      (byCategory[cat][row.product_name] || 0) + (row.quantity || 0);
  }

  for (const [cat, products] of Object.entries(byCategory)) {
    const sorted = Object.entries(products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const text =
      `Productos más pedidos en ${cat}: ` +
      sorted.map(([name, qty]) => `${name} (${qty} unidades)`).join(", ") +
      ".";

    await supabase.from("sales_insights").upsert(
      {
        insight_type: "top_products",
        context_key: cat,
        insight_text: text,
        metadata: { top: sorted.map(([name]) => name), auto_generated: true },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "insight_type,context_key" },
    );
  }
}
