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
  piropo:           "https://berlioz.mx/wp-content/uploads/2022/01/Piropo-Tinga-de-Pollo-Berlioz.jpg",
  white_box:        "https://berlioz.mx/wp-content/uploads/2023/03/white-box.jpg",
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
  // Healthy Breakfast = chía pudding, sin huevo, sin lácteos → vegano real ✓ keto ✓ sin_gluten ✓
  keto:         { id:"healthy-breakfast",               n:"Healthy Breakfast",                          p:370, img:"https://berlioz.mx/wp-content/uploads/2023/04/Healthy-breakfast-2.jpeg", cat:"Desayuno", desc:"Chía pudding con granola keto, mantequilla de almendras, coco rallado y fruta. Vegano y sin gluten." },
  sin_gluten:   { id:"healthy-breakfast",               n:"Healthy Breakfast",                          p:370, img:"https://berlioz.mx/wp-content/uploads/2023/04/Healthy-breakfast-2.jpeg", cat:"Desayuno", desc:"Chía pudding con granola keto, mantequilla de almendras, coco rallado y fruta. Sin gluten." },
  vegano:       { id:"healthy-breakfast",               n:"Healthy Breakfast",                          p:370, img:"https://berlioz.mx/wp-content/uploads/2023/04/Healthy-breakfast-2.jpeg", cat:"Desayuno", desc:"Chía pudding con granola keto, mantequilla de almendras, coco rallado y fruta. 100% vegano." },
  // Chilaquiles con huevo = lacto-ovo vegetariano ✓ (no carne), pero NO vegano (tiene huevo+crema+queso)
  vegetariano:  { id:"box-chilaquiles-verdes-con-huevo",n:"Box Chilaquiles — Verdes con huevo",         p:310, img:IMG.chilaquiles,        cat:"Desayuno", desc:"Totopos azules con huevo, crema, queso, cilantro y jugo del día. Vegetariano." },
  // Breakfast BLT: sin lácteos en ingredientes base (pavo, tocino, tomate, lechuga, mayo chipotle)
  sin_lactosa:  { id:"breakfast-blt-pavo-yogurt",       n:"Breakfast BLT — Pavo y yogurt",             p:330, img:IMG.breakfast_blt,      cat:"Desayuno", desc:"Sándwich BLT con tocino o pavo, tomate, lechuga y mayonesa de chipotle." },
};

// ================================================================
// COMIDA — Restricciones dietéticas (fijas, no rotan)
// ================================================================
const COMIDA: Record<string, { id:string; n:string; p:number; img:string; cat:string; desc:string }> = {
  keto:        { id:"box-keto-sin-gluten",   n:"Box Keto – Sin Gluten",             p:370, img:IMG.box_keto,        cat:"Comida", desc:"Proteína con vegetales asados y ensalada verde con aguacate. Sin granos ni harinas." },
  sin_gluten:  { id:"box-keto-sin-gluten",   n:"Box Keto – Sin Gluten",             p:370, img:IMG.box_keto,        cat:"Comida", desc:"Proteína con vegetales asados y ensalada verde con aguacate. Sin gluten." },
  vegano:      { id:"salad-box-vegana",       n:"Salad Box — Vegana con agua",       p:300, img:IMG.salad_box,       cat:"Comida", desc:"Tofu marinado sobre quinoa con aguacate y verduras. Sin lácteos ni huevo. 100% vegana." },
  vegetariano: { id:"box-vegetariana",        n:"Box Vegetariana",                   p:340, img:IMG.box_vegetariana, cat:"Comida", desc:"Ciabatta de verduras horneadas con queso crema, aguacate y jícama con toronja." },
  sin_lactosa: { id:"box-oriental-pollo",     n:"Box Oriental — Pollo teriyaki",     p:300, img:IMG.box_oriental,    cat:"Comida", desc:"Pollo en salsa de soya, arroz al vapor y verduras salteadas. Sin lácteos." },
  // fallback por si el código pide [tier] y no existe
  esencial:    { id:"lunch-bag-pasta-pollo",  n:"Lunch Bag — Pasta con pollo",       p:250, img:IMG.lunch_bag,       cat:"Comida", desc:"Pasta al pesto con jitomates horneados, mozzarella y panqué del día." },
  equilibrado: { id:"golden-box-ensalada",    n:"Golden Box — Con ensalada de frutas",p:330, img:IMG.golden_box,     cat:"Comida", desc:"Ciabatta de pollo marinado con queso fundido y ensalada de pepino con cabra." },
  experiencia: { id:"orzo-pasta-pollo",       n:"Orzo Pasta Salad Box — Con pollo",  p:390, img:IMG.orzo_pasta,      cat:"Comida", desc:"Pasta orzo con trufa blanca, espárragos, parmesano y ensalada de sandía." },
};

// ================================================================
// getBoxItems distribuye sinR entre ellos según tamaño del grupo:
//   1-5 personas → 50/50 (2 formatos)
//   6+  personas → 33/33/33 (3 formatos)
// rotIdx rota el orden de los formatos para que cada cotización sea diferente
// ================================================================
type BoxDef = { id:string; n:string; p:number; img:string; cat:string; desc:string };

// ================================================================
// PRODUCTOS PARA PERSONAS SIN RESTRICCIÓN (ordenados por precio)
// La selección es DINÁMICA: busca el producto más cercano al targetPP
// real del tier, considerando lo que ya cuesta el grupo con restricciones
// ================================================================
type BoxDef = { id:string; n:string; p:number; img:string; cat:string; desc:string };

const DESAYUNO_SINR: BoxDef[] = [
  { id:"breakfast-bag-pavo",              n:"Breakfast Bag — Pavo",                       p:250, img:IMG.breakfast_bag,     cat:"Desayuno", desc:"Ciabatta con pavo, fruta fresca y bebida. Ágil y delicioso." },
  { id:"breakfast-in-roma-pan-dulce",     n:"Breakfast in Roma — Pan dulce",              p:290, img:IMG.breakfast_roma,     cat:"Desayuno", desc:"Croissant relleno de frittata con pavo, fruta fresca y pan o yogurt." },
  { id:"breakfast-in-london-pavo-yogurt", n:"Breakfast in London — Pavo y yogurt",        p:320, img:IMG.breakfast_london,   cat:"Desayuno", desc:"Sándwich de pavo con mostaza Dijon, lechuga, jitomate y yogurt." },
  { id:"breakfast-blt-pavo-yogurt",       n:"Breakfast BLT — Pavo y yogurt",              p:330, img:IMG.breakfast_blt,      cat:"Desayuno", desc:"Sándwich BLT con tocino o pavo, tomate, lechuga y mayonesa de chipotle." },
  { id:"breakfast-in-montreal-yogurt",    n:"Breakfast in Montreal — Con yogurt orgánico",p:410, img:IMG.breakfast_montreal, cat:"Desayuno", desc:"Salmón ahumado a las hierbas finas con fruta fresca y yogurt orgánico." },
];

const COMIDA_SINR: BoxDef[] = [
  { id:"lunch-bag-pasta-pollo",          n:"Lunch Bag — Pasta con pollo",              p:250, img:IMG.lunch_bag,     cat:"Comida", desc:"Pasta al pesto con jitomates horneados, mozzarella y panqué del día." },
  { id:"salad-box-pollo-agua",           n:"Salad Box — Pollo con agua",               p:280, img:IMG.salad_box,     cat:"Comida", desc:"Ensalada de pollo con verduras frescas y aderezo de la casa." },
  { id:"piropo-tinga-con-jicama",        n:"Piropo – Tinga de Pollo",                  p:280, img:IMG.piropo,        cat:"Comida", desc:"Burrito artesanal de tinga de pollo con ensalada de jícama y limón." },
  { id:"white-box-con-ensalada",         n:"White Box — Con ensalada de frutas",       p:300, img:IMG.white_box,     cat:"Comida", desc:"Ciabatta de pollo asado con aderezo de hierbas y ensalada de frutas." },
  { id:"box-oriental-pollo",             n:"Box Oriental — Pollo teriyaki",            p:300, img:IMG.box_oriental,  cat:"Comida", desc:"Pollo en salsa de soya, arroz al vapor y verduras salteadas. Sin lácteos." },
  { id:"golden-box-ensalada",            n:"Golden Box — Con ensalada de frutas",      p:330, img:IMG.golden_box,    cat:"Comida", desc:"Ciabatta de pollo marinado con queso fundido y ensalada de pepino con cabra." },
  { id:"blt-box-con-chips",              n:"BLT Box — Con chips",                      p:330, img:IMG.blt_box,       cat:"Comida", desc:"Sándwich BLT de pollo o tocino, jitomate, lechuga y mayonesa de chipotle." },
  { id:"green-box-con-pepino-feta",      n:"Green Box — Con ensalada de pepino",       p:340, img:IMG.green_box,     cat:"Comida", desc:"Ciabatta con verduras asadas, queso feta, pepino y aderezo de hierbas." },
  { id:"aqua-box-con-calabaza",          n:"Aqua Box — Con ensalada de calabaza",      p:350, img:IMG.aqua_box,      cat:"Comida", desc:"Box ligero con proteína y ensalada de calabaza asada. Fresco y sofisticado." },
  { id:"pink-box-clasica-jicama",        n:"Pink Box — Clásica con ensalada de jícama",p:380, img:IMG.pink_box,      cat:"Comida", desc:"Pasta rosa de betabel con pollo, frutos secos y ensalada de jícama." },
  { id:"orzo-pasta-pollo",               n:"Orzo Pasta Salad Box — Con pollo",         p:390, img:IMG.orzo_pasta,    cat:"Comida", desc:"Pasta orzo con trufa blanca, espárragos, parmesano y ensalada de sandía." },
];

// ── Selección dinámica de productos para sin restricción ──────
// 1. Calcula targetPP = presupuesto real por persona después de restar costos dietéticos
// 2. Busca productos dentro de ±15% del targetPP (banda de precio)
// 3. Si targetPP > max producto → usa el más caro
// 4. Si hay 2-3 productos en la banda: split 50/50 (≤5p) o 33/33/33 (6+p)
// 5. rotIdx rota el orden para variar entre cotizaciones
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

  // Si el target supera al producto más caro → variar con rotIdx entre cotizaciones
  if (targetPP >= maxP * 0.95) {
    if (sinR <= 3 || rotIdx === 0) {
      // Todo al más caro
      return [{ box: mostExpensive, qty: sinR }];
    } else if (rotIdx === 1 && secondMost.id !== mostExpensive.id) {
      // 50/50 entre los dos más caros
      const a = Math.ceil(sinR / 2), b = sinR - a;
      return [
        { box: mostExpensive, qty: a },
        { box: secondMost, qty: b },
      ];
    } else {
      // Rotar: 1/3 del segundo más caro, resto al más caro
      const b = Math.ceil(sinR / 3);
      const a = sinR - b;
      return [
        { box: mostExpensive, qty: a },
        ...(secondMost.id !== mostExpensive.id && b > 0 ? [{ box: secondMost, qty: b }] : []),
      ];
    }
  }

  // Banda de ±15% alrededor del targetPP
  const lo = targetPP * 0.87;
  const hi = targetPP * 1.15;
  let inBand = products.filter(p => p.p >= lo && p.p <= hi);

  // Si no hay productos en la banda, usar el más cercano
  if (inBand.length === 0) {
    const closest = products.reduce((a, b) =>
      Math.abs(b.p - targetPP) < Math.abs(a.p - targetPP) ? b : a
    );
    return [{ box: closest, qty: sinR }];
  }

  // Solo 1 en la banda → todos al mismo
  if (inBand.length === 1 || sinR <= 3) {
    const best = inBand.reduce((a, b) =>
      Math.abs(b.p - targetPP) < Math.abs(a.p - targetPP) ? b : a
    );
    return [{ box: best, qty: sinR }];
  }

  // Rotar el orden dentro de la banda
  const rotated = [
    ...inBand.slice(rotIdx % inBand.length),
    ...inBand.slice(0, rotIdx % inBand.length),
  ];

  if (sinR <= 5 || rotated.length < 3) {
    // 50/50
    const a = Math.ceil(sinR / 2), b = sinR - a;
    return [
      { box: rotated[0], qty: a },
      ...(b > 0 ? [{ box: rotated[1], qty: b }] : []),
    ];
  }

  // 33/33/33 con hasta 3 productos
  const use = rotated.slice(0, 3);
  const a = Math.ceil(sinR / 3);
  const b = Math.ceil(sinR / 3);
  const c = sinR - a - b;
  const result: { box: BoxDef; qty: number }[] = [
    { box: use[0], qty: a },
    { box: use[1], qty: b },
  ];
  if (c > 0) {
    result.push({ box: use[2] ?? use[1], qty: c });
  }
  return result.filter(r => r.qty > 0);
}

// Surtidos para coffee break
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
// tier: "esencial" | "equilibrado" | "experiencia"
function getCoffeeItems(
  people: number,
  dietaryCounts: {tipo:string;cantidad:number}[],
  targetSub: number,
  tier: "esencial"|"equilibrado"|"experiencia"
): RawItem[] {
  const items: RawItem[] = [];

  // Personas que SÍ pueden comer surtidos (sin restricción + vegetariano)
  const keto    = dietaryCounts.filter(d=>d.tipo==="keto").reduce((s,d)=>s+d.cantidad,0);
  const vegano  = dietaryCounts.filter(d=>d.tipo==="vegano").reduce((s,d)=>s+d.cantidad,0);
  const sg      = dietaryCounts.filter(d=>d.tipo==="sin_gluten").reduce((s,d)=>s+d.cantidad,0);
  const sinLac  = dietaryCounts.filter(d=>d.tipo==="sin_lactosa").reduce((s,d)=>s+d.cantidad,0);
  const veg     = dietaryCounts.filter(d=>d.tipo==="vegetariano").reduce((s,d)=>s+d.cantidad,0);

  // Personas que no pueden comer pan/bocadillos del surtido (keto, vegano, sin_gluten)
  const noSurtido = keto + vegano + sg;
  const conSurtido = Math.max(0, people - noSurtido); // sin restricción + vegetariano + sin lactosa

  // ── Surtido según tier y cuántas personas lo pueden comer ──
  if (conSurtido > 0) {
    // Surtido diferente por tier
    let surtido;
    if (tier === "esencial") {
      // Mini surtidos económicos
      surtido = Math.ceil(conSurtido / 4) <= 2
        ? { id:"mini-surtido-colette", n:"Mini Surtido Colette (10 panes franceses)", p:290, qg:4, img:IMG.surtido_colette }
        : { id:"surtido-balzac", n:"Surtido Balzac (25 pastelitos)", p:400, qg:8, img:IMG.surtido_balzac };
    } else if (tier === "equilibrado") {
      // Surtidos estándar
      surtido = conSurtido <= 6
        ? { id:"surtido-colette", n:"Surtido Colette (25 panes franceses)", p:450, qg:9, img:IMG.surtido_colette }
        : { id:"surtido-voltaire", n:"Surtido Voltaire (15 bocadillos variados)", p:750, qg:6, img:IMG.surtido_voltaire };
    } else {
      // Premium: bocadillos gourmet
      surtido = { id:"surtido-camille", n:"Surtido Camille (15 bocadillos salados)", p:700, qg:6, img:IMG.surtido_camille };
    }
    const qty = Math.ceil(conSurtido / surtido.qg);
    const reason = veg > 0
      ? `Para ${conSurtido - veg} personas + ${veg} vegetariano${veg>1?"s":""}`
      : `Para ${conSurtido} personas`;
    items.push({ id:surtido.id, n:surtido.n, p:surtido.p, qty, img:surtido.img, reason, cat:"Coffee Break", desc:"Selección gourmet de bocadillos y panes para compartir." });
  }

  // ── Café (siempre, para todos) ──
  const cafeQty = Math.max(1, Math.ceil(people / BEV_CAFE.qg));
  items.push({ id:BEV_CAFE.id, n:BEV_CAFE.n, p:BEV_CAFE.p, qty:cafeQty, img:BEV_CAFE.img,
    reason:"Bebida caliente para todos", cat:"Bebida", desc:"Café o té en termo para 12 tazas. Se mantiene caliente 3 horas." });

  // ── Opciones para personas con restricciones dietéticas ──
  // Veganos: crudités + semillas (vegano, sin gluten, sin lactosa)
  if (vegano > 0) {
    items.push({ id:ADDON_CRUDITES.id, n:ADDON_CRUDITES.n, p:ADDON_CRUDITES.p, qty:vegano,
      img:ADDON_CRUDITES.img, reason:`🌱 Vegano — ${vegano} persona${vegano>1?"s":""}`,
      cat:"Snack", desc:"Jícama, zanahoria, pepino y apio frescos con limón y chile. 100% vegano." });
    items.push({ id:ADDON_SEMILLAS.id, n:ADDON_SEMILLAS.n, p:ADDON_SEMILLAS.p, qty:vegano,
      img:ADDON_SEMILLAS.img, reason:`🌱 Vegano — complemento`,
      cat:"Snack", desc:"Mix artesanal de semillas tostadas. Vegano, keto y sin gluten." });
  }

  // Keto: crudités + semillas (no pan, no azúcar)
  if (keto > 0) {
    items.push({ id:ADDON_CRUDITES.id, n:ADDON_CRUDITES.n, p:ADDON_CRUDITES.p, qty:keto,
      img:ADDON_CRUDITES.img, reason:`🔥 Keto — ${keto} persona${keto>1?"s":""}`,
      cat:"Snack", desc:"Jícama, zanahoria, pepino y apio frescos. Sin carbohidratos." });
    items.push({ id:ADDON_SEMILLAS.id, n:ADDON_SEMILLAS.n, p:ADDON_SEMILLAS.p, qty:keto,
      img:ADDON_SEMILLAS.img, reason:`🔥 Keto — complemento`,
      cat:"Snack", desc:"Mix de semillas naturales. Keto, vegano y sin gluten." });
  }

  // Sin gluten (si no es también keto o vegano, ya cubiertos arriba)
  if (sg > 0) {
    items.push({ id:ADDON_CRUDITES.id, n:ADDON_CRUDITES.n, p:ADDON_CRUDITES.p, qty:sg,
      img:ADDON_CRUDITES.img, reason:`🌾 Sin Gluten — ${sg} persona${sg>1?"s":""}`,
      cat:"Snack", desc:"Crudités frescos. Sin gluten, sin lácteos." });
  }

  return items;
}

// ── Distribución de sin restricción entre formatos ───────────
// Si todos los formatos son el mismo producto → sin split (1 sola card limpia)
// Si hay productos distintos:
//   1-5 personas → 50/50 (2 formatos)
//   6+  personas → 33/33/33 (3 formatos)
// rotIdx rota el orden para que cada cotización sea diferente
function distribuirFormatos(
  sinR: number,
  formatos: BoxDef[],
  rotIdx: number
): { box: BoxDef; qty: number }[] {
  if (sinR <= 0 || formatos.length === 0) return [];

  // Desduplicar formatos por id para saber cuántos son realmente distintos
  const uniqueFormats: BoxDef[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < formatos.length; i++) {
    const f = formatos[(i + rotIdx) % formatos.length];
    if (!seenIds.has(f.id)) { uniqueFormats.push(f); seenIds.add(f.id); }
  }

  // Si solo hay 1 producto único → todo al mismo, sin split
  if (uniqueFormats.length === 1) {
    return [{ box: uniqueFormats[0], qty: sinR }];
  }

  const f0 = uniqueFormats[0];
  const f1 = uniqueFormats[1];
  const f2 = uniqueFormats[2];

  if (sinR <= 5 || uniqueFormats.length < 3) {
    // 50/50 entre los 2 primeros únicos
    const a = Math.ceil(sinR / 2);
    const b = sinR - a;
    const result: { box: BoxDef; qty: number }[] = [{ box: f0, qty: a }];
    if (b > 0) result.push({ box: f1, qty: b });
    return result;
  }

  // 33/33/33 entre los 3 formatos únicos
  const a = Math.ceil(sinR / 3);
  const b = Math.ceil(sinR / 3);
  const c = sinR - a - b;
  const result: { box: BoxDef; qty: number }[] = [
    { box: f0, qty: a },
    { box: f1, qty: b },
  ];
  if (c > 0 && f2) result.push({ box: f2, qty: c });
  return result;
}

// ── Selector Desayuno / Comida ────────────────────────────────
function getBoxItems(
  tabla: Record<string, BoxDef>,
  tier: string,
  ev: string,                // "desayuno" | "comida" para elegir add-ons correctos
  people: number,
  dietaryCounts: {tipo:string;cantidad:number}[],
  targetSub: number,
  sinRProducts?: BoxDef[],
  rotIdx = 0
): RawItem[] {
  const sinR = Math.max(0, people - dietaryCounts.reduce((s,d)=>s+d.cantidad, 0));
  const mainBox = tabla[tier] ?? (sinRProducts?.[0]);

  // Acumular por producto — si vegano+vegetariano mapean al mismo id, fusionar
  const merged = new Map<string, RawItem>();

  const addItem = (box: {id:string;n:string;p:number;img:string;cat:string;desc:string}, q: number, reason: string) => {
    if (merged.has(box.id)) {
      const existing = merged.get(box.id)!;
      existing.qty += q;
      if (!existing.reason.includes(reason)) {
        existing.reason = existing.reason + " + " + reason;
      }
    } else {
      merged.set(box.id, { id:box.id, n:box.n, p:box.p, qty:q, img:box.img, reason, cat:box.cat, desc:box.desc });
    }
  };

  // Calcular costo mínimo de las restricciones para saber cuánto queda para sin restricción
  const costoRestricciones = dietaryCounts.reduce((sum, dc) => {
    const dietBox = (tabla[dc.tipo] as typeof mainBox | undefined) ?? mainBox;
    return sum + dietBox.p * dc.cantidad;
  }, 0);
  const presupuestoRestante = targetSub - costoRestricciones;
  const ppRestante = sinR > 0 ? presupuestoRestante / sinR : 0;

  // Box para sin restricción: selección dinámica por presupuesto real
  if (sinR > 0) {
    if (sinRProducts && sinRProducts.length > 0) {
      const splits = selectSinRProducts(sinRProducts, ppRestante > 0 ? ppRestante : mainBox.p, sinR, rotIdx);
      for (const s of splits) {
        const label = sinR === people
          ? `Para ${s.qty} persona${s.qty > 1 ? "s" : ""}`
          : `Para ${s.qty} persona${s.qty > 1 ? "s" : ""} sin restricción`;
        addItem(s.box, s.qty, label);
      }
    } else {
      addItem(tabla[tier] ?? mainBox, sinR, sinR === people ? `Para ${sinR} personas` : `Para ${sinR} personas sin restricción`);
    }
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
  let left = targetSub - sub;
  if (left >= 480) {
    items.push({ id:BEV_CAFE.id, n:BEV_CAFE.n, p:BEV_CAFE.p, qty:1, img:BEV_CAFE.img, reason:"Bebida caliente del evento", cat:"Bebida", desc:"Café o té para 12 tazas en termo. Se mantiene caliente 3 horas." });
    left -= BEV_CAFE.p;
  } else if (left >= 40 * people) {
    items.push({ id:BEV_AGUA.id, n:BEV_AGUA.n, p:BEV_AGUA.p, qty:people, img:BEV_AGUA.img, reason:"Bebida del evento", cat:"Bebida", desc:"Agua fresca artesanal preparada el mismo día. Sin conservadores." });
    left -= BEV_AGUA.p * people;
  }

  // Experiencia: complemento contextual según tipo de evento
  // Diferencia la experiencia del equilibrado cuando el catálogo toca el techo
  if (tier === "experiencia" && sinR > 0 && left >= 45 * sinR) {
    // Desayuno y working lunch → fruta fresca o yogurt
    // Comida → crudités o mix de semillas (snack ligero post-comida)
    const esDesayuno = ev === "desayuno";
    const addons = esDesayuno
      ? [
          { id:"ensalada-de-fruta",  n:"Ensalada de Fruta",           p:50, img:"https://berlioz.mx/wp-content/uploads/2022/06/berlioz_fabian-51.jpg",   reason:"Complemento gourmet del desayuno", cat:"Add-on", desc:"Fruta fresca de temporada. Ligero y refrescante." },
          { id:"yogurt-organico",    n:"Yogurt Orgánico con granola",  p:50, img:"https://berlioz.mx/wp-content/uploads/2023/03/breakfast-bag.webp",      reason:"Complemento gourmet del desayuno", cat:"Add-on", desc:"Yogurt orgánico con granola artesanal. Vegetariano." },
          { id:"jugo-de-naranja",    n:"Jugo de Naranja (Jus)",        p:60, img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", reason:"Refrescante con el desayuno", cat:"Bebida", desc:"Jugo natural exprimido, 355 ml por persona." },
        ]
      : [
          { id:"crudites-con-limon", n:"Crudités con Limón",           p:50, img:"https://berlioz.mx/wp-content/uploads/2024/04/crudite.jpg",             reason:"Snack ligero post-comida", cat:"Add-on", desc:"Jícama, zanahoria, pepino y apio. Vegano y keto." },
          { id:"mix-de-semillas",    n:"Mix de Semillas Naturales",    p:60, img:"https://berlioz.mx/wp-content/uploads/2020/03/berlioz_fabian-03-scaled.jpg", reason:"Snack energético de cierre", cat:"Add-on", desc:"Mix artesanal tostado. Vegano, keto y sin gluten." },
          { id:"aguas-frescas",      n:"Agua Fresca — Jamaica",        p:45, img:"https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp", reason:"Bebida fresca de temporada", cat:"Bebida", desc:"Agua fresca artesanal, preparada el mismo día." },
        ];
    const addon = addons[rotIdx % addons.length];
    items.push({ ...addon, qty: sinR });
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
  // budgetPP = precio de COMIDA por persona (sin IVA ni envío)
  // El IVA y envío se suman aparte en el desglose final
  // Tiers: esencial 82%, equilibrado 100%, experiencia 122% del presupuesto de comida
  const base = (budgetEnabled && budgetPP > 0) ? budgetPP : 330;

  // Restricciones dietéticas tienen precio fijo (no pueden ajustarse al tier)
  // Calculamos cuánto "cuesta" el grupo de restricciones para dejar headroom correcto
  // El target de comida se aplica solo al presupuesto de comida, sin impuestos
  const targets = {
    esencial:    base * people * 0.82,
    equilibrado: base * people,
    experiencia: base * people * 1.22,
  };

  const ev = eventType.toLowerCase().includes("coffee") ? "coffee"
           : eventType.toLowerCase().includes("desayuno") ? "desayuno"
           : "comida";

  // Rotación aleatoria por solicitud — 3 formatos: pasta / sandwich+pan / ensalada
  // Cada vez que alguien cotiza recibe una selección diferente para sin restricción
  const rotIdx = String(Math.floor(Math.random() * 3)) as "0"|"1"|"2";

  if (ev === "coffee") {
    return {
      esencial:    getCoffeeItems(people, dietaryCounts, targets.esencial,    "esencial"),
      equilibrado: getCoffeeItems(people, dietaryCounts, targets.equilibrado, "equilibrado"),
      experiencia: getCoffeeItems(people, dietaryCounts, targets.experiencia, "experiencia"),
    };
  }

  if (ev === "desayuno") {
    return {
      esencial:    getBoxItems(DESAYUNO, "esencial",    ev, people, dietaryCounts, targets.esencial,    DESAYUNO_SINR, rotIdx),
      equilibrado: getBoxItems(DESAYUNO, "equilibrado", ev, people, dietaryCounts, targets.equilibrado, DESAYUNO_SINR, rotIdx),
      experiencia: getBoxItems(DESAYUNO, "experiencia", ev, people, dietaryCounts, targets.experiencia, DESAYUNO_SINR, rotIdx),
    };
  }

  return {
    esencial:    getBoxItems(COMIDA, "esencial",    ev, people, dietaryCounts, targets.esencial,    COMIDA_SINR, rotIdx),
    equilibrado: getBoxItems(COMIDA, "equilibrado", ev, people, dietaryCounts, targets.equilibrado, COMIDA_SINR, rotIdx),
    experiencia: getBoxItems(COMIDA, "experiencia", ev, people, dietaryCounts, targets.experiencia, COMIDA_SINR, rotIdx),
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
        pricePerPerson: Math.round((sub / Math.max(1, peopleCount)) * 100) / 100,
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
