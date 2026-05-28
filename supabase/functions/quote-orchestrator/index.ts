// ================================================================
// BERLIOZ — supabase/functions/quote-orchestrator/index.ts
// v5 — imágenes en catálogo + etiquetas dietéticas en items
// ================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ENVIO_CALC = 360;
const IVA = 0.16;

// ================================================================
// CATÁLOGO CON IMÁGENES
// ================================================================
const IMG = {
  breakfast_bag:    "https://berlioz.mx/wp-content/uploads/2023/03/breakfast-bag.webp",
  breakfast_roma:   "https://berlioz.mx/wp-content/uploads/2023/03/berlioz_fabian-31.jpg",
  chilaquiles:      "https://berlioz.mx/wp-content/uploads/2023/04/Box-Chilaquiles-verdes-Berlioz-.jpg",
  breakfast_london: "https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-18-scaled-e1596123929266.jpg",
  breakfast_blt:    "https://berlioz.mx/wp-content/uploads/2025/06/95A0102-1-scaled.jpg",
  breakfast_montreal:"https://berlioz.mx/wp-content/uploads/2023/03/Breakfast-in-Montreal-Berlioz1.jpg",
  salmon_box:       "https://berlioz.mx/wp-content/uploads/2024/02/5.jpg",
  golden_box:       "https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-40-scaled-e1596130008398.jpg",
  green_box:        "https://berlioz.mx/wp-content/uploads/2025/08/green-box3.jpg",
  box_vegetariana:  "https://berlioz.mx/wp-content/uploads/2024/10/web-_Mesa-de-trabajo-1.jpg",
  pink_box:         "https://berlioz.mx/wp-content/uploads/2023/03/cateringCorporativo12.jpg",
  box_keto:         "https://berlioz.mx/wp-content/uploads/2023/10/web-06.jpg",
  orzo_pasta:       "https://berlioz.mx/wp-content/uploads/2024/07/Orzo-Pollo.jpg",
  box_oriental:     "https://berlioz.mx/wp-content/uploads/2025/02/IMG_8233-copia-1.jpg",
  salad_box:        "https://berlioz.mx/wp-content/uploads/2019/04/Salad-box-pollo.jpg",
  lunch_bag:        "https://berlioz.mx/wp-content/uploads/2024/02/lunch-pasta.jpg",
  aqua_box:         "https://berlioz.mx/wp-content/uploads/2025/08/aqua-box2.jpg",
  blt_box:          "https://berlioz.mx/wp-content/uploads/2023/03/95A0182-1-scaled.jpg",
  white_box:        "https://berlioz.mx/wp-content/uploads/2023/03/white-box.jpg",
  black_box:        "https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-21-scaled.jpg",
  cafe_te:          "https://berlioz.mx/wp-content/uploads/2015/01/17.jpg",
  agua_fresca:      "https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp",
  crudites:         "https://berlioz.mx/wp-content/uploads/2024/04/crudite.jpg",
  mix_semillas:     "https://berlioz.mx/wp-content/uploads/2020/03/berlioz_fabian-03-scaled.jpg",
  surtido_colette:  "https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-46-1-scaled.jpg",
  surtido_balzac:   "https://berlioz.mx/wp-content/uploads/2024/02/pastelitos.jpg",
  surtido_camille:  "https://berlioz.mx/wp-content/uploads/2023/03/Surtido-Camille-Berlioz-bocadillos.jpg",
  surtido_voltaire: "https://berlioz.mx/wp-content/uploads/2023/03/Surtido-Camille-Berlioz-bocadillos.jpg",
  coffee_break_am:  "https://berlioz.mx/wp-content/uploads/2025/08/coffeebreak_AM_cafe.jpg",
  coffee_break_pm:  "https://berlioz.mx/wp-content/uploads/2025/08/coffeebreak_PM.jpg",
};

// ── Tablas de productos por tipo de evento y tier ─────────────
// ================================================================
// JERARQUÍA DIETÉTICA:
//   vegano ⊂ vegetariano  →  producto vegano sirve para vegetariano
//   keto implica sin_gluten en Berlioz (todos los boxes keto son SG)
//
// Regla aplicada en getBoxItems():
//   si restricción = "vegetariano" → usar caja VEGANA (cumple ambas)
//   si restricción = "keto"        → usar caja KETO (también sin_gluten)
// ================================================================

const DESAYUNO: Record<string, { id:string; n:string; p:number; img:string; cat:string; desc:string }> = {
  esencial:     { id:"breakfast-bag-pavo",              n:"Breakfast Bag — Pavo",                       p:250, img:IMG.breakfast_bag,     cat:"Desayuno", desc:"Ciabatta con pavo, fruta fresca y bebida. Ágil y delicioso." },
  equilibrado:  { id:"breakfast-in-roma-pan-dulce",     n:"Breakfast in Roma — Pan dulce",              p:290, img:IMG.breakfast_roma,     cat:"Desayuno", desc:"Croissant relleno de frittata con pavo, fruta fresca y pan o yogurt." },
  experiencia:  { id:"breakfast-in-montreal-yogurt",    n:"Breakfast in Montreal — Con yogurt orgánico",p:410, img:IMG.breakfast_montreal, cat:"Desayuno", desc:"Salmón ahumado a las hierbas finas con fruta fresca y yogurt orgánico." },
  keto:         { id:"healthy-breakfast",               n:"Healthy Breakfast",                          p:370, img:"https://berlioz.mx/wp-content/uploads/2023/04/Healthy-breakfast-2.jpeg", cat:"Desayuno", desc:"Chía pudding con granola keto, mantequilla de almendras, coco y fruta. Vegano y sin gluten." },
  sin_gluten:   { id:"healthy-breakfast",               n:"Healthy Breakfast",                          p:370, img:"https://berlioz.mx/wp-content/uploads/2023/04/Healthy-breakfast-2.jpeg", cat:"Desayuno", desc:"Chía pudding con granola keto, mantequilla de almendras, coco y fruta. Sin gluten." },
  vegano:       { id:"box-chilaquiles-verdes-con-huevo",n:"Box Chilaquiles — Verdes con huevo",         p:310, img:IMG.chilaquiles,        cat:"Desayuno", desc:"Totopos azules con huevo, crema, queso, cilantro y jugo. Vegano." },
  vegetariano:  { id:"box-chilaquiles-verdes-con-huevo",n:"Box Chilaquiles — Verdes con huevo",         p:310, img:IMG.chilaquiles,        cat:"Desayuno", desc:"Totopos azules con huevo, crema, queso, cilantro y jugo del día." },
  sin_lactosa:  { id:"breakfast-blt-pavo-yogurt",       n:"Breakfast BLT — Pavo y yogurt",             p:330, img:IMG.breakfast_blt,      cat:"Desayuno", desc:"Sándwich BLT con tocino o pavo, tomate, lechuga y mayo de chipotle." },
};

const COMIDA: Record<string, { id:string; n:string; p:number; img:string; cat:string; desc:string }> = {
  esencial:     { id:"lunch-bag-pasta-pollo",           n:"Lunch Bag — Pasta con pollo",                p:250, img:IMG.lunch_bag,          cat:"Comida", desc:"Pasta al pesto con jitomates horneados, mozzarella y panqué del día." },
  equilibrado:  { id:"golden-box-ensalada",             n:"Golden Box — Con ensalada de frutas",        p:330, img:IMG.golden_box,          cat:"Comida", desc:"Ciabatta de pollo marinado con queso fundido y ensalada de pepino con cabra." },
  experiencia:  { id:"orzo-pasta-pollo",                n:"Orzo Pasta Salad Box — Con pollo",           p:390, img:IMG.orzo_pasta,          cat:"Comida", desc:"Pasta orzo con trufa blanca, espárragos, parmesano y ensalada de sandía." },
  keto:         { id:"box-keto-sin-gluten",             n:"Box Keto – Sin Gluten",                      p:370, img:IMG.box_keto,            cat:"Comida", desc:"Proteína con vegetales asados y ensalada verde con aguacate. Sin granos." },
  sin_gluten:   { id:"box-keto-sin-gluten",             n:"Box Keto – Sin Gluten",                      p:370, img:IMG.box_keto,            cat:"Comida", desc:"Proteína con vegetales asados y ensalada verde con aguacate. Sin granos." },
  vegano:       { id:"salad-box-vegana",                n:"Salad Box — Vegana con agua",                p:300, img:IMG.salad_box,           cat:"Comida", desc:"Tofu marinado sobre quinoa con aguacate y verduras. 100% vegana." },
  vegetariano:  { id:"salad-box-vegana",                n:"Salad Box — Vegana con agua",                p:300, img:IMG.salad_box,           cat:"Comida", desc:"Tofu marinado sobre quinoa con aguacate y verduras. Vegetariana y vegana." },
  sin_lactosa:  { id:"box-oriental-pollo",              n:"Box Oriental — Pollo teriyaki",              p:300, img:IMG.box_oriental,        cat:"Comida", desc:"Pollo en salsa de soya, arroz al vapor y verduras salteadas. Sin lácteos." },
};

// Surtidos para coffee break por precio unitario
const SURTIDOS = [
  { id:"mini-surtido-balzac",    n:"Mini Surtido Balzac",              p:220,  qg:4, img:IMG.surtido_balzac },
  { id:"surtido-balzac",         n:"Surtido Balzac (25 pastelitos)",   p:400,  qg:8, img:IMG.surtido_balzac },
  { id:"surtido-colette",        n:"Surtido Colette (25 panes)",       p:450,  qg:9, img:IMG.surtido_colette },
  { id:"surtido-voltaire",       n:"Surtido Voltaire (15 bocadillos)", p:750,  qg:6, img:IMG.surtido_voltaire },
  { id:"coffee-break-am-cafe-8p",n:"Coffee Break AM – Con Café Frío", p:2700, qg:8, img:IMG.coffee_break_am },
];

// ── Bebidas ───────────────────────────────────────────────────
const BEV_CAFE  = { id:"cafe-te-berlioz", n:"Café / Té Berlioz — termo 12 tazas", p:540, qg:12, img:IMG.cafe_te };
const BEV_AGUA  = { id:"aguas-frescas",   n:"Agua Fresca — Jamaica",              p:45,  img:IMG.agua_fresca };
const ADDON_CRUDITES  = { id:"crudites-con-limon", n:"Crudités con Limón",        p:50,  img:IMG.crudites };
const ADDON_SEMILLAS  = { id:"mix-de-semillas",    n:"Mix de Semillas Naturales", p:60,  img:IMG.mix_semillas };

// ── Tipo de item interno ──────────────────────────────────────
interface RawItem { id:string; n:string; p:number; qty:number; img:string; reason:string; cat:string; desc:string }

function calcSubtotal(items: RawItem[]): number {
  return items.reduce((s, i) => s + i.p * i.qty, 0);
}

// ── Selector Coffee Break ────────────────────────────────────
function getCoffeeItems(people: number, dietaryCounts: {tipo:string;cantidad:number}[], targetSub: number): RawItem[] {
  const items: RawItem[] = [];
  const sinR = Math.max(0, people - dietaryCounts.reduce((s,d) => s+d.cantidad, 0));
  const veganos = dietaryCounts.filter(d => d.tipo==="vegano"||d.tipo==="sin_gluten").reduce((s,d)=>s+d.cantidad,0);

  // Elegir surtido para sinRestriccion
  if (sinR > 0) {
    const subDisponible = targetSub * 0.75; // reserva 25% para café y extras
    let surtido = SURTIDOS[0];
    for (const s of SURTIDOS) {
      if (s.p * Math.ceil(sinR / s.qg) <= subDisponible) surtido = s;
    }
    const qty = Math.ceil(sinR / surtido.qg);
    items.push({ id:surtido.id, n:surtido.n, p:surtido.p, qty, img:surtido.img, reason:`Para ${sinR} personas`, cat:"Coffee Break", desc:"Pan y bocadillos gourmet para compartir." });
  }

  // Café (siempre 1 termo mínimo)
  const cafeQty = Math.max(1, Math.ceil(people / BEV_CAFE.qg));
  items.push({ id:BEV_CAFE.id, n:BEV_CAFE.n, p:BEV_CAFE.p, qty:cafeQty, img:BEV_CAFE.img, reason:"Bebida del evento", cat:"Bebida", desc:"Café o té para 12 tazas en termo. Se mantiene caliente 3 horas." });

  // Extras para veganos/sin_gluten (no pueden comer pan dulce)
  if (veganos > 0) {
    items.push({ id:ADDON_CRUDITES.id, n:ADDON_CRUDITES.n, p:ADDON_CRUDITES.p, qty:veganos, img:ADDON_CRUDITES.img, reason:`Para ${veganos} personas ${dietaryCounts.filter(d=>d.tipo==="vegano").length>0?"veganas":"sin gluten"}`, cat:"Snack", desc:"Jícama, zanahoria, pepino y apio frescos con limón y chile. Vegano." });
    items.push({ id:ADDON_SEMILLAS.id, n:ADDON_SEMILLAS.n, p:ADDON_SEMILLAS.p, qty:veganos, img:ADDON_SEMILLAS.img, reason:"Snack apto para restricción", cat:"Snack", desc:"Mix artesanal de semillas tostadas. Vegano, keto y sin gluten." });
  }

  return items;
}

// ── Selector Desayuno / Comida ────────────────────────────────
function getBoxItems(
  tabla: Record<string, {id:string;n:string;p:number;img:string;cat:string;desc:string}>,
  tier: string,
  people: number,
  dietaryCounts: {tipo:string;cantidad:number}[],
  targetSub: number
): RawItem[] {
  const sinR = Math.max(0, people - dietaryCounts.reduce((s,d)=>s+d.cantidad, 0));
  const mainBox = tabla[tier];

  // Acumular por producto — si vegano+vegetariano mapean al mismo id, fusionar
  const merged = new Map<string, RawItem>();

  const addItem = (box: {id:string;n:string;p:number;img:string;cat:string;desc:string}, q: number, reason: string) => {
    if (merged.has(box.id)) {
      const existing = merged.get(box.id)!;
      existing.qty += q;
      // Combinar labels si son diferentes
      if (!existing.reason.includes(reason)) {
        existing.reason = existing.reason + " + " + reason;
      }
    } else {
      merged.set(box.id, { id:box.id, n:box.n, p:box.p, qty:q, img:box.img, reason, cat:box.cat, desc:box.desc });
    }
  };

  // Box para sin restricción
  if (sinR > 0) {
    addItem(mainBox, sinR, sinR === people ? `Para ${sinR} personas` : `Para ${sinR} personas sin restricción`);
  }

  // Box para cada restricción dietética
  for (const dc of dietaryCounts) {
    if (dc.cantidad <= 0) continue;
    const dietBox = (tabla[dc.tipo] as typeof mainBox | undefined) ?? mainBox;
    const label = dc.tipo === "keto" ? `🔥 Keto — ${dc.cantidad} persona${dc.cantidad>1?"s":""}`
      : dc.tipo === "vegetariano" ? `🥗 Vegetariano — ${dc.cantidad} persona${dc.cantidad>1?"s":""}`
      : dc.tipo === "vegano"      ? `🌱 Vegano — ${dc.cantidad} persona${dc.cantidad>1?"s":""}`
      : dc.tipo === "sin_gluten"  ? `🌾 Sin Gluten — ${dc.cantidad} persona${dc.cantidad>1?"s":""}`
      : dc.tipo === "sin_lactosa" ? `🥛 Sin Lactosa — ${dc.cantidad} persona${dc.cantidad>1?"s":""}`
      : `${dc.tipo} — ${dc.cantidad} persona${dc.cantidad>1?"s":""}`;
    addItem(dietBox, dc.cantidad, label);
  }

  const items: RawItem[] = Array.from(merged.values());

  // Bebida
  const sub = calcSubtotal(items);
  const left = targetSub - sub;
  if (left >= 480) {
    items.push({ id:BEV_CAFE.id, n:BEV_CAFE.n, p:BEV_CAFE.p, qty:1, img:BEV_CAFE.img, reason:"Bebida caliente del evento", cat:"Bebida", desc:"Café o té para 12 tazas en termo. Se mantiene caliente 3 horas." });
  } else if (left >= 40 * people) {
    items.push({ id:BEV_AGUA.id, n:BEV_AGUA.n, p:BEV_AGUA.p, qty:people, img:BEV_AGUA.img, reason:"Bebida del evento", cat:"Bebida", desc:"Agua fresca artesanal preparada el mismo día. Sin conservadores." });
  }

  return items;
}

// ── Construir los 3 tiers ────────────────────────────────────
function buildAllTiers(
  eventType: string,
  people: number,
  dietaryCounts: {tipo:string;cantidad:number}[],
  budgetEnabled: boolean,
  budgetPP: number
): Record<string, RawItem[]> {
  const base = (budgetEnabled && budgetPP > 0) ? budgetPP : 330;
  const totalBudget = base * people;
  const subtotalMax = (totalBudget - ENVIO_CALC) / (1 + IVA);

  const targets = {
    esencial:    subtotalMax * 0.82,
    equilibrado: subtotalMax * 1.00,
    experiencia: subtotalMax * 1.22,
  };

  const ev = eventType.toLowerCase().includes("coffee") ? "coffee"
           : eventType.toLowerCase().includes("desayuno") ? "desayuno"
           : "comida";

  if (ev === "coffee") {
    return {
      esencial:    getCoffeeItems(people, dietaryCounts, targets.esencial),
      equilibrado: getCoffeeItems(people, dietaryCounts, targets.equilibrado),
      experiencia: getCoffeeItems(people, dietaryCounts, targets.experiencia),
    };
  }

  const tabla = ev === "desayuno" ? DESAYUNO : COMIDA;
  return {
    esencial:    getBoxItems(tabla, "esencial",    people, dietaryCounts, targets.esencial),
    equilibrado: getBoxItems(tabla, "equilibrado", people, dietaryCounts, targets.equilibrado),
    experiencia: getBoxItems(tabla, "experiencia", people, dietaryCounts, targets.experiencia),
  };
}

// ── Textos Claude ─────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres copywriter de Berlioz Catering. Recibes 3 propuestas ya armadas.
Solo escribe textos cortos y atractivos: tagline, recommendationReason, highlights (3 puntos), narrativa.
Responde ÚNICAMENTE con este JSON (sin markdown, sin texto fuera):
{"esencial":{"tagline":"","recommendationReason":"","highlights":["","",""],"narrativa":""},"equilibrado":{"tagline":"","recommendationReason":"","highlights":["","",""],"narrativa":""},"experiencia":{"tagline":"","recommendationReason":"","highlights":["","",""],"narrativa":""}}`;

const FALLBACK_TEXTS: Record<string, {tagline:string;recommendationReason:string;highlights:string[];narrativa:string}> = {
  esencial:    { tagline:"Lo esencial, bien ejecutado",        recommendationReason:"Propuesta funcional al mejor precio.",        highlights:["Entrega puntual","Calidad Berlioz","Precio optimizado"],          narrativa:"Para reuniones efectivas." },
  equilibrado: { tagline:"La experiencia que tu equipo merece",recommendationReason:"8 de cada 10 clientes eligen este paquete.", highlights:["Variedad premium","Presentación profesional","Todo incluido"],      narrativa:"El balance perfecto entre precio y experiencia." },
  experiencia: { tagline:"Cada detalle cuenta",                recommendationReason:"Experiencia gastronómica completa.",          highlights:["Productos top del catálogo","Todo incluido","Memorable"],          narrativa:"Para eventos que dejan huella." },
};

// ── Handler ───────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    const eventType     = (body.eventType     as string)  ?? "comida";
    const peopleCount   = (body.peopleCount   as number)  ?? 1;
    const budgetEnabled = (body.budgetEnabled as boolean) ?? false;
    const budgetPP      = (body.budgetPerPerson as number)  ?? 0;
    const dietaryCounts = (body.dietaryCounts as {tipo:string;cantidad:number}[]) ?? [];
    const contactName   = (body.contactName   as string)  ?? "";
    const companyName   = (body.companyName   as string)  ?? "";

    // 1. Selección determinista de productos
    const tierItems = buildAllTiers(eventType, peopleCount, dietaryCounts, budgetEnabled, budgetPP);

    // 2. Textos de Claude
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const userMsg = `Evento: ${eventType}, ${peopleCount} personas${budgetEnabled?`, $${budgetPP}/persona`:""}
ESENCIAL: ${tierItems.esencial.map(i=>`${i.n} ×${i.qty}`).join(", ")}
EQUILIBRADO: ${tierItems.equilibrado.map(i=>`${i.n} ×${i.qty}`).join(", ")}
EXPERIENCIA: ${tierItems.experiencia.map(i=>`${i.n} ×${i.qty}`).join(", ")}`;

    let texts = FALLBACK_TEXTS;
    try {
      const ai = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role:"user", content:userMsg }],
      });
      const raw = ai.content[0].type==="text" ? ai.content[0].text : "";
      const clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      const parsed = JSON.parse(clean);
      if (parsed.esencial && parsed.equilibrado && parsed.experiencia) texts = parsed;
    } catch (_) { /* usa fallback */ }

    // 3. Armar packages
    const tierKeys: ("esencial"|"equilibrado"|"experiencia")[] = ["esencial","equilibrado","experiencia"];
    const tierMeta = {
      esencial:    { title:"Esencial",            isRec:false, rank:70 },
      equilibrado: { title:"Equilibrado",          isRec:true,  rank:90 },
      experiencia: { title:"Experiencia Completa", isRec:false, rank:80 },
    };

    const packages = tierKeys.map(key => {
      const raw = tierItems[key];
      const sub = calcSubtotal(raw);
      const iva = Math.round((sub + ENVIO_CALC) * IVA * 100) / 100;
      const total = Math.round((sub + ENVIO_CALC + iva) * 100) / 100;
      const t = texts[key] ?? FALLBACK_TEXTS[key];
      const meta = tierMeta[key];

      return {
        tier: key, title: meta.title,
        tagline: t.tagline ?? "", narrativa: t.narrativa ?? "",
        items: raw.map(i => ({
          productId: i.id, parentProductId: null,
          productName: i.n,
          quantity: i.qty, unitPrice: i.p, computedPrice: i.p * i.qty,
          score: 80,
          recommendationReason: i.reason,   // etiqueta dietética (badge de color)
          imageUrl: i.img,                   // imagen directa del catálogo
          imageSource: "catalog" as const,
          imagePrompt: null, sourceType: "supabase" as const,
          swapGroup: i.cat,                  // categoría real del producto
          categoria: i.cat,                  // para el sidebar de cambio
          descripcion: i.desc,               // descripción corta visible en la card
        })),
        subtotal: sub, shipping: ENVIO_CALC, iva, total,
        pricePerPerson: Math.round((total / Math.max(1, peopleCount)) * 100) / 100,
        recommendationReason: t.recommendationReason ?? "",
        rankingScore: meta.rank, isRecommended: meta.isRec,
        highlights: t.highlights ?? [], fallbackUsed: false,
      };
    });

    // 4. Guardar en Supabase (silencioso)
    const proposalId = crypto.randomUUID();
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await sb.from("cotizaciones").insert({
        id: proposalId, personas: peopleCount, tipo_servicio: eventType,
        presupuesto_por_persona: budgetPP, presupuesto_total: peopleCount * budgetPP,
        restricciones: dietaryCounts, nombre_cliente: contactName, empresa_cliente: companyName,
        opcion_basica: packages[0], opcion_equilibrada: packages[1], opcion_completa: packages[2],
        modelo_usado: "claude-haiku-4-5-20251001",
      });
    } catch (_) { /* silent */ }

    return new Response(
      JSON.stringify({ requestId:proposalId, proposalId, engineVersion:"v5-images",
        fallbackUsed:false, packages,
        recommendationSummary:`Propuesta para ${eventType}, ${peopleCount} personas.` }),
      { status:200, headers:{ ...CORS, "Content-Type":"application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    console.error("quote-orchestrator:", msg);
    return new Response(JSON.stringify({ error:msg }), { status:500, headers:CORS });
  }
});
