// ================================================================
// BERLIOZ — supabase/functions/quote-orchestrator/index.ts
// v4 — Selección determinista en TypeScript, sin tipos complejos
// ================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Nota: ENVIO aquí solo para calcular subtotal_target.
// El frontend recalcula el total final con su propio BASE_SHIPPING_COST.
const ENVIO_CALC = 360;
const IVA = 0.16;

// ── Tablas de productos por tipo de evento y tier ─────────────
// Precio sin IVA ni envío. Individual = precio por persona.

const DESAYUNO = {
  esencial:    { id:"breakfast-bag-pavo",               n:"Breakfast Bag — Pavo",                      p:250 },
  equilibrado: { id:"breakfast-in-roma-pan-dulce",      n:"Breakfast in Roma — Pan dulce",             p:290 },
  experiencia: { id:"breakfast-in-montreal-yogurt",     n:"Breakfast in Montreal — Con yogurt orgánico",p:410 },
  // Variantes dietéticas (mismas para todos los tiers)
  keto:           { id:"salmon-box",               n:"Salmon Box",                   p:410 },
  vegetariano:    { id:"box-chilaquiles-vegano",    n:"Box Chilaquiles — Rojos con huevo", p:310 },
  vegano:         { id:"box-chilaquiles-vegano",    n:"Box Chilaquiles — Rojos con huevo", p:310 },
  sin_gluten:     { id:"box-chilaquiles-vegano",    n:"Box Chilaquiles — Rojos con huevo", p:310 },
  sin_lactosa:    { id:"breakfast-in-roma-pan-dulce",n:"Breakfast in Roma — Pan dulce",    p:290 },
};

const COMIDA = {
  esencial:    { id:"lunch-bag-pasta-pollo",      n:"Lunch Bag — Pasta con pollo",               p:250 },
  equilibrado: { id:"golden-box-ensalada",        n:"Golden Box — Con ensalada de frutas",       p:330 },
  experiencia: { id:"orzo-pasta-pollo",           n:"Orzo Pasta Salad Box — Con pollo",          p:390 },
  keto:        { id:"box-keto-sin-gluten",        n:"Box Keto – Sin Gluten",                     p:370 },
  vegetariano: { id:"box-vegetariana",            n:"Box Vegetariana",                           p:340 },
  vegano:      { id:"salad-box-vegana",           n:"Salad Box — Vegana con agua",               p:300 },
  sin_gluten:  { id:"box-keto-sin-gluten",        n:"Box Keto – Sin Gluten",                     p:370 },
  sin_lactosa: { id:"box-oriental-pollo",         n:"Box Oriental — Pollo teriyaki",             p:300 },
};

// Coffee break: ajusta el surtido según el presupuesto total disponible
function getCoffeeTier(targetSubtotal: number, people: number) {
  // Café/Té siempre entra (precio fijo $540, grupal 12 tazas)
  const cafe = { id:"cafe-te-berlioz", n:"Café / Té Berlioz — termo 12 tazas", p:540, qty:1 };

  // Presupuesto restante para surtidos después del café
  const restante = targetSubtotal - 540;

  // Elegir surtido según lo que queda
  let surtido;
  if (restante <= 500) {
    surtido = { id:"mini-surtido-balzac", n:"Mini Surtido Balzac (10 pastelitos)", p:220, qg:4 };
  } else if (restante <= 900) {
    surtido = { id:"surtido-balzac",      n:"Surtido Balzac (25 pastelitos)",      p:400, qg:8 };
  } else if (restante <= 1400) {
    surtido = { id:"surtido-colette",     n:"Surtido Colette (25 panes franceses)",p:450, qg:9 };
  } else if (restante <= 2500) {
    surtido = { id:"surtido-voltaire",    n:"Surtido Voltaire (15 bocadillos)",    p:750, qg:6 };
  } else {
    surtido = { id:"coffee-break-am-cafe-8p", n:"Coffee Break AM – Con Café Frío (8 personas)", p:2700, qg:8 };
  }

  const surtidoQty = Math.ceil(people / surtido.qg);
  return [
    { ...surtido, qty: surtidoQty },
    { ...cafe },
  ];
}

// ── Construir items para un tier ─────────────────────────────
function buildItems(
  ev: string,
  tier: "esencial" | "equilibrado" | "experiencia",
  people: number,
  dietaryCounts: { tipo: string; cantidad: number }[],
  subtotalTarget: number
) {
  const items: { id:string; n:string; p:number; qty:number }[] = [];

  if (ev === "coffee") {
    // Coffee break: surtidos grupales
    const tierItems = getCoffeeTier(subtotalTarget, people);
    for (const t of tierItems) {
      items.push({ id:t.id, n:t.n, p:t.p, qty:t.qty });
    }
    // Para veganos/sin_gluten: añadir crudités individuales
    const veganos = dietaryCounts
      .filter(d => d.tipo === "vegano" || d.tipo === "sin_gluten")
      .reduce((s, d) => s + d.cantidad, 0);
    if (veganos > 0) {
      items.push({ id:"crudites-con-limon", n:"Crudités con Limón", p:50, qty:veganos });
      items.push({ id:"mix-de-semillas", n:"Mix de Semillas Naturales", p:60, qty:veganos });
    }
  } else {
    // Desayuno o comida: boxes individuales
    const tabla = ev === "desayuno" ? DESAYUNO : COMIDA;
    const mainBox = tabla[tier];
    const sinRestriccion = people - dietaryCounts.reduce((s, d) => s + d.cantidad, 0);

    // Box para personas sin restricción
    if (sinRestriccion > 0) {
      items.push({ id:mainBox.id, n:mainBox.n, p:mainBox.p, qty:sinRestriccion });
    }

    // Boxes para restricciones dietéticas
    for (const dc of dietaryCounts) {
      if (dc.cantidad <= 0) continue;
      const dietBox = (tabla as Record<string, { id:string; n:string; p:number }>)[dc.tipo];
      if (dietBox) {
        items.push({ id:dietBox.id, n:dietBox.n, p:dietBox.p, qty:dc.cantidad });
      } else {
        // Fallback a box principal si no hay variante específica
        items.push({ id:mainBox.id, n:mainBox.n, p:mainBox.p, qty:dc.cantidad });
      }
    }

    // Bebida
    const sub = items.reduce((s, i) => s + i.p * i.qty, 0);
    const left = subtotalTarget - sub;
    if (left >= 350) {
      // Alcanza para termo de café
      items.push({ id:"cafe-te-berlioz", n:"Café / Té Berlioz — termo 12 tazas", p:540, qty:1 });
    } else if (left >= 40 * people) {
      // Solo agua individual
      items.push({ id:"aguas-frescas", n:"Agua Fresca — Jamaica", p:45, qty:people });
    }
  }

  return items;
}

// ── Calcular subtotal de una lista de items ──────────────────
function subtotal(items: { p:number; qty:number }[]): number {
  return items.reduce((s, i) => s + i.p * i.qty, 0);
}

// ── Construir los 3 tiers ────────────────────────────────────
function buildAllTiers(
  eventType: string,
  people: number,
  dietaryCounts: { tipo:string; cantidad:number }[],
  budgetEnabled: boolean,
  budgetPerPerson: number
) {
  const base = (budgetEnabled && budgetPerPerson > 0) ? budgetPerPerson : 330;
  const totalBudget = base * people;
  // Restamos envío estimado y dividimos por IVA para obtener subtotal_max de comida
  const subtotalMax = (totalBudget - ENVIO_CALC) / (1 + IVA);

  const targets = {
    esencial:    subtotalMax * 0.82,
    equilibrado: subtotalMax * 1.00,
    experiencia: subtotalMax * 1.22,
  };

  const ev = eventType.toLowerCase().includes("coffee") ? "coffee"
           : eventType.toLowerCase().includes("desayuno") ? "desayuno"
           : "comida";

  return {
    esencial:    buildItems(ev, "esencial",    people, dietaryCounts, targets.esencial),
    equilibrado: buildItems(ev, "equilibrado", people, dietaryCounts, targets.equilibrado),
    experiencia: buildItems(ev, "experiencia", people, dietaryCounts, targets.experiencia),
  };
}

// ── Sistema prompt para textos únicamente ─────────────────────
const SYSTEM_PROMPT = `Eres copywriter de Berlioz Catering. Recibes 3 propuestas ya armadas.
Solo escribe textos: tagline, recommendationReason, highlights (3 puntos), narrativa.
Responde ÚNICAMENTE con este JSON exacto (sin markdown):
{
  "esencial":    {"tagline":"...","recommendationReason":"...","highlights":["...","...","..."],"narrativa":"..."},
  "equilibrado": {"tagline":"...","recommendationReason":"...","highlights":["...","...","..."],"narrativa":"..."},
  "experiencia": {"tagline":"...","recommendationReason":"...","highlights":["...","...","..."],"narrativa":"..."}
}`;

const FALLBACK_TEXTS = {
  esencial:    { tagline:"Lo esencial, bien ejecutado",        recommendationReason:"Propuesta funcional al mejor precio.",        highlights:["Entrega puntual","Calidad Berlioz","Precio optimizado"],          narrativa:"Para reuniones efectivas." },
  equilibrado: { tagline:"La experiencia que tu equipo merece",recommendationReason:"8 de cada 10 clientes eligen este paquete.", highlights:["Variedad premium","Presentación profesional","Completo"],          narrativa:"El balance perfecto." },
  experiencia: { tagline:"Cada detalle cuenta",                recommendationReason:"Experiencia gastronómica completa.",          highlights:["Productos top del catálogo","Todo incluido","Memorable"],          narrativa:"Para eventos que dejan huella." },
};

// ── Handler ───────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    const eventType     = body.eventType     ?? "comida";
    const peopleCount   = body.peopleCount   ?? 1;
    const budgetEnabled = body.budgetEnabled ?? false;
    const budgetPP      = body.budgetPerPerson ?? 0;
    const dietaryCounts = body.dietaryCounts ?? [];
    const contactName   = body.contactName   ?? "";
    const companyName   = body.companyName   ?? "";

    // 1. Seleccionar productos (TypeScript determinista)
    const tierItems = buildAllTiers(eventType, peopleCount, dietaryCounts, budgetEnabled, budgetPP);

    // 2. Pedir textos a Claude
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const userMsg = `Evento: ${eventType}, ${peopleCount} personas${budgetEnabled ? `, $${budgetPP}/persona` : ""}

ESENCIAL:
${tierItems.esencial.map(i => `- ${i.n} ×${i.qty}`).join("\n")}

EQUILIBRADO:
${tierItems.equilibrado.map(i => `- ${i.n} ×${i.qty}`).join("\n")}

EXPERIENCIA:
${tierItems.experiencia.map(i => `- ${i.n} ×${i.qty}`).join("\n")}`;

    let texts = FALLBACK_TEXTS;
    try {
      const ai = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      const raw = ai.content[0].type === "text" ? ai.content[0].text : "";
      const clean = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      const parsed = JSON.parse(clean);
      if (parsed.esencial && parsed.equilibrado && parsed.experiencia) {
        texts = parsed;
      }
    } catch (_) { /* usa fallback_texts */ }

    // 3. Armar packages en el formato exacto que espera ProposalStep
    const tierKeys: ("esencial"|"equilibrado"|"experiencia")[] = ["esencial","equilibrado","experiencia"];
    const tierMeta = {
      esencial:    { title:"Esencial",            isRec:false, rank:70 },
      equilibrado: { title:"Equilibrado",          isRec:true,  rank:90 },
      experiencia: { title:"Experiencia Completa", isRec:false, rank:80 },
    };

    const packages = tierKeys.map(key => {
      const rawItems = tierItems[key];
      const sub = subtotal(rawItems);
      const shipping = ENVIO_CALC;
      const iva = Math.round((sub + shipping) * IVA * 100) / 100;
      const total = Math.round((sub + shipping + iva) * 100) / 100;
      const t = texts[key] ?? FALLBACK_TEXTS[key];
      const meta = tierMeta[key];

      return {
        tier: key,
        title: meta.title,
        tagline: t.tagline ?? "",
        narrativa: t.narrativa ?? "",
        items: rawItems.map(i => ({
          productId: i.id,
          parentProductId: null,
          productName: i.n,
          quantity: i.qty,
          unitPrice: i.p,
          computedPrice: i.p * i.qty,
          score: 80,
          recommendationReason: "",
          imageUrl: null,
          imageSource: "generated_prompt",
          imagePrompt: null,
          sourceType: "supabase",
          swapGroup: eventType,
          categoria: eventType,
        })),
        subtotal: sub,
        shipping,
        iva,
        total,
        pricePerPerson: Math.round((total / Math.max(1, peopleCount)) * 100) / 100,
        recommendationReason: t.recommendationReason ?? "",
        rankingScore: meta.rank,
        isRecommended: meta.isRec,
        highlights: t.highlights ?? [],
        fallbackUsed: false,
      };
    });

    // 4. Guardar en Supabase (silencioso si falla)
    const proposalId = crypto.randomUUID();
    try {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await sb.from("cotizaciones").insert({
        id: proposalId,
        personas: peopleCount,
        tipo_servicio: eventType,
        presupuesto_por_persona: budgetPP,
        presupuesto_total: peopleCount * budgetPP,
        restricciones: dietaryCounts,
        nombre_cliente: contactName,
        empresa_cliente: companyName,
        opcion_basica:      packages[0],
        opcion_equilibrada: packages[1],
        opcion_completa:    packages[2],
        modelo_usado: "claude-haiku-4-5-20251001",
      });
    } catch (_) { /* silent */ }

    return new Response(
      JSON.stringify({
        requestId: proposalId,
        proposalId,
        engineVersion: "v4-deterministic",
        fallbackUsed: false,
        packages,
        recommendationSummary: `Propuesta para ${eventType}, ${peopleCount} personas.`,
      }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("quote-orchestrator error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: CORS }
    );
  }
});
