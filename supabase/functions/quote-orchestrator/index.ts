// ================================================================
// BERLIOZ — supabase/functions/quote-orchestrator/index.ts
// v6 — catálogo 100% WooCommerce (espejo en `productos`)
//      + mapa editable de roles/restricciones (`cotizador_roles_producto`)
// La lógica de tiers, banda ±15%, splits 50/50 y 33/33/33, rotación,
// jerarquía dietética, envío, IVA y textos con IA NO cambia.
// ================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ENVIO_CALC = 360;
const IVA = 0.16;
const IMG_FALLBACK = "https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-46-1-scaled.jpg";

// ================================================================
// TIPOS
// ================================================================
type BoxDef = { id:string; n:string; p:number; img:string; cat:string; desc:string; qg?:number };
interface RawItem { id:string; n:string; p:number; qty:number; img:string; reason:string; cat:string; desc:string }

interface Catalogo {
  desayuno: { roles: Record<string, BoxDef>; pool: BoxDef[] };
  comida:   { roles: Record<string, BoxDef>; pool: BoxDef[] };
  bevCafe:  BoxDef | null;
  bevAguas: BoxDef[];
  addons:   Record<string, BoxDef | undefined>;
  surtidos: { esencial: BoxDef[]; equilibrado: BoxDef[]; experiencia: BoxDef[] };
  exclusiones: { nombre_buscado:string; motivo:string; detalle:Record<string,unknown>; woo_id:number|null }[];
}

// ================================================================
// CARGA DEL CATÁLOGO DESDE EL ESPEJO DE WOO
// ================================================================
function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  const txt = s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&aacute;/g, "á").replace(/\s+/g, " ").trim();
  return txt.length > 180 ? txt.slice(0, 177) + "…" : txt;
}

async function loadCatalogo(sb: SupabaseClient): Promise<Catalogo> {
  const [{ data: prods }, { data: roles }] = await Promise.all([
    sb.from("productos")
      .select("id, woo_id, nombre, precio, precio_min, imagen_url, descripcion_corta, descripcion, categoria, woo_categorias")
      .eq("activo", true).eq("woo_source", true),
    sb.from("cotizador_roles_producto")
      .select("evento, rol, woo_id, prioridad, personas_por_unidad")
      .eq("activo", true).order("prioridad", { ascending: true }),
  ]);

  const byWooId = new Map<number, BoxDef>();
  for (const p of prods ?? []) {
    const precio = Number(p.precio ?? p.precio_min ?? 0);
    if (!p.woo_id || precio <= 0) continue;
    const cats: string[] = p.woo_categorias ?? [];
    byWooId.set(Number(p.woo_id), {
      id: String(p.id),
      n: p.nombre,
      p: precio,
      img: p.imagen_url || IMG_FALLBACK,
      cat: p.categoria || cats[0] || "Catálogo",
      desc: stripHtml(p.descripcion_corta || p.descripcion),
    });
  }

  const exclusiones: Catalogo["exclusiones"] = [];
  const pick = (evento: string, rol: string): BoxDef[] => {
    const rows = (roles ?? []).filter(r => r.evento === evento && r.rol === rol);
    const out: BoxDef[] = [];
    for (const r of rows) {
      const prod = byWooId.get(Number(r.woo_id));
      if (!prod) {
        exclusiones.push({
          nombre_buscado: `${evento}/${rol}`,
          motivo: "sin_match_publicado_en_woo",
          detalle: { evento, rol, woo_id: r.woo_id },
          woo_id: Number(r.woo_id),
        });
        continue;
      }
      out.push(r.personas_por_unidad ? { ...prod, qg: Number(r.personas_por_unidad) } : prod);
    }
    return out;
  };

  const buildEvento = (evento: "desayuno" | "comida") => {
    const pool = pick(evento, "pool_sinr").sort((a, b) => a.p - b.p);
    const rolesMap: Record<string, BoxDef> = {};
    for (const rol of ["esencial","equilibrado","experiencia","keto","sin_gluten","vegano","vegetariano","sin_lactosa"]) {
      const found = pick(evento, rol)[0];
      if (found) { rolesMap[rol] = found; continue; }
      // Woo manda: si el rol no existe publicado, el más cercano en precio del pool
      if (pool.length > 0) {
        const ref = rol === "esencial" ? pool[0]
          : rol === "experiencia" ? pool[pool.length - 1]
          : pool[Math.floor(pool.length / 2)];
        rolesMap[rol] = ref;
      }
    }
    return { roles: rolesMap, pool };
  };

  return {
    desayuno: buildEvento("desayuno"),
    comida: buildEvento("comida"),
    bevCafe: pick("global", "bebida_caliente")[0] ?? null,
    bevAguas: pick("global", "bebida_fria"),
    addons: {
      crudites: pick("global", "addon_crudites")[0],
      semillas: pick("global", "addon_semillas")[0],
      fruta:    pick("global", "addon_fruta")[0],
      yogurt:   pick("global", "addon_yogurt")[0],
      jugo:     pick("global", "addon_jugo")[0],
    },
    surtidos: {
      esencial:    pick("coffee", "surtido_esencial"),
      equilibrado: pick("coffee", "surtido_equilibrado"),
      experiencia: pick("coffee", "surtido_experiencia"),
    },
    exclusiones,
  };
}

// ================================================================
// Selección dinámica de productos para sin restricción
// 1. targetPP = presupuesto real por persona tras restar costos dietéticos
// 2. Banda de ±15% del targetPP
// 3. Si targetPP > max producto → usa los más caros
// 4. 1-5 personas → 50/50 | 6+ personas → 33/33/33
// 5. rotIdx rota el orden para variar entre cotizaciones
// ================================================================
function selectSinRProducts(
  products: BoxDef[],
  targetPP: number,
  sinR: number,
  rotIdx: number
): { box: BoxDef; qty: number }[] {
  if (sinR <= 0 || products.length === 0) return [];

  const sorted = [...products].sort((a, b) => a.p - b.p);
  const maxP = sorted[sorted.length - 1].p;

  const mostExpensive = sorted[sorted.length - 1];
  const secondMost    = sorted.length >= 2 ? sorted[sorted.length - 2] : mostExpensive;
  const thirdMost     = sorted.length >= 3 ? sorted[sorted.length - 3] : secondMost;

  if (targetPP >= maxP * 0.95) {
    const pool = [mostExpensive, secondMost, thirdMost]
      .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

    const f0 = pool[rotIdx % pool.length];
    const f1 = pool[(rotIdx + 1) % pool.length];
    const f2 = pool[(rotIdx + 2) % pool.length];

    if (sinR <= 5 || pool.length < 2) {
      const a = Math.ceil(sinR / 2), b = sinR - a;
      return [
        { box: f0, qty: a },
        ...(b > 0 && f1.id !== f0.id ? [{ box: f1, qty: b }] : [{ box: f0, qty: b }]),
      ].filter(r => r.qty > 0);
    }

    const a = Math.ceil(sinR / 3);
    const b = Math.ceil(sinR / 3);
    const c = sinR - a - b;
    const result: { box: BoxDef; qty: number }[] = [{ box: f0, qty: a }];
    if (f1.id !== f0.id) result.push({ box: f1, qty: b });
    else result[0].qty += b;
    if (c > 0) {
      if (f2.id !== f0.id && f2.id !== f1.id) result.push({ box: f2, qty: c });
      else result[result.length - 1].qty += c;
    }
    return result.filter(r => r.qty > 0);
  }

  const lo = targetPP * 0.87;
  const hi = targetPP * 1.15;
  const inBand = products.filter(p => p.p >= lo && p.p <= hi);

  if (inBand.length === 0) {
    const closest = products.reduce((a, b) =>
      Math.abs(b.p - targetPP) < Math.abs(a.p - targetPP) ? b : a
    );
    return [{ box: closest, qty: sinR }];
  }

  if (inBand.length === 1 || sinR <= 3) {
    const best = inBand.reduce((a, b) =>
      Math.abs(b.p - targetPP) < Math.abs(a.p - targetPP) ? b : a
    );
    return [{ box: best, qty: sinR }];
  }

  const rotated = [
    ...inBand.slice(rotIdx % inBand.length),
    ...inBand.slice(0, rotIdx % inBand.length),
  ];

  if (sinR <= 5 || rotated.length < 3) {
    const a = Math.ceil(sinR / 2), b = sinR - a;
    return [
      { box: rotated[0], qty: a },
      ...(b > 0 ? [{ box: rotated[1], qty: b }] : []),
    ];
  }

  const use = rotated.slice(0, 3);
  const a = Math.ceil(sinR / 3);
  const b = Math.ceil(sinR / 3);
  const c = sinR - a - b;
  const result: { box: BoxDef; qty: number }[] = [
    { box: use[0], qty: a },
    { box: use[1], qty: b },
  ];
  if (c > 0) result.push({ box: use[2] ?? use[1], qty: c });
  return result.filter(r => r.qty > 0);
}

function calcSubtotal(items: RawItem[]): number {
  return items.reduce((s, i) => s + i.p * i.qty, 0);
}

// ── Selector Coffee Break ────────────────────────────────────
function getCoffeeItems(
  cat: Catalogo,
  people: number,
  dietaryCounts: {tipo:string;cantidad:number}[],
  _targetSub: number,
  tier: "esencial"|"equilibrado"|"experiencia"
): RawItem[] {
  const items: RawItem[] = [];

  const keto    = dietaryCounts.filter(d=>d.tipo==="keto").reduce((s,d)=>s+d.cantidad,0);
  const vegano  = dietaryCounts.filter(d=>d.tipo==="vegano").reduce((s,d)=>s+d.cantidad,0);
  const sg      = dietaryCounts.filter(d=>d.tipo==="sin_gluten").reduce((s,d)=>s+d.cantidad,0);
  const veg     = dietaryCounts.filter(d=>d.tipo==="vegetariano").reduce((s,d)=>s+d.cantidad,0);

  const noSurtido = keto + vegano + sg;
  const conSurtido = Math.max(0, people - noSurtido);

  if (conSurtido > 0) {
    const opciones = cat.surtidos[tier];
    let surtido: BoxDef | undefined;
    if (tier === "esencial") {
      surtido = Math.ceil(conSurtido / (opciones[0]?.qg ?? 4)) <= 2 ? opciones[0] : (opciones[1] ?? opciones[0]);
    } else if (tier === "equilibrado") {
      surtido = conSurtido <= 6 ? opciones[0] : (opciones[1] ?? opciones[0]);
    } else {
      surtido = opciones[0];
    }
    if (surtido) {
      const qty = Math.ceil(conSurtido / (surtido.qg ?? 6));
      const reason = veg > 0
        ? `Para ${conSurtido - veg} personas + ${veg} vegetariano${veg>1?"s":""}`
        : `Para ${conSurtido} personas`;
      items.push({ id:surtido.id, n:surtido.n, p:surtido.p, qty, img:surtido.img, reason, cat:surtido.cat, desc:surtido.desc });
    }
  }

  // Café (siempre, para todos)
  if (cat.bevCafe) {
    const cafeQty = Math.max(1, Math.ceil(people / (cat.bevCafe.qg ?? 12)));
    items.push({ id:cat.bevCafe.id, n:cat.bevCafe.n, p:cat.bevCafe.p, qty:cafeQty, img:cat.bevCafe.img,
      reason:"Bebida caliente para todos", cat:cat.bevCafe.cat, desc:cat.bevCafe.desc });
  }

  const crud = cat.addons.crudites;
  const sem  = cat.addons.semillas;

  if (vegano > 0) {
    if (crud) items.push({ ...crud, qty:vegano, reason:`🌱 Vegano — ${vegano} persona${vegano>1?"s":""}` });
    if (sem)  items.push({ ...sem,  qty:vegano, reason:"🌱 Vegano — complemento" });
  }
  if (keto > 0) {
    if (crud) items.push({ ...crud, qty:keto, reason:`🔥 Keto — ${keto} persona${keto>1?"s":""}` });
    if (sem)  items.push({ ...sem,  qty:keto, reason:"🔥 Keto — complemento" });
  }
  if (sg > 0 && crud) {
    items.push({ ...crud, qty:sg, reason:`🌾 Sin Gluten — ${sg} persona${sg>1?"s":""}` });
  }

  return items;
}

// ── Selector Desayuno / Comida ────────────────────────────────
function getBoxItems(
  cat: Catalogo,
  tabla: Record<string, BoxDef>,
  tier: string,
  ev: string,
  people: number,
  dietaryCounts: {tipo:string;cantidad:number}[],
  targetSub: number,
  sinRProducts: BoxDef[],
  rotIdx = 0
): RawItem[] {
  const sinR = Math.max(0, people - dietaryCounts.reduce((s,d)=>s+d.cantidad, 0));
  const mainBox = tabla[tier] ?? sinRProducts[0];
  if (!mainBox) return [];

  const merged = new Map<string, RawItem>();
  const addItem = (box: BoxDef, q: number, reason: string) => {
    if (merged.has(box.id)) {
      const existing = merged.get(box.id)!;
      existing.qty += q;
      if (!existing.reason.includes(reason)) existing.reason = existing.reason + " + " + reason;
    } else {
      merged.set(box.id, { id:box.id, n:box.n, p:box.p, qty:q, img:box.img, reason, cat:box.cat, desc:box.desc });
    }
  };

  const costoRestricciones = dietaryCounts.reduce((sum, dc) => {
    const dietBox = tabla[dc.tipo] ?? mainBox;
    return sum + dietBox.p * dc.cantidad;
  }, 0);
  const presupuestoRestante = targetSub - costoRestricciones;
  const ppRestante = sinR > 0 ? presupuestoRestante / sinR : 0;

  if (sinR > 0) {
    if (sinRProducts.length > 0) {
      const splits = selectSinRProducts(sinRProducts, ppRestante > 0 ? ppRestante : mainBox.p, sinR, rotIdx);
      for (const s of splits) {
        const label = sinR === people
          ? `Para ${s.qty} persona${s.qty > 1 ? "s" : ""}`
          : `Para ${s.qty} persona${s.qty > 1 ? "s" : ""} sin restricción`;
        addItem(s.box, s.qty, label);
      }
    } else {
      addItem(mainBox, sinR, sinR === people ? `Para ${sinR} personas` : `Para ${sinR} personas sin restricción`);
    }
  }

  for (const dc of dietaryCounts) {
    if (dc.cantidad <= 0) continue;
    const dietBox = tabla[dc.tipo] ?? mainBox;
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
  let left = targetSub - sub;
  const agua = cat.bevAguas.length > 0 ? cat.bevAguas[rotIdx % cat.bevAguas.length] : undefined;
  if (cat.bevCafe && left >= cat.bevCafe.p - 60) {
    items.push({ ...cat.bevCafe, qty:1, reason:"Bebida caliente del evento" });
    left -= cat.bevCafe.p;
  } else if (agua && left >= agua.p * people * 0.9) {
    items.push({ ...agua, qty:people, reason:"Bebida del evento" });
    left -= agua.p * people;
  }

  // Experiencia: complemento contextual según tipo de evento
  if (tier === "experiencia" && sinR > 0) {
    const esDesayuno = ev === "desayuno";
    const addons = (esDesayuno
      ? [cat.addons.fruta, cat.addons.yogurt, cat.addons.jugo]
      : [cat.addons.crudites, cat.addons.semillas, agua]
    ).filter((a): a is BoxDef => !!a);
    const addon = addons[rotIdx % Math.max(1, addons.length)];
    if (addon && left >= addon.p * sinR * 0.9) {
      items.push({ ...addon, qty: sinR, reason: esDesayuno ? "Complemento gourmet del desayuno" : "Complemento de cierre" });
    }
  }

  return items;
}

// ── Construir los 3 tiers ────────────────────────────────────
function buildAllTiers(
  cat: Catalogo,
  eventType: string,
  people: number,
  dietaryCounts: {tipo:string;cantidad:number}[],
  budgetEnabled: boolean,
  budgetPP: number
): Record<string, RawItem[]> {
  const base = (budgetEnabled && budgetPP > 0) ? budgetPP : 330;

  const targets = {
    esencial:    base * people * 0.82,
    equilibrado: base * people,
    experiencia: base * people * 1.22,
  };

  const ev = eventType.toLowerCase().includes("coffee") ? "coffee"
           : eventType.toLowerCase().includes("desayuno") ? "desayuno"
           : "comida";

  const rotIdx = Math.floor(Math.random() * 3);

  if (ev === "coffee") {
    return {
      esencial:    getCoffeeItems(cat, people, dietaryCounts, targets.esencial,    "esencial"),
      equilibrado: getCoffeeItems(cat, people, dietaryCounts, targets.equilibrado, "equilibrado"),
      experiencia: getCoffeeItems(cat, people, dietaryCounts, targets.experiencia, "experiencia"),
    };
  }

  const fuente = ev === "desayuno" ? cat.desayuno : cat.comida;
  return {
    esencial:    getBoxItems(cat, fuente.roles, "esencial",    ev, people, dietaryCounts, targets.esencial,    fuente.pool, rotIdx),
    equilibrado: getBoxItems(cat, fuente.roles, "equilibrado", ev, people, dietaryCounts, targets.equilibrado, fuente.pool, rotIdx),
    experiencia: getBoxItems(cat, fuente.roles, "experiencia", ev, people, dietaryCounts, targets.experiencia, fuente.pool, rotIdx),
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

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 0. Catálogo vivo de Woo
    const catalogo = await loadCatalogo(sb);

    // Log de roles sin producto publicado en Woo
    if (catalogo.exclusiones.length > 0) {
      try {
        await sb.from("catalogo_exclusiones").insert(
          catalogo.exclusiones.map(e => ({
            origen: "cotizador",
            nombre_buscado: e.nombre_buscado,
            motivo: e.motivo,
            detalle: e.detalle,
            woo_id: e.woo_id,
          }))
        );
      } catch (_) { /* silent */ }
    }

    // 1. Selección determinista de productos (misma lógica, productos de Woo)
    const tierItems = buildAllTiers(catalogo, eventType, peopleCount, dietaryCounts, budgetEnabled, budgetPP);

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
          recommendationReason: i.reason,
          imageUrl: i.img,
          imageSource: "catalog" as const,
          imagePrompt: null, sourceType: "supabase" as const,
          swapGroup: i.cat,
          categoria: i.cat,
          descripcion: i.desc,
        })),
        subtotal: sub, shipping: ENVIO_CALC, iva, total,
        pricePerPerson: Math.round((sub / Math.max(1, peopleCount)) * 100) / 100,
        recommendationReason: t.recommendationReason ?? "",
        rankingScore: meta.rank, isRecommended: meta.isRec,
        highlights: t.highlights ?? [], fallbackUsed: false,
      };
    });

    // 4. Guardar en Supabase (silencioso)
    const proposalId = crypto.randomUUID();
    try {
      await sb.from("cotizaciones").insert({
        id: proposalId, personas: peopleCount, tipo_servicio: eventType,
        presupuesto_por_persona: budgetPP, presupuesto_total: peopleCount * budgetPP,
        restricciones: dietaryCounts, nombre_cliente: contactName, empresa_cliente: companyName,
        opcion_basica: packages[0], opcion_equilibrada: packages[1], opcion_completa: packages[2],
        modelo_usado: "claude-haiku-4-5-20251001",
      });
    } catch (_) { /* silent */ }

    return new Response(
      JSON.stringify({ requestId:proposalId, proposalId, engineVersion:"v6-woo",
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
