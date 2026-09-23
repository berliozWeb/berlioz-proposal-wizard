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
      throw new Error(
        `Woo /products page ${page} -> ${res.status}: ${body.slice(0, 200)}`,
      );
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

async function fetchVariations(productId: number): Promise<any[]> {
  const out: any[] = [];
  let page = 1;
  while (true) {
    const res = await wooFetch(
      `/products/${productId}/variations?per_page=100&page=${page}`,
    );
    if (!res.ok) {
      console.error(
        `variations ${productId} -> ${res.status}: ${(await res.text()).slice(0, 160)}`,
      );
      break;
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
    page++;
    if (page > 10) break;
  }
  return out;
}

function mapVariation(v: any) {
  const attrs = Array.isArray(v.attributes)
    ? v.attributes.map((a: any) => a?.option).filter(Boolean)
    : [];
  const precio = v.price ? parseFloat(v.price) : v.regular_price ? parseFloat(v.regular_price) : null;
  return {
    id: String(v.id),
    woo_id: v.id,
    sku: v.sku || null,
    opcion: attrs.join(" / ") || String(v.id),
    nombre: attrs.join(" / ") || String(v.id),
    precio,
    imagen_url: v.image?.src ?? null,
    en_stock: (v.stock_status ?? "instock") === "instock" && v.purchasable !== false,
  };
}

/**
 * Regla absoluta: solo lo publicado y visible en Woo existe aquí.
 * Devuelve el motivo de exclusión, o null si el producto es vendible.
 */
function motivoExclusion(p: any, precio: number | null): string | null {
  if (p.status !== "publish") return `status=${p.status}`;
  const visibility = String(p.catalog_visibility ?? "visible");
  if (visibility !== "visible" && visibility !== "catalog") {
    return `catalog_visibility=${visibility}`;
  }
  const restringidoPorGrupo = Array.isArray(p.meta_data)
    ? p.meta_data.some(
        (m: any) =>
          m?.key === "groups-read" &&
          m?.value !== null &&
          m?.value !== "" &&
          !(Array.isArray(m.value) && m.value.length === 0),
      )
    : false;
  if (restringidoPorGrupo) return "restringido por membresía (groups-read)";
  if ((p.stock_status ?? "instock") !== "instock") return "sin stock";
  if (!(Number(precio ?? 0) > 0)) return "precio $0";
  return null;
}

function mapProductRow(p: any, variaciones: any[]) {
  const gallery = Array.isArray(p.images)
    ? p.images.map((i: any) => i?.src).filter(Boolean)
    : [];
  // Nombres de categoría tal cual están en Woo (no el slug), todas las del producto.
  const categorias: string[] = Array.isArray(p.categories)
    ? p.categories.map((c: any) => String(c?.name ?? "").trim()).filter(Boolean)
    : [];
  const tags: string[] = Array.isArray(p.tags)
    ? p.tags.map((t: any) => String(t?.name ?? "").trim()).filter(Boolean)
    : [];

  const precioReg = p.regular_price ? parseFloat(p.regular_price) : null;
  const precioSale = p.sale_price ? parseFloat(p.sale_price) : null;
  let precio = p.price ? parseFloat(p.price) : precioReg;

  const varPrecios = variaciones
    .map((v) => v.precio)
    .filter((n: any) => typeof n === "number" && n > 0) as number[];
  const precioMin = varPrecios.length ? Math.min(...varPrecios) : precio ?? precioReg;
  const precioMax = varPrecios.length ? Math.max(...varPrecios) : precio ?? precioReg;
  if (!precio && varPrecios.length) precio = precioMin;

  const motivo = motivoExclusion(p, precio);

  return {
    row: {
      id: String(p.id),
      woo_id: typeof p.id === "number" ? p.id : null,
      sku: p.sku || null,
      nombre: p.name || "",
      tipo: p.type === "variable" ? "variable" : "simple",
      categoria: categorias[0] ?? null,
      woo_categorias: categorias,
      woo_tags: tags,
      permalink: p.permalink || null,
      menu_order: typeof p.menu_order === "number" ? p.menu_order : 0,
      upsell_ids: Array.isArray(p.upsell_ids) ? p.upsell_ids : [],
      imagenes_galeria: gallery,
      woo_variaciones: variaciones,
      woo_status: p.status ?? null,
      en_stock: (p.stock_status ?? "instock") === "instock",
      precio: precio ?? precioReg,
      precio_min: precioMin,
      precio_max: precioMax,
      precio_rebajado: precioSale || null,
      descripcion: p.description || null,
      descripcion_corta: p.short_description || null,
      imagen_url: gallery[0] ?? null,
      activo: motivo === null,
      total_sales: typeof p.total_sales === "number" ? p.total_sales : 0,
      woo_source: true,
      woo_last_synced_at: new Date().toISOString(),
    },
    motivo,
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
    let variablesConVariantes = 0;
    const excluidos: { nombre: string; motivo: string; woo_id: number | null }[] = [];

    for (const p of products) {
      const variaciones =
        p.type === "variable" ? (await fetchVariations(p.id)).map(mapVariation) : [];
      if (variaciones.length) variablesConVariantes++;

      const { row, motivo } = mapProductRow(p, variaciones);
      const { error } = await supabase.from("productos").upsert(row, { onConflict: "id" });
      if (error) {
        console.error("upsert error", p.id, error.message);
        continue;
      }
      synced++;
      if (motivo) {
        excluidos.push({
          nombre: row.nombre,
          motivo,
          woo_id: row.woo_id,
        });
      }
    }

    // Log de exclusiones para revisión: reemplaza el registro del sync anterior.
    await supabase.from("catalogo_exclusiones").delete().eq("origen", "woo_sync");
    if (excluidos.length) {
      await supabase.from("catalogo_exclusiones").insert(
        excluidos.map((e) => ({
          origen: "woo_sync",
          nombre_buscado: e.nombre,
          motivo: e.motivo,
          woo_id: e.woo_id,
        })),
      );
    }

    // Todo lo que no vive en Woo deja de existir en el sitio (respaldo histórico intacto).
    await supabase
      .from("productos")
      .update({ activo: false })
      .neq("woo_source", true)
      .eq("activo", true);

    await supabase
      .from("woo_sync_runs")
      .update({
        finished_at: new Date().toISOString(),
        items_synced: synced,
        pages_fetched: pages,
        status: "success",
        metadata: {
          total_fetched: products.length,
          variables_con_variantes: variablesConVariantes,
          excluidos: excluidos.length,
        },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        ok: true,
        synced,
        pages,
        total: products.length,
        variables_con_variantes: variablesConVariantes,
        excluidos: excluidos.length,
      }),
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
