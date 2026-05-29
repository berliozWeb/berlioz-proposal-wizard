import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COMPLEMENTOS = [
  { id:"agua-fresca-jamaica", name:"Agua Fresca de Jamaica", price:45, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", tags:["bebida","vegano","temporada","fresco"] },
  { id:"agua-fresca-limon-hierbabuena", name:"Agua de Limón con Hierbabuena", price:45, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", tags:["bebida","vegano","temporada","fresco","refrescante"] },
  { id:"agua-fresca-pepino-limon", name:"Agua de Pepino con Limón", price:45, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", tags:["bebida","vegano","temporada","keto","fresco"] },
  { id:"agua-fresca-sandia", name:"Agua Fresca de Sandía", price:45, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", tags:["bebida","vegano","temporada","verano"] },
  { id:"agua-fresca-tamarindo", name:"Agua Fresca de Tamarindo", price:45, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", tags:["bebida","vegano","temporada"] },
  { id:"agua-bui-natural", name:"Agua Bui Natural", price:50, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", tags:["bebida","vegano","keto","premium","muy-pedido"] },
  { id:"jugo-de-naranja", name:"Jugo de Naranja (Jus)", price:60, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", tags:["bebida","vegano","desayuno","popular"] },
  { id:"cafe-frio", name:"Café Frío (latte de avena)", price:60, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2015/01/17.jpg", tags:["bebida","vegano","keto","sin-gluten","popular"] },
  { id:"cafe-te-berlioz", name:"Café / Té Berlioz — termo 12 tazas", price:540, unit:"grupal (12 tazas)", img:"https://berlioz.mx/wp-content/uploads/2015/01/17.jpg", tags:["bebida","grupal","muy-pedido","caliente"] },
  { id:"ensalada-de-fruta", name:"Ensalada de Fruta", price:50, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2022/06/berlioz_fabian-51.jpg", tags:["addon","vegano","keto","sin-gluten","fresco","popular"] },
  { id:"crudites-con-limon", name:"Crudités con Limón", price:50, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2024/04/crudite.jpg", tags:["addon","vegano","keto","sin-gluten"] },
  { id:"yogurt-organico", name:"Yogurt Orgánico con granola", price:50, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2023/03/breakfast-bag.webp", tags:["addon","vegetariano","desayuno"] },
  { id:"cookies", name:"Cookies artesanales", price:50, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2020/03/berlioz_fabian-03-scaled.jpg", tags:["addon","vegetariano","popular"] },
  { id:"panque-de-naranja", name:"Panqué de Naranja", price:50, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2020/03/berlioz_fabian-03-scaled.jpg", tags:["addon","vegetariano"] },
  { id:"mix-de-semillas", name:"Mix de Semillas Naturales", price:60, unit:"por persona", img:"https://berlioz.mx/wp-content/uploads/2020/03/berlioz_fabian-03-scaled.jpg", tags:["addon","vegano","keto","sin-gluten"] },
];

const SYSTEM = `Eres el asistente de ventas de Berlioz Catering Corporativo (CDMX).
Recomienda 3-4 complementos para aumentar el ticket del pedido que recibes.

DATOS REALES DE PEDIDOS 2025-2026 (7,242 pedidos):
- ORZO + PINK BOX: par dominante (485 pedidos)
- Las bebidas aparecen en la mayoría de pedidos multi
- Agua Bui y Aguas Frescas son las más pedidas con comidas
- Café/Té Berlioz muy popular en desayunos
- Pedidos con restricciones tienen ticket +44% mayor

REGLAS:
1. Recomienda EXACTAMENTE 3 o 4 productos del catálogo recibido
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

  try {
    const body = await req.json();
    const { tierItems = [], eventType = "comida", peopleCount = 10, dietaryCounts = [], month = new Date().getMonth() + 1 } = body;

    const itemsList = tierItems.map((i: { productName: string; quantity: number; unitPrice: number }) =>
      `- ${i.productName} ×${i.quantity} ($${i.unitPrice})`).join("\n");

    const dietas = dietaryCounts.length > 0
      ? dietaryCounts.map((d: { tipo: string; cantidad: number }) => `${d.cantidad} ${d.tipo}`).join(", ")
      : "ninguna";

    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const esVerano = month >= 4 && month <= 9;

    const catalogoStr = COMPLEMENTOS.map(c =>
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

    const validIds = new Set(COMPLEMENTOS.map(c => c.id));
    const recs = (parsed.recommendations || []).filter((r: { id: string }) => validIds.has(r.id)).slice(0, 4);

    if (recs.length === 0) {
      const fallbackIds = eventType === "desayuno"
        ? ["cafe-te-berlioz", "jugo-de-naranja", "ensalada-de-fruta"]
        : ["agua-fresca-jamaica", "agua-bui-natural", "crudites-con-limon"];
      return new Response(JSON.stringify({
        recommendations: COMPLEMENTOS.filter(c => fallbackIds.includes(c.id)).map(c => ({ ...c, reason: "Muy pedido por nuestros clientes" })),
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ recommendations: recs }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("get-upsell-recommendations error:", err);
    const fallback = COMPLEMENTOS.filter(c => ["agua-fresca-jamaica","agua-bui-natural","cafe-te-berlioz","ensalada-de-fruta"].includes(c.id))
      .map(c => ({ ...c, reason: "Muy pedido por nuestros clientes" }));
    return new Response(JSON.stringify({ recommendations: fallback }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});