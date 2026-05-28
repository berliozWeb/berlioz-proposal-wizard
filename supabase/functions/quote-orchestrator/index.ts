// ================================================================
// BERLIOZ — supabase/functions/quote-orchestrator/index.ts
// Reescrito desde cero. Catálogo embebido = siempre correcto.
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENVIO = 360;
const IVA   = 0.16;

// ================================================================
// CATÁLOGO LIMPIO — embebido directamente
//
// fmt: "I" = individual (qty = personas que lo reciben)
//      "G" = grupal     (qty = ceil(personas / qg), precio fijo)
// qg:  cuántas personas cubre el producto grupal
// addon: true = complemento, NUNCA plato principal
// ================================================================
const CATALOG = [
  // ── DESAYUNOS ─────────────────────────────────────────────
  { id:"breakfast-bag-pavo",                n:"Breakfast Bag — Pavo",                      cat:"Desayuno", p:250, fmt:"I", tags:["sin_restriccion"] },
  { id:"breakfast-in-roma-pan-dulce",       n:"Breakfast in Roma — Pan dulce",             cat:"Desayuno", p:290, fmt:"I", tags:["sin_restriccion"] },
  { id:"breakfast-in-roma-yogurt-organico", n:"Breakfast in Roma — Yogurt orgánico",       cat:"Desayuno", p:290, fmt:"I", tags:["sin_restriccion"] },
  { id:"box-chilaquiles-verdes-con-huevo",  n:"Box Chilaquiles — Verdes con huevo",        cat:"Desayuno", p:310, fmt:"I", tags:["sin_restriccion","vegetariano","vegano"] },
  { id:"box-chilaquiles-rojos-con-huevo",   n:"Box Chilaquiles — Rojos con huevo",         cat:"Desayuno", p:310, fmt:"I", tags:["sin_restriccion","vegetariano","vegano"] },
  { id:"breakfast-in-london-pavo-y-yogurt", n:"Breakfast in London — Pavo y yogurt",       cat:"Desayuno", p:320, fmt:"I", tags:["sin_restriccion"] },
  { id:"breakfast-blt-pavo-y-yogurt",       n:"Breakfast BLT — Pavo y yogurt",             cat:"Desayuno", p:330, fmt:"I", tags:["sin_restriccion"] },
  { id:"breakfast-in-montreal-yogurt",      n:"Breakfast in Montreal — Con yogurt orgánico",cat:"Desayuno",p:410, fmt:"I", tags:["sin_restriccion"] },

  // ── COMIDAS / WORKING LUNCH ───────────────────────────────
  { id:"lunch-bag-pasta-con-pollo",         n:"Lunch Bag — Pasta con pollo",               cat:"Comida",  p:250, fmt:"I", tags:["sin_restriccion"] },
  { id:"salad-box-pollo-con-agua",          n:"Salad Box — Pollo con agua",                cat:"Comida",  p:280, fmt:"I", tags:["sin_restriccion"] },
  { id:"piropo-tinga-con-jicama",           n:"Piropo – Tinga de Pollo",                   cat:"Comida",  p:280, fmt:"I", tags:["sin_restriccion"] },
  { id:"piropo-cochinita-con-jicama",       n:"Piropo – Cochinita Pibil",                  cat:"Comida",  p:280, fmt:"I", tags:["sin_restriccion","sin_lactosa"] },
  { id:"white-box-con-ensalada",            n:"White Box — Con ensalada de frutas",        cat:"Comida",  p:300, fmt:"I", tags:["sin_restriccion"] },
  { id:"box-oriental-pollo-teriyaki",       n:"Box Oriental — Pollo teriyaki",             cat:"Comida",  p:300, fmt:"I", tags:["sin_restriccion","sin_lactosa"] },
  { id:"golden-box-con-ensalada",           n:"Golden Box — Con ensalada de frutas",       cat:"Comida",  p:330, fmt:"I", tags:["sin_restriccion"] },
  { id:"black-box-con-ensalada",            n:"Black Box — Con ensalada de frutas",        cat:"Comida",  p:330, fmt:"I", tags:["sin_restriccion"] },
  { id:"blt-box-con-chips",                 n:"BLT Box — Con chips",                       cat:"Comida",  p:330, fmt:"I", tags:["sin_restriccion"] },
  { id:"green-box-con-pepino-y-feta",       n:"Green Box — Con ensalada de pepino y feta", cat:"Comida",  p:340, fmt:"I", tags:["sin_restriccion"] },
  { id:"box-vegetariana",                   n:"Box Vegetariana",                           cat:"Comida",  p:340, fmt:"I", tags:["sin_restriccion","vegetariano","vegano"] },
  { id:"aqua-box-con-calabaza",             n:"Aqua Box — Con ensalada de calabaza",       cat:"Comida",  p:350, fmt:"I", tags:["sin_restriccion"] },
  { id:"box-keto-sin-gluten-con-agua",      n:"Box Keto – Sin Gluten",                     cat:"Comida",  p:370, fmt:"I", tags:["sin_restriccion","keto","sin_gluten"] },
  { id:"pink-box-clasica-con-jicama",       n:"Pink Box — Clásica con ensalada de jícama", cat:"Comida",  p:380, fmt:"I", tags:["sin_restriccion"] },
  { id:"orzo-pasta-salad-box-con-pollo",    n:"Orzo Pasta Salad Box — Con pollo",          cat:"Comida",  p:390, fmt:"I", tags:["sin_restriccion"] },
  { id:"salmon-box",                        n:"Salmon Box",                                cat:"Comida",  p:410, fmt:"I", tags:["sin_restriccion","keto","sin_gluten","sin_lactosa"] },
  // Variantes dietéticas comida
  { id:"salad-box-vegetariana-con-agua",    n:"Salad Box — Vegetariana con agua",          cat:"Comida",  p:280, fmt:"I", tags:["vegetariano"] },
  { id:"salad-box-vegana-con-agua",         n:"Salad Box — Vegana con agua",               cat:"Comida",  p:300, fmt:"I", tags:["vegano","vegetariano"] },
  { id:"box-oriental-tofu",                 n:"Box Oriental — Tofu agridulce",             cat:"Comida",  p:300, fmt:"I", tags:["vegetariano","vegano","sin_lactosa"] },
  { id:"pink-box-vegetariana",              n:"Pink Box — Vegetariana",                    cat:"Comida",  p:380, fmt:"I", tags:["vegetariano"] },
  { id:"pink-box-vegana-con-agua",          n:"Pink Box — Vegana con agua",                cat:"Comida",  p:380, fmt:"I", tags:["vegano","vegetariano"] },
  { id:"orzo-pasta-salad-box-vegetariana",  n:"Orzo Pasta Salad Box — Vegetariana",        cat:"Comida",  p:390, fmt:"I", tags:["vegetariano","vegano"] },

  // ── COFFEE BREAK (todos GRUPALES) ─────────────────────────
  // qty = ceil(personas / qg). Precio cubre al grupo, no multiplicar.
  { id:"mini-surtido-balzac",               n:"Mini Surtido Balzac (10 pastelitos)",        cat:"CoffeeBreak", p:220,  fmt:"G", qg:4,  tags:["sin_restriccion"] },
  { id:"mini-surtido-zadig",                n:"Mini Surtido Zadig (8 postres)",             cat:"CoffeeBreak", p:240,  fmt:"G", qg:4,  tags:["sin_restriccion"] },
  { id:"mini-surtido-colette",              n:"Mini Surtido Colette (10 panes franceses)",  cat:"CoffeeBreak", p:290,  fmt:"G", qg:4,  tags:["sin_restriccion"] },
  { id:"mini-surtido-hugo",                 n:"Mini Surtido Hugo (6 panes daneses)",        cat:"CoffeeBreak", p:290,  fmt:"G", qg:4,  tags:["sin_restriccion"] },
  { id:"mini-surtido-camille",              n:"Mini Surtido Camille (6 bocadillos)",        cat:"CoffeeBreak", p:350,  fmt:"G", qg:4,  tags:["sin_restriccion"] },
  { id:"mini-surtido-voltaire",             n:"Mini Surtido Voltaire (6 bocadillos)",       cat:"CoffeeBreak", p:350,  fmt:"G", qg:4,  tags:["sin_restriccion"] },
  { id:"surtido-balzac-25-piezas",          n:"Surtido Balzac (25 pastelitos)",             cat:"CoffeeBreak", p:400,  fmt:"G", qg:8,  tags:["sin_restriccion"] },
  { id:"surtido-zadig-21-piezas",           n:"Surtido Zadig (21 postres surtidos)",        cat:"CoffeeBreak", p:400,  fmt:"G", qg:8,  tags:["sin_restriccion"] },
  { id:"surtido-colette-25-piezas",         n:"Surtido Colette (25 panes franceses)",       cat:"CoffeeBreak", p:450,  fmt:"G", qg:9,  tags:["sin_restriccion"] },
  { id:"surtido-hugo-25-piezas",            n:"Surtido Hugo (16 panes daneses)",            cat:"CoffeeBreak", p:550,  fmt:"G", qg:9,  tags:["sin_restriccion"] },
  { id:"surtido-camille-pollo",             n:"Surtido Camille (15 bocadillos salados)",    cat:"CoffeeBreak", p:700,  fmt:"G", qg:6,  tags:["sin_restriccion"] },
  { id:"surtido-voltaire-pollo",            n:"Surtido Voltaire (15 bocadillos variados)",  cat:"CoffeeBreak", p:750,  fmt:"G", qg:6,  tags:["sin_restriccion"] },
  { id:"coffee-break-am-cafe-8-personas",   n:"Coffee Break AM – Con Café Frío (8 personas)", cat:"CoffeeBreak", p:2700, fmt:"G", qg:8, tags:["sin_restriccion"] },
  { id:"coffee-break-am-jugo-8-personas",   n:"Coffee Break AM – Con Jugo (8 personas)",   cat:"CoffeeBreak", p:2700, fmt:"G", qg:8,  tags:["sin_restriccion"] },
  { id:"coffee-break-pm-8-personas",        n:"Coffee Break PM (8 personas)",               cat:"CoffeeBreak", p:2340, fmt:"G", qg:8,  tags:["sin_restriccion"] },

  // ── BEBIDAS ───────────────────────────────────────────────
  { id:"aguas-frescas-jamaica",             n:"Agua Fresca — Jamaica",                     cat:"Bebida", p:45,  fmt:"I", tags:["sin_restriccion","vegano","keto","sin_gluten"] },
  { id:"agua-bui-natural",                  n:"Agua Bui Natural",                          cat:"Bebida", p:50,  fmt:"I", tags:["sin_restriccion","vegano","keto","sin_gluten"] },
  { id:"jugo-de-naranja",                   n:"Jugo de Naranja (Jus)",                     cat:"Bebida", p:60,  fmt:"I", tags:["sin_restriccion","vegano","sin_gluten"] },
  { id:"cafe-frio",                         n:"Café Frío (latte de avena)",                cat:"Bebida", p:60,  fmt:"I", tags:["sin_restriccion","vegano","keto","sin_gluten"] },
  // Café/Té Berlioz = GRUPAL, $540 FIJO para 12 tazas, qty SIEMPRE = 1
  { id:"cafe-te-berlioz-cafe",              n:"Café / Té Berlioz — termo 12 tazas",        cat:"Bebida", p:540, fmt:"G", qg:12, tags:["sin_restriccion"] },

  // ── ADD-ONS (addon=true — NUNCA como plato principal) ─────
  { id:"ensalada-de-fruta",                 n:"Ensalada de Fruta",              cat:"Addon", p:50,  fmt:"I", addon:true, tags:["sin_restriccion","vegano","keto","sin_gluten"] },
  { id:"crudites-con-limon",                n:"Crudités con Limón",             cat:"Addon", p:50,  fmt:"I", addon:true, tags:["sin_restriccion","vegano","keto","sin_gluten"] },
  { id:"yogurt-organico",                   n:"Yogurt Orgánico con granola",    cat:"Addon", p:50,  fmt:"I", addon:true, tags:["sin_restriccion","vegetariano"] },
  { id:"cookies",                           n:"Cookies artesanales",            cat:"Addon", p:50,  fmt:"I", addon:true, tags:["sin_restriccion","vegetariano"] },
  { id:"panque-de-naranja",                 n:"Panqué de Naranja",              cat:"Addon", p:50,  fmt:"I", addon:true, tags:["sin_restriccion","vegetariano"] },
  { id:"mix-de-semillas-naturales",         n:"Mix de Semillas Naturales",      cat:"Addon", p:60,  fmt:"I", addon:true, tags:["sin_restriccion","vegano","keto","sin_gluten"] },
];

// ================================================================
// SYSTEM PROMPT
// ================================================================
const SYSTEM_PROMPT = `Eres el cotizador de Berlioz Catering Corporativo, catering gourmet en CDMX.

Recibes el catálogo ya filtrado para el tipo de evento y los parámetros del cliente.
Devuelves 3 propuestas (esencial, equilibrado, experiencia) en JSON estricto.

═══════════════════════════════════════
REGLA 1 — PLATO PRINCIPAL OBLIGATORIO
═══════════════════════════════════════

Cada persona SIEMPRE recibe 1 producto de comida principal del catálogo.
Los productos marcados [ADDON] son ÚNICAMENTE complementos — NUNCA principales.
NUNCA uses agua, café, jugos, fruta, cookies o snacks como plato principal.

═══════════════════════════════════════
REGLA 2 — CANTIDADES (CRÍTICO)
═══════════════════════════════════════

fmt="I" (individual) → quantity = personas que lo reciben
fmt="G(cubre Xp)" (grupal) → quantity = ceil(personas_totales / X)

Ejemplos:
  10 personas, Box Oriental (I) → quantity: 10
  10 personas, Surtido Colette G(cubre 9p) → quantity: 2  (ceil(10/9)=2)
  10 personas, Café/Té Berlioz G(cubre 12p) → quantity: 1 (ceil(10/12)=1)

NUNCA multipliques el precio de un grupal por el número de personas.

═══════════════════════════════════════
REGLA 3 — RESTRICCIONES
═══════════════════════════════════════

Asigna según dietary_tags. Si hay 10 personas (2 keto, 1 vegetariano):
  7 sin_restriccion → box normal, quantity: 7
  2 keto            → box con tag "keto", quantity: 2
  1 vegetariano     → box con tag "vegetariano", quantity: 1

═══════════════════════════════════════
REGLA 4 — TIERS Y PRECIOS (RANGOS ESTRICTOS)
═══════════════════════════════════════

ESENCIAL:    principal económico + bebida simple. Sin addons.
EQUILIBRADO: principal medio + bebida + 1 addon. isRecommended: true.
EXPERIENCIA: principal premium + bebida premium + 1-2 addons.

RANGOS OBLIGATORIOS — calcula el costo total por persona de cada tier:
  esencial    → entre 80% y 90% del budget_per_person
  equilibrado → entre 95% y 108% del budget_per_person
  experiencia → entre 112% y 125% del budget_per_person

Si no hay budget_per_person, usa $300 como referencia.

Ejemplo con $420/persona y 15 personas:
  esencial    → $336-378/persona (total $5,040-$5,670)
  equilibrado → $399-454/persona (total $5,985-$6,810)
  experiencia → $470-525/persona (total $7,050-$7,875)

VERIFICACIÓN OBLIGATORIA antes de responder:
  1. Calcula subtotal de cada tier = suma(quantity × unitPrice)
  2. Divide entre personas para obtener precio/persona de COMIDA
  3. Suma envío ($360) + IVA 16% para estimar total/persona
  4. Verifica que caiga en el rango correcto
  5. Si no cae, agrega o quita add-ons hasta que sí

Para COFFEE BREAK con grupos grandes: combina el paquete completo
(Coffee Break AM/PM) con surtidos y add-ons para acercarte al target.
El paquete AM/PM de 8 personas ya incluye bebida, usarlo como base
y complementar con surtidos para llenar el presupuesto.

═══════════════════════════════════════
REGLA 5 — RESTRICCIONES VEGANAS EN COFFEE BREAK
═══════════════════════════════════════

Para veganos en coffee break, los surtidos de pan dulce o bocadillos
no aplican. En su lugar asigna: Crudités con Limón + Mix de Semillas.
Ajusta la cantidad de surtidos del grupo según las personas restantes.

═══════════════════════════════════════
FORMATO — SOLO JSON VÁLIDO
═══════════════════════════════════════

Sin markdown, sin texto fuera del JSON.

{
  "esencial": {
    "title": "Esencial",
    "tagline": "frase corta máximo 55 caracteres",
    "items": [
      {
        "productId": "id-del-catalogo",
        "productName": "Nombre exacto",
        "quantity": 10,
        "unitPrice": 290,
        "score": 72,
        "recommendationReason": "razón breve",
        "swapGroup": "Desayuno",
        "categoria": "Desayuno"
      }
    ],
    "recommendationReason": "descripción en 1 línea",
    "rankingScore": 70,
    "isRecommended": false,
    "highlights": ["punto 1", "punto 2", "punto 3"],
    "narrativa": "descripción corta"
  },
  "equilibrado": { "title":"Equilibrado", "isRecommended":true, "rankingScore":90, ... },
  "experiencia":  { "title":"Experiencia Completa", "isRecommended":false, "rankingScore":80, ... }
}`;

// ================================================================
// BUILD USER MESSAGE
// ================================================================
function getProductsForEvent(eventType: string) {
  const t = eventType.toLowerCase();
  if (t === "desayuno") return CATALOG.filter(p => ["Desayuno","Bebida","Addon"].includes(p.cat));
  if (t.includes("coffee")) return CATALOG.filter(p => ["CoffeeBreak","Bebida","Addon"].includes(p.cat));
  return CATALOG.filter(p => ["Comida","Bebida","Addon"].includes(p.cat));
}

function buildUserMessage(req: {
  eventType: string; peopleCount: number;
  budgetPerPerson?: number; budgetEnabled?: boolean;
  dietaryCounts?: {tipo:string; cantidad:number}[];
  durationHours?: number; contactName?: string; companyName?: string;
}): string {
  const { eventType, peopleCount, budgetEnabled, budgetPerPerson, dietaryCounts = [], durationHours = 2 } = req;
  const sinRestriccion = peopleCount - dietaryCounts.reduce((s,d) => s+d.cantidad, 0);

  const prods = getProductsForEvent(eventType);
  const catalogStr = prods.map(p => {
    const fmt = p.fmt === "G" ? `G(cubre ${(p as any).qg}p)` : "I";
    const addonFlag = (p as any).addon ? " [ADDON]" : "";
    return `  {id:"${p.id}", n:"${p.n}", precio:${p.p}, fmt:"${fmt}", tags:["${p.tags.join('","')}"]${addonFlag}}`;
  }).join("\n");

  let budget = "Sin presupuesto — usa $300/persona como base para equilibrado.";
  if (budgetEnabled && budgetPerPerson) {
    const target = Math.round((budgetPerPerson * peopleCount - ENVIO) / (1 + IVA));
    budget = `$${budgetPerPerson}/persona → subtotal_target equilibrado ≈ $${target.toLocaleString("es-MX")}`;
  }

  const dieta = dietaryCounts.length > 0
    ? dietaryCounts.map(d => `  • ${d.cantidad} ${d.tipo}`).join("\n") + `\n  • ${sinRestriccion} sin restricción`
    : `  • ${peopleCount} sin restricción`;

  return `EVENTO: ${eventType} | ${peopleCount} personas | ${durationHours}h
DISTRIBUCIÓN:
${dieta}
PRESUPUESTO: ${budget}

CATÁLOGO (${prods.length} productos):
  I=individual(qty=personas), G(cubre Xp)=grupal(qty=ceil(personas/X)), [ADDON]=nunca principal
${catalogStr}

Genera esencial < equilibrado < experiencia en precio.`;
}

// ================================================================
// TOTALES
// ================================================================
function calcTotals(items: {quantity:number; unitPrice:number}[]) {
  const subtotal = items.reduce((s,i) => s + i.unitPrice * i.quantity, 0);
  const base = subtotal + ENVIO;
  const iva = Math.round(base * IVA * 100) / 100;
  return { subtotal, shipping: ENVIO, iva, total: Math.round((base + iva) * 100) / 100 };
}

// ================================================================
// HANDLER PRINCIPAL
// ================================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const request = await req.json();
    const { peopleCount = 1 } = request;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role:"user", content: buildUserMessage(request) }],
    });

    const raw = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    let tiers: Record<string, any>;

    try {
      const clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      tiers = JSON.parse(clean);
    } catch {
      throw new Error("JSON inválido del modelo. Reintenta.");
    }

    const packages = (["esencial","equilibrado","experiencia"] as const).map(key => {
      const tier = tiers[key];
      if (!tier) throw new Error(`Falta tier '${key}'`);

      const items = (tier.items || []).map((it: any) => ({
        productId: it.productId || "",
        parentProductId: null,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        computedPrice: it.unitPrice * it.quantity,
        score: it.score ?? 75,
        recommendationReason: it.recommendationReason ?? "",
        imageUrl: null,
        imageSource: "generated_prompt" as const,
        imagePrompt: null,
        sourceType: "supabase" as const,
        swapGroup: it.swapGroup ?? it.categoria ?? "Comida",
        categoria: it.categoria ?? it.swapGroup ?? "Comida",
      }));

      const { subtotal, shipping, iva, total } = calcTotals(items);

      return {
        tier: key,
        title: tier.title ?? key,
        tagline: tier.tagline ?? "",
        items,
        subtotal, shipping, iva, total,
        pricePerPerson: Math.round((total / Math.max(1, peopleCount)) * 100) / 100,
        recommendationReason: tier.recommendationReason ?? "",
        rankingScore: tier.rankingScore ?? 70,
        isRecommended: tier.isRecommended ?? (key === "equilibrado"),
        highlights: tier.highlights ?? [],
        narrativa: tier.narrativa,
        fallbackUsed: false,
      };
    });

    // Guardar en Supabase (silencioso si falla)
    const proposalId = crypto.randomUUID();
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await sb.from("cotizaciones").insert({
        id: proposalId, personas: peopleCount, tipo_servicio: request.eventType,
        presupuesto_por_persona: request.budgetPerPerson ?? 0,
        presupuesto_total: peopleCount * (request.budgetPerPerson ?? 0),
        restricciones: request.dietaryCounts ?? [],
        nombre_cliente: request.contactName, empresa_cliente: request.companyName,
        opcion_basica: packages[0], opcion_equilibrada: packages[1], opcion_completa: packages[2],
        tokens_input: aiResponse.usage.input_tokens, tokens_output: aiResponse.usage.output_tokens,
        modelo_usado: aiResponse.model,
      });
    } catch { /* silent */ }

    return new Response(
      JSON.stringify({
        requestId: proposalId, proposalId,
        engineVersion: "v2-clean", fallbackUsed: false,
        packages,
        recommendationSummary: `Propuesta IA para ${request.eventType}, ${peopleCount} personas.`,
        debug: { tokens: aiResponse.usage.input_tokens + aiResponse.usage.output_tokens },
      }),
      { status:200, headers: { ...CORS, "Content-Type":"application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    console.error("quote-orchestrator:", msg);
    return new Response(JSON.stringify({ error: msg }), { status:500, headers: CORS });
  }
});
