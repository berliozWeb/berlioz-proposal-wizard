import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IMG_FALLBACK = "https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-46-1-scaled.jpg";

interface Complemento {
  id: string; name: string; price: number; unit: string; img: string; tags: string[];
}

// Candidatos reales de WooCommerce: complementos individuales de Bebidas y Coffee Break.
// Nada hardcodeado — si Ana despublica un producto, deja de ofrecerse solo.
async function loadComplementos(sb: ReturnType<typeof createClient>): Promise<Complemento[]> {
  const { data } = await sb.from("productos")
    .select("id, nombre, precio, precio_min, imagen_url, dietary_tags, woo_categorias, categoria, total_sales")
    .eq("activo", true).eq("woo_source", true)
    .order("total_sales", { ascending: false })
    .limit(400);

  const out: Complemento[] = [];
  for (const p of data ?? []) {
    const cats: string[] = (p.woo_categorias as string[]) ?? [];
    const esComplemento = cats.includes("Bebidas") || cats.includes("Coffee Break");
    if (!esComplemento) continue;
    const price = Number(p.precio ?? p.precio_min ?? 0);
    if (price <= 0 || price > 600) continue;
    const nombre = String(p.nombre ?? "");
    if (/costo por cambio|mi logo|entrega especial|extras|caja berlioz/i.test(nombre)) continue;

    const grupal = price >= 200;
    const tags = [
      cats.includes("Bebidas") ? "bebida" : "addon",
      ...(((p.dietary_tags as string[]) ?? [])),
      ...(grupal ? ["grupal"] : []),
      ...(Number(p.total_sales ?? 0) > 1000 ? ["muy-pedido"] : []),
      ...(/agua|jugo|refresco|café frío/i.test(nombre) ? ["fresco"] : []),
    ];

    out.push({
      id: String(p.id),
      name: nombre,
      price,
      unit: grupal ? "grupal" : "por persona",
      img: (p.imagen_url as string) || IMG_FALLBACK,
      tags,
    });
    if (out.length >= 30) break;
  }
  return out;
}

const SYSTEM = `Eres el asistente de ventas de Berlioz Catering Corporativo (CDMX).
Recomienda 3-4 complementos para aumentar el ticket del pedido que recibes.

DATOS REALES DE PEDIDOS 2025-2026 (7,242 pedidos):
- ORZO + PINK BOX: par dominante (485 pedidos)
- Las bebidas aparecen en la mayoría de pedidos multi
- Agua Bui y Aguas Frescas son las más pedidas con comidas
- Café/Té Berlioz muy popular en desayunos
- Pedidos con restricciones tienen ticket +44% mayor

REGLAS:
1. Recomienda EXACTAMENTE 3 o 4 productos del catálogo recibido, usando su id tal cual
2. Prioriza bebidas — son el upsell más natural
3. Mayo-agosto = verano en CDMX → prioriza aguas frescas y refrescantes
4. Si hay restricciones dietéticas, incluye al menos 1 opción compatible
5. No repitas productos que ya están en el pedido
6. Razón: frase corta atractiva máximo 12 palabras
7. Ordena de más a menos relevante

Responde SOLO JSON válido sin markdown:
{"recommendations":[{"id":"...","name":"...","price":45,"unit":"por persona","img":"...","reason":"...","tag":"..."}]}`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let complementos: Complemento[] = [];

  try {
    const body = await req.json();
    const { tierItems = [], eventType = "comida", peopleCount = 10, dietaryCounts = [], month = new Date().getMonth() + 1 } = body;

    complementos = await loadComplementos(sb);
    if (complementos.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const enPedido = new Set<string>(
      (tierItems as { productName?: string }[]).map(i => String(i.productName ?? "").toLowerCase())
    );
    const candidatos = complementos.filter(c => !enPedido.has(c.name.toLowerCase()));

    const itemsList = (tierItems as { productName: string; quantity: number; unitPrice: number }[])
      .map(i => `- ${i.productName} ×${i.quantity} ($${i.unitPrice})`).join("\n");

    const dietas = dietaryCounts.length > 0
      ? dietaryCounts.map((d: { tipo: string; cantidad: number }) => `${d.cantidad} ${d.tipo}`).join(", ")
      : "ninguna";

    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const esVerano = month >= 4 && month <= 9;

    const catalogoStr = candidatos.map(c =>
      `{id:"${c.id}",name:"${c.name}",price:${c.price},unit:"${c.unit}",tags:["${c.tags.join('","')}"],img:"${c.img}"}`
    ).join("\n");

    const userMsg = `Evento: ${eventType} | ${peopleCount} personas | ${meses[month-1]} | ${esVerano ? "VERANO — prioriza aguas frescas" : "temporada fría"}
Restricciones: ${dietas}
Pedido elegido:
${itemsList || "Sin detalle"}
Catálogo disponible:
${catalogoStr}`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const ai = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = ai.content[0].type === "text" ? ai.content[0].text : "{}";
    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(clean);

    const byId = new Map(candidatos.map(c => [c.id, c]));
    const recs = ((parsed.recommendations || []) as { id: string; reason?: string; tag?: string }[])
      .filter(r => byId.has(String(r.id)))
      .slice(0, 4)
      .map(r => {
        const c = byId.get(String(r.id))!;
        return { ...c, reason: r.reason ?? "Muy pedido por nuestros clientes", tag: r.tag ?? c.tags[0] };
      });

    if (recs.length === 0) {
      return new Response(JSON.stringify({ recommendations: fallback(candidatos, eventType) }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ recommendations: recs }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("get-upsell-recommendations error:", err);
    return new Response(JSON.stringify({ recommendations: fallback(complementos, "comida") }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});

// Fallback determinista sobre los mismos candidatos de Woo, por ventas
function fallback(candidatos: Complemento[], eventType: string) {
  const esDesayuno = String(eventType).toLowerCase().includes("desayuno");
  const prefer = esDesayuno
    ? [/café|te|té/i, /jugo/i, /fruta|yogurt/i]
    : [/agua de jamaica|agua de temporada/i, /agua bui/i, /crudit|semillas/i];
  const out: Complemento[] = [];
  for (const rx of prefer) {
    const hit = candidatos.find(c => rx.test(c.name) && !out.includes(c));
    if (hit) out.push(hit);
  }
  for (const c of candidatos) {
    if (out.length >= 3) break;
    if (!out.includes(c)) out.push(c);
  }
  return out.slice(0, 3).map(c => ({ ...c, reason: "Muy pedido por nuestros clientes", tag: c.tags[0] }));
}
