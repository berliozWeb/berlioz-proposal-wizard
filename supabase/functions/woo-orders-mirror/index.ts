import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/woocommerce";

async function wooFetch(path: string): Promise<Response> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const wooKey = Deno.env.get("WOOCOMMERCE_API_KEY");
  if (!lovableKey || !wooKey) {
    throw new Error("LOVABLE_API_KEY or WOOCOMMERCE_API_KEY missing");
  }
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": wooKey,
    },
  });
  return res;
}

function findMeta(arr: any[] | undefined, key: string): string {
  return arr?.find((m: any) => m.key === key)?.value || "";
}

function orderToItems(order: any) {
  const empresa =
    order.billing?.company ||
    `${order.billing?.first_name ?? ""} ${order.billing?.last_name ?? ""}`.trim();
  const email = order.billing?.email || "";
  const orderTotal = parseFloat(order.total || "0");
  const orderDate = order.date_created
    ? new Date(order.date_created).toISOString()
    : new Date().toISOString();
  const deliveryDate = findMeta(order.meta_data, "Fecha de Entrega");
  const deliverySchedule = findMeta(order.meta_data, "Horario de Entrega");

  return (order.line_items || []).map((item: any) => ({
    woo_order_id: order.id,
    order_date: orderDate,
    empresa,
    email,
    product_name: item.name,
    product_id: item.product_id,
    sku: item.sku || "",
    category: item.categories?.[0]?.name || findMeta(item.meta_data, "_category") || "",
    quantity: item.quantity,
    unit_price: parseFloat(item.price || "0"),
    order_total: orderTotal,
    delivery_date: deliveryDate,
    delivery_schedule: deliverySchedule,
    payment_method: order.payment_method_title || "",
  }));
}

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
    const sorted = Object.entries(products).sort((a, b) => b[1] - a[1]).slice(0, 6);
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const trigger = url.searchParams.get("trigger") === "cron" ? "cron" : "manual";
  const daysParam = parseInt(url.searchParams.get("days") || "0", 10);

  // Determine "after" date
  let after: string;
  if (daysParam > 0) {
    after = new Date(Date.now() - daysParam * 86400000).toISOString();
  } else {
    // Incremental: from last seen order_date, fallback to 90 days
    const { data: latest } = await supabase
      .from("woo_order_items")
      .select("order_date")
      .order("order_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.order_date) {
      // back off 1 hour to catch late-updated orders
      after = new Date(new Date(latest.order_date).getTime() - 3600_000).toISOString();
    } else {
      after = new Date(Date.now() - 90 * 86400000).toISOString();
    }
  }

  const { data: runRow, error: runErr } = await supabase
    .from("woo_sync_runs")
    .insert({
      kind: "orders",
      trigger,
      status: "running",
      metadata: { after },
    })
    .select("id")
    .single();
  if (runErr) {
    return new Response(
      JSON.stringify({ error: `run insert failed: ${runErr.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const runId = runRow.id;

  try {
    let page = 1;
    const perPage = 100;
    let totalItems = 0;
    let totalOrders = 0;

    while (true) {
      const q = new URLSearchParams({
        per_page: String(perPage),
        page: String(page),
        after,
        orderby: "date",
        order: "asc",
        status: "completed,processing,on-hold",
      });
      const res = await wooFetch(`/orders?${q.toString()}`);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Woo /orders page ${page} -> ${res.status}: ${body.slice(0, 200)}`);
      }
      const orders = await res.json();
      if (!Array.isArray(orders) || orders.length === 0) break;

      const rows = orders.flatMap(orderToItems);
      if (rows.length > 0) {
        const { error } = await supabase
          .from("woo_order_items")
          .upsert(rows, { onConflict: "woo_order_id,product_id" });
        if (error) {
          console.error("orders upsert error page", page, error.message);
          throw new Error(`Upsert failed: ${error.message}`);
        }
      }
      totalItems += rows.length;
      totalOrders += orders.length;

      if (orders.length < perPage) break;
      page++;
      if (page > 100) break; // hard safety cap
    }

    if (totalItems > 0) await refreshInsights(supabase);

    await supabase
      .from("woo_sync_runs")
      .update({
        finished_at: new Date().toISOString(),
        items_synced: totalItems,
        pages_fetched: page,
        status: "success",
        metadata: { after, orders: totalOrders },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ ok: true, orders: totalOrders, items: totalItems, after }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("woo-orders-mirror error:", msg);
    await supabase
      .from("woo_sync_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        error: msg.slice(0, 1000),
      })
      .eq("id", runId);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});