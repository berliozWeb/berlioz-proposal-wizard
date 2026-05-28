// ================================================================
// BERLIOZ — supabase/functions/quote-orchestrator/index.ts
// v3 — Selección de productos en TypeScript (math exacto)
//       Claude solo escribe textos descriptivos
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
// CATÁLOGO
// fmt: I=individual(qty=personas), G=grupal(qty=ceil(personas/qg))
// ================================================================
const CAT = [
  // DESAYUNOS
  { id:"breakfast-bag-pavo",               n:"Breakfast Bag — Pavo",                     ev:"desayuno", p:250, fmt:"I", tags:["sin_restriccion"] },
  { id:"breakfast-in-roma-pan-dulce",      n:"Breakfast in Roma — Pan dulce",            ev:"desayuno", p:290, fmt:"I", tags:["sin_restriccion"] },
  { id:"box-chilaquiles-verdes-con-huevo", n:"Box Chilaquiles — Verdes con huevo",       ev:"desayuno", p:310, fmt:"I", tags:["sin_restriccion","vegetariano","vegano"] },
  { id:"breakfast-in-london-pavo-yogurt",  n:"Breakfast in London — Pavo y yogurt",      ev:"desayuno", p:320, fmt:"I", tags:["sin_restriccion"] },
  { id:"breakfast-blt-pavo-yogurt",        n:"Breakfast BLT — Pavo y yogurt",            ev:"desayuno", p:330, fmt:"I", tags:["sin_restriccion"] },
  { id:"breakfast-in-montreal-yogurt",     n:"Breakfast in Montreal — Con yogurt",       ev:"desayuno", p:410, fmt:"I", tags:["sin_restriccion"] },
  // Variantes dietéticas desayuno
  { id:"box-chilaquiles-vegano",           n:"Box Chilaquiles — Rojos con huevo",        ev:"desayuno", p:310, fmt:"I", tags:["vegetariano","vegano"] },

  // COMIDAS
  { id:"lunch-bag-pasta-pollo",            n:"Lunch Bag — Pasta con pollo",              ev:"comida", p:250, fmt:"I", tags:["sin_restriccion"] },
  { id:"salad-box-pollo-agua",             n:"Salad Box — Pollo con agua",               ev:"comida", p:280, fmt:"I", tags:["sin_restriccion"] },
  { id:"piropo-tinga-jicama",              n:"Piropo – Tinga de Pollo",                  ev:"comida", p:280, fmt:"I", tags:["sin_restriccion"] },
  { id:"white-box-ensalada",               n:"White Box — Con ensalada de frutas",       ev:"comida", p:300, fmt:"I", tags:["sin_restriccion"] },
  { id:"box-oriental-pollo",               n:"Box Oriental — Pollo teriyaki",            ev:"comida", p:300, fmt:"I", tags:["sin_restriccion","sin_lactosa"] },
  { id:"golden-box-ensalada",              n:"Golden Box — Con ensalada de frutas",      ev:"comida", p:330, fmt:"I", tags:["sin_restriccion"] },
  { id:"blt-box-chips",                    n:"BLT Box — Con chips",                      ev:"comida", p:330, fmt:"I", tags:["sin_restriccion"] },
  { id:"green-box-pepino-feta",            n:"Green Box — Con ensalada de pepino",       ev:"comida", p:340, fmt:"I", tags:["sin_restriccion"] },
  { id:"aqua-box-calabaza",                n:"Aqua Box — Con ensalada de calabaza",      ev:"comida", p:350, fmt:"I", tags:["sin_restriccion"] },
  { id:"box-keto-sin-gluten",              n:"Box Keto – Sin Gluten",                    ev:"comida", p:370, fmt:"I", tags:["sin_restriccion","keto","sin_gluten"] },
  { id:"pink-box-clasica-jicama",          n:"Pink Box — Clásica con ensalada de jícama",ev:"comida", p:380, fmt:"I", tags:["sin_restriccion"] },
  { id:"orzo-pasta-pollo",                 n:"Orzo Pasta Salad Box — Con pollo",         ev:"comida", p:390, fmt:"I", tags:["sin_restriccion"] },
  { id:"salmon-box",                       n:"Salmon Box",                               ev:"comida", p:410, fmt:"I", tags:["sin_restriccion","keto","sin_gluten","sin_lactosa"] },
  // Variantes dietéticas comida
  { id:"salad-box-vegetariana",            n:"Salad Box — Vegetariana con agua",         ev:"comida", p:280, fmt:"I", tags:["vegetariano"] },
  { id:"salad-box-vegana",                 n:"Salad Box — Vegana con agua",              ev:"comida", p:300, fmt:"I", tags:["vegano","vegetariano"] },
  { id:"box-oriental-tofu",                n:"Box Oriental — Tofu agridulce",            ev:"comida", p:300, fmt:"I", tags:["vegetariano","vegano","sin_lactosa"] },
  { id:"pink-box-vegetariana",             n:"Pink Box — Vegetariana",                   ev:"comida", p:380, fmt:"I", tags:["vegetariano"] },
  { id:"pink-box-vegana",                  n:"Pink Box — Vegana con agua",               ev:"comida", p:380, fmt:"I", tags:["vegano","vegetariano"] },
  { id:"orzo-vegetariana",                 n:"Orzo Pasta Salad Box — Vegetariana",       ev:"comida", p:390, fmt:"I", tags:["vegetariano","vegano"] },

  // COFFEE BREAK — SURTIDOS GRUPALES
  { id:"mini-surtido-balzac",              n:"Mini Surtido Balzac (10 pastelitos)",      ev:"coffee", p:220, fmt:"G", qg:4, tags:["sin_restriccion"] },
  { id:"mini-surtido-colette",             n:"Mini Surtido Colette (10 panes franceses)",ev:"coffee", p:290, fmt:"G", qg:4, tags:["sin_restriccion"] },
  { id:"mini-surtido-camille",             n:"Mini Surtido Camille (6 bocadillos)",      ev:"coffee", p:350, fmt:"G", qg:4, tags:["sin_restriccion"] },
  { id:"surtido-balzac",                   n:"Surtido Balzac (25 pastelitos)",           ev:"coffee", p:400, fmt:"G", qg:8, tags:["sin_restriccion"] },
  { id:"surtido-zadig",                    n:"Surtido Zadig (21 postres surtidos)",      ev:"coffee", p:400, fmt:"G", qg:8, tags:["sin_restriccion"] },
  { id:"surtido-colette",                  n:"Surtido Colette (25 panes franceses)",     ev:"coffee", p:450, fmt:"G", qg:9, tags:["sin_restriccion"] },
  { id:"surtido-hugo",                     n:"Surtido Hugo (16 panes daneses)",          ev:"coffee", p:550, fmt:"G", qg:9, tags:["sin_restriccion"] },
  { id:"surtido-camille",                  n:"Surtido Camille (15 bocadillos salados)",  ev:"coffee", p:700, fmt:"G", qg:6, tags:["sin_restriccion"] },
  { id:"surtido-voltaire",                 n:"Surtido Voltaire (15 bocadillos variados)",ev:"coffee", p:750, fmt:"G", qg:6, tags:["sin_restriccion"] },
  { id:"coffee-break-am-jugo-8p",          n:"Coffee Break AM – Con Jugo (8 personas)", ev:"coffee", p:2700, fmt:"G", qg:8, tags:["sin_restriccion"] },
  { id:"coffee-break-am-cafe-8p",          n:"Coffee Break AM – Con Café Frío (8 personas)",ev:"coffee",p:2700,fmt:"G",qg:8,tags:["sin_restriccion"] },
  { id:"coffee-break-pm-8p",              n:"Coffee Break PM (8 personas)",              ev:"coffee", p:2340, fmt:"G", qg:8, tags:["sin_restriccion"] },

  // BEBIDAS
  { id:"aguas-frescas",                    n:"Agua Fresca — Jamaica",                    ev:"all", p:45,  fmt:"I", tags:["sin_restriccion","vegano","keto","sin_gluten"], bev:true },
  { id:"agua-bui-natural",                 n:"Agua Bui Natural",                         ev:"all", p:50,  fmt:"I", tags:["sin_restriccion","vegano","keto","sin_gluten"], bev:true },
  { id:"jugo-de-naranja",                  n:"Jugo de Naranja (Jus)",                    ev:"all", p:60,  fmt:"I", tags:["sin_restriccion","vegano","sin_gluten"], bev:true },
  { id:"cafe-frio",                        n:"Café Frío (latte de avena)",               ev:"all", p:60,  fmt:"I", tags:["sin_restriccion","vegano","keto","sin_gluten"], bev:true },
  { id:"cafe-te-berlioz",                  n:"Café / Té Berlioz — termo 12 tazas",       ev:"all", p:540, fmt:"G", qg:12, tags:["sin_restriccion"], bev:true },

  // ADD-ONS
  { id:"ensalada-de-fruta",                n:"Ensalada de Fruta",                        ev:"all", p:50, fmt:"I", addon:true, tags:["sin_restriccion","vegano","keto","sin_gluten"] },
  { id:"crudites-con-limon",               n:"Crudités con Limón",                       ev:"all", p:50, fmt:"I", addon:true, tags:["sin_restriccion","vegano","keto","sin_gluten"] },
  { id:"yogurt-organico",                  n:"Yogurt Orgánico con granola",              ev:"all", p:50, fmt:"I", addon:true, tags:["sin_restriccion","vegetariano"] },
  { id:"cookies",                          n:"Cookies artesanales",                      ev:"all", p:50, fmt:"I", addon:true, tags:["sin_restriccion","vegetariano"] },
  { id:"mix-de-semillas",                  n:"Mix de Semillas Naturales",                ev:"all", p:60, fmt:"I", addon:true, tags:["sin_restriccion","vegano","keto","sin_gluten"] },
];

type P = typeof CAT[number] & { qg?: number; bev?: boolean; addon?: boolean };

// ================================================================
// ALGORITMO DE SELECCIÓN — TypeScript puro, sin IA
// ================================================================

interface DietaryCount { tipo: string; cantidad: number; }
interface SelectedItem {
  productId: string; productName: string; quantity: number; unitPrice: number;
  computedPrice: number; score: number; recommendationReason: string;
  swapGroup: string; categoria: string;
  imageUrl: null; imageSource: "generated_prompt"; imagePrompt: null; sourceType: "supabase";
  parentProductId: null;
}

function qty(p: P, people: number): number {
  if (p.fmt === "G") return Math.ceil(people / (p.qg ?? 1));
  return people;
}

function makeItem(p: P, q: number, reason = ""): SelectedItem {
  return {
    productId: p.id, productName: p.n, quantity: q, unitPrice: p.p,
    computedPrice: p.p * q, score: 80, recommendationReason: reason,
    swapGroup: p.ev === "coffee" ? "Coffee Break" : p.ev === "desayuno" ? "Desayuno" : "Comida",
    categoria: p.ev === "coffee" ? "Coffee Break" : p.ev === "desayuno" ? "Desayuno" : "Comida",
    imageUrl: null, imageSource: "generated_prompt", imagePrompt: null,
    sourceType: "supabase", parentProductId: null,
  };
}

function subtotalOf(items: SelectedItem[]): number {
  return items.reduce((s, i) => s + i.computedPrice, 0);
}

// Encuentra el producto más cercano a un precio objetivo con los tags requeridos
function findBox(ev: string, targetPrice: number, tag: string): P | null {
  const pool = CAT.filter(p =>
    (p.ev === ev || p.ev === "all") && !p.addon && !p.bev &&
    p.fmt === "I" && p.tags.includes(tag)
  );
  if (!pool.length) return null;
  return pool.reduce((best, p) =>
    Math.abs(p.p - targetPrice) < Math.abs(best.p - targetPrice) ? p : best
  );
}

// Surtido grupal más adecuado para X personas a precio unitario objetivo
function findSurtido(targetUnitPrice: number): P {
  const surtidos = CAT.filter(p => p.ev === "coffee" && p.fmt === "G" && !p.bev);
  return surtidos.reduce((best, p) =>
    Math.abs(p.p - targetUnitPrice) < Math.abs(best.p - targetUnitPrice) ? p : best
  );
}

// Selección de items para desayuno/comida
function selectBoxEvent(
  ev: "desayuno" | "comida",
  people: number,
  dietaryCounts: DietaryCount[],
  subtotalTarget: number
): SelectedItem[] {
  const items: SelectedItem[] = [];
  const sinR = people - dietaryCounts.reduce((s, d) => s + d.cantidad, 0);
  const targetPP = subtotalTarget / people;

  // Plato principal para personas sin restricción
  if (sinR > 0) {
    const box = findBox(ev, targetPP, "sin_restriccion");
    if (box) items.push(makeItem(box, sinR, `Selección ${ev} para ${sinR} personas`));
  }

  // Platos para cada restricción
  for (const dc of dietaryCounts) {
    if (dc.cantidad === 0) continue;
    const box = findBox(ev, targetPP, dc.tipo);
    if (box) items.push(makeItem(box, dc.cantidad, `Opción ${dc.tipo} para ${dc.cantidad} personas`));
  }

  // Bebida
  const sub = subtotalOf(items);
  const remainingPerPerson = (subtotalTarget - sub) / people;
  if (remainingPerPerson >= 40) {
    const bev = remainingPerPerson >= 300
      ? CAT.find(p => p.id === "cafe-te-berlioz")!
      : CAT.find(p => p.id === "aguas-frescas")!;
    const bqty = bev.fmt === "G" ? Math.ceil(people / (bev.qg ?? 12)) : people;
    items.push(makeItem(bev, bqty, "Bebida del evento"));
  }

  // Add-on si queda presupuesto
  const sub2 = subtotalOf(items);
  const leftover = subtotalTarget - sub2;
  if (leftover >= 50 * people * 0.8) {
    const addon = CAT.find(p => p.addon && p.p <= leftover / people + 20);
    if (addon) items.push(makeItem(addon, people, "Complemento del evento"));
  }

  return items;
}

// Selección para coffee break
function selectCoffeeBreak(
  people: number,
  dietaryCounts: DietaryCount[],
  subtotalTarget: number
): SelectedItem[] {
  const items: SelectedItem[] = [];
  const sinR = people - dietaryCounts.reduce((s, d) => s + d.cantidad, 0);
  const veganos = dietaryCounts.filter(d => d.tipo === "vegano" || d.tipo === "sin_gluten").reduce((s,d)=>s+d.cantidad,0);

  // Estrategia según subtotalTarget
  const maxSurtidoCost = subtotalTarget * 0.85; // deja espacio para café y addons
  const targetPP = subtotalTarget / people;

  if (targetPP >= 250 && sinR > 0) {
    // Usar paquete completo Coffee Break AM/PM para sin restricción
    const cbPaq = targetPP >= 300
      ? CAT.find(p => p.id === "coffee-break-am-cafe-8p")!
      : CAT.find(p => p.id === "coffee-break-pm-8p")!;
    const cbQty = Math.ceil(sinR / (cbPaq.qg ?? 8));
    items.push(makeItem(cbPaq, cbQty, `Paquete completo para ${sinR} personas`));
  } else if (sinR > 0) {
    // Surtidos según nivel de presupuesto
    const targetSurtidoPP = Math.min(targetPP * 0.7, 100);
    const surtido = findSurtido(targetSurtidoPP * (cbPeople(sinR)));
    const sQty = Math.ceil(sinR / (surtido.qg ?? 8));
    items.push(makeItem(surtido, sQty, `Surtido para ${sinR} personas`));

    // Café
    const cafe = CAT.find(p => p.id === "cafe-te-berlioz")!;
    const cQty = Math.ceil(people / (cafe.qg ?? 12));
    items.push(makeItem(cafe, cQty, "Bebida caliente del evento"));
  }

  // Para veganos/sin_gluten: crudités + semillas (no pan dulce)
  if (veganos > 0) {
    const crudites = CAT.find(p => p.id === "crudites-con-limon")!;
    items.push(makeItem(crudites, veganos, `Opción para ${veganos} personas con restricción`));
    const semillas = CAT.find(p => p.id === "mix-de-semillas")!;
    items.push(makeItem(semillas, veganos, "Snack apto para restricciones"));
  }

  // Add-on si queda presupuesto
  const sub = subtotalOf(items);
  const leftover = subtotalTarget - sub;
  if (leftover >= 50 * sinR * 0.8 && sinR > 0) {
    const addon = CAT.find(p => p.addon && !p.tags.some(t => ["sin_gluten","keto"].includes(t)));
    if (addon) items.push(makeItem(addon, sinR, "Complemento para el grupo"));
  }

  return items;
}

function cbPeople(n: number): number { return n; } // helper trivial

// ================================================================
// CONSTRUIR LOS 3 TIERS
// ================================================================
function buildTiers(
  eventType: string,
  people: number,
  dietaryCounts: DietaryCount[],
  budgetPerPerson: number | undefined,
  budgetEnabled: boolean
): { esencial: SelectedItem[]; equilibrado: SelectedItem[]; experiencia: SelectedItem[] } {
  const base = (budgetEnabled && budgetPerPerson) ? budgetPerPerson : 300;
  const totalBudget = base * people;
  const subtotalMax = (totalBudget - ENVIO) / (1 + IVA);

  // Rango de cada tier sobre el subtotal_max
  const targets = {
    esencial:    subtotalMax * 0.78,
    equilibrado: subtotalMax * 1.00,
    experiencia: subtotalMax * 1.18,
  };

  const ev = eventType.toLowerCase().includes("coffee") ? "coffee"
    : eventType.toLowerCase().includes("desayuno") ? "desayuno"
    : "comida";

  const select = ev === "coffee"
    ? (t: number) => selectCoffeeBreak(people, dietaryCounts, t)
    : (t: number) => selectBoxEvent(ev as "desayuno"|"comida", people, dietaryCounts, t);

  return {
    esencial: select(targets.esencial),
    equilibrado: select(targets.equilibrado),
    experiencia: select(targets.experiencia),
  };
}

// ================================================================
// SYSTEM PROMPT — Claude SOLO escribe textos
// ================================================================
const SYSTEM_PROMPT = `Eres el copywriter de Berlioz Catering. Recibes 3 propuestas ya armadas con sus productos y precios.
Tu única tarea: escribir los textos descriptivos de cada propuesta.

Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto fuera del JSON.

Para cada tier (esencial, equilibrado, experiencia) escribe:
- tagline: frase corta atractiva (max 55 chars)
- recommendationReason: 1 línea vendedora
- highlights: array de 3 bullets concisos
- narrativa: 1 oración que pinte el ambiente del evento

El JSON de respuesta tiene exactamente esta forma:
{
  "esencial": { "tagline":"...", "recommendationReason":"...", "highlights":["...","...","..."], "narrativa":"..." },
  "equilibrado": { "tagline":"...", "recommendationReason":"...", "highlights":["...","...","..."], "narrativa":"..." },
  "experiencia": { "tagline":"...", "recommendationReason":"...", "highlights":["...","...","..."], "narrativa":"..." }
}`;

// ================================================================
// HANDLER
// ================================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const request = await req.json();
    const {
      eventType = "comida", peopleCount = 1,
      budgetPerPerson, budgetEnabled = false,
      dietaryCounts = [], contactName, companyName,
    } = request;

    // 1. Seleccionar productos (TypeScript, sin IA)
    const tierItems = buildTiers(eventType, peopleCount, dietaryCounts, budgetPerPerson, budgetEnabled);

    // 2. Pedir textos a Claude
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const userMsg = `Evento: ${eventType} | ${peopleCount} personas | ${budgetEnabled ? `$${budgetPerPerson}/persona` : "sin presupuesto"}

ESENCIAL (${Math.round(subtotalOf(tierItems.esencial)/(peopleCount))}$/persona en comida):
${tierItems.esencial.map(i => `  - ${i.productName} ×${i.quantity}`).join("\n")}

EQUILIBRADO (${Math.round(subtotalOf(tierItems.equilibrado)/(peopleCount))}$/persona):
${tierItems.equilibrado.map(i => `  - ${i.productName} ×${i.quantity}`).join("\n")}

EXPERIENCIA (${Math.round(subtotalOf(tierItems.experiencia)/(peopleCount))}$/persona):
${tierItems.experiencia.map(i => `  - ${i.productName} ×${i.quantity}`).join("\n")}

Escribe los textos de cada tier.`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "{}";
    let texts: Record<string, { tagline: string; recommendationReason: string; highlights: string[]; narrativa: string }>;
    try {
      const clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      texts = JSON.parse(clean);
    } catch {
      texts = {
        esencial:    { tagline:"Lo esencial, bien ejecutado",       recommendationReason:"Propuesta funcional al mejor precio.",        highlights:["Entrega puntual","Calidad Berlioz","Precio optimizado"],   narrativa:"Perfecto para reuniones de trabajo." },
        equilibrado: { tagline:"La experiencia que tu equipo merece",recommendationReason:"8 de cada 10 clientes eligen este paquete.", highlights:["Variedad premium","Presentación profesional","Completo"],  narrativa:"El balance perfecto entre precio y experiencia." },
        experiencia: { tagline:"Cada detalle cuenta",                recommendationReason:"Experiencia gastronómica completa.",          highlights:["Productos top del catálogo","Todo incluido","Memorable"], narrativa:"Para eventos que deben dejar huella." },
      };
    }

    // 3. Armar packages
    function calcTotals(items: SelectedItem[]) {
      const subtotal = subtotalOf(items);
      const base = subtotal + ENVIO;
      const iva = Math.round(base * IVA * 100) / 100;
      return { subtotal, shipping: ENVIO, iva, total: Math.round((base + iva) * 100) / 100 };
    }

    const tierDefs = [
      { key: "esencial",    title: "Esencial",            isRec: false, rank: 70, items: tierItems.esencial },
      { key: "equilibrado", title: "Equilibrado",          isRec: true,  rank: 90, items: tierItems.equilibrado },
      { key: "experiencia", title: "Experiencia Completa", isRec: false, rank: 80, items: tierItems.experiencia },
    ] as const;

    const packages = tierDefs.map(td => {
      const t = texts[td.key] || texts.esencial;
      const { subtotal, shipping, iva, total } = calcTotals(td.items);
      return {
        tier: td.key, title: td.title,
        tagline: t.tagline, narrativa: t.narrativa,
        items: td.items, subtotal, shipping, iva, total,
        pricePerPerson: Math.round((total / Math.max(1, peopleCount)) * 100) / 100,
        recommendationReason: t.recommendationReason,
        rankingScore: td.rank, isRecommended: td.isRec,
        highlights: t.highlights, fallbackUsed: false,
      };
    });

    // 4. Guardar en Supabase (silencioso)
    const proposalId = crypto.randomUUID();
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await sb.from("cotizaciones").insert({
        id: proposalId, personas: peopleCount, tipo_servicio: eventType,
        presupuesto_por_persona: budgetPerPerson ?? 0,
        presupuesto_total: peopleCount * (budgetPerPerson ?? 0),
        restricciones: dietaryCounts,
        nombre_cliente: contactName, empresa_cliente: companyName,
        opcion_basica: packages[0], opcion_equilibrada: packages[1], opcion_completa: packages[2],
        tokens_input: aiResponse.usage.input_tokens, tokens_output: aiResponse.usage.output_tokens,
        modelo_usado: aiResponse.model,
      });
    } catch { /* silent */ }

    return new Response(
      JSON.stringify({
        requestId: proposalId, proposalId, engineVersion: "v3-ts-selection",
        fallbackUsed: false, packages,
        recommendationSummary: `Propuesta para ${eventType}, ${peopleCount} personas.`,
      }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    console.error("quote-orchestrator:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: CORS });
  }
});

function subtotalOf(items: SelectedItem[]): number {
  return items.reduce((s, i) => s + i.computedPrice, 0);
}
