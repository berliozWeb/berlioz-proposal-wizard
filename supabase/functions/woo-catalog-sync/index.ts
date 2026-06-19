import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/woocommerce";

const CATEGORY_LABELS: Record<string, string> = {
  coffee_break: "Coffee Break",
  desayuno: "Desayuno",
  working_lunch: "Working Lunch",
  bebidas: "Bebidas",
  snacks: "Snacks",
  surtidos: "Surtidos",
  tortas_piropo: "Tortas Piropo",
};

function normalizeCategoria(raw?: string | null): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return raw
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function wooFetch(path: string): Promise<Response> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const wooKey = Deno.env.get("WOOCOMMERCE_API_KEY");
  if (!lovableKey || !wooKey) {
    throw new Error("LOVABLE_API_KEY or WOOCOMMERCE_API_KEY missing");
  }
  const url = `${GATEWAY_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": wooKey,
    },
  });
  return res;
}

async function fetchAllProducts() {
  const all: any[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const res = await wooFetch(
      `/products?per_page=${perPage}&page=${page}&status=publish`,
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Woo /products page ${page} -> ${res.status}: ${body.slice(0, 200)}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
    if (page > 50) break; // safety
  }
  return { products: all, pages: page };
}

function mapProductRow(p: any) {
  const gallery = Array.isArray(p.images)
    ? p.images.map((i: any) => i?.src).filter(Boolean)
    : [];
  const mainImage = gallery[0] ?? null;
  const categoria = normalizeCategoria(p.categories?.[0]?.slug ?? p.categories?.[0]?.name);
  const precio = p.price ? parseFloat(p.price) : null;
  const precioMin = p.price ? parseFloat(p.price) : null;
  const precioMax = p.price ? parseFloat(p.price) : null;
  const precioReg = p.regular_price ? parseFloat(p.regular_price) : null;
  const precioSale = p.sale_price ? parseFloat(p.sale_price) : null;
  return {
    id: String(p.id),
    sku: p.sku || null,
    nombre: p.name || "",
    tipo: p.type === "variable" ? "variable" : "simple",
    categoria,
    precio: precio ?? precioReg,
    precio_min: precioMin ?? precioReg,
    precio_max: precioMax ?? precioReg,
    precio_rebajado: precioSale || null,
    descripcion: p.description || null,
    descripcion_corta: p.short_description || null,
    imagen_url: mainImage,
    activo: p.status === "publish" && (p.stock_status ?? "instock") === "instock",
    woo_source: true,
    woo_last_synced_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const trigger = url.searchParams.get("trigger") === "cron" ? "cron" : "manual";

  const { data: runRow, error: runErr } = await supabase
    .from("woo_sync_runs")
    .insert({ kind: "catalog", trigger, status: "running" })
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
    const { products, pages } = await fetchAllProducts();
    let synced = 0;

    for (const p of products) {
      const row = mapProductRow(p);
      // Upsert only Woo-owned fields; preserve curated locals.
      const { error } = await supabase
        .from("productos")
        .upsert(row, { onConflict: "id" });
      if (error) {
        console.error("upsert error", p.id, error.message);
        continue;
      }
      synced++;
    }

    await supabase
      .from("woo_sync_runs")
      .update({
        finished_at: new Date().toISOString(),
        items_synced: synced,
        pages_fetched: pages,
        status: "success",
        metadata: { total_fetched: products.length },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ ok: true, synced, pages, total: products.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("woo-catalog-sync error:", msg);
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