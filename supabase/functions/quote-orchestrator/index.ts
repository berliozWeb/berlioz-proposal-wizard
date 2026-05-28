import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ═══ TYPES ═══
interface MultiDeliverySlot {
  id: string;
  label: string;
  date: string;
  time: string;
  guests_count: number;
  dietary: {
    sin_restriccion: number;
    vegano: number;
    vegetariano: number;
    sin_gluten: number;
    sin_lactosa: number;
    keto: number;
  };
}

interface QuoteRequest {
  eventType: string;
  peopleCount: number;
  eventDate?: string;
  eventTime?: string;
  deliveryTime?: string;
  zipCode?: string;
  durationHours?: number;
  budgetEnabled?: boolean;
  budgetPerPerson?: number;
  dietaryRestrictions?: string[];
  dietaryCounts?: { tipo: string; cantidad: number }[];
  contactName?: string;
  companyName?: string;
  userId?: string;
  mode?: 'single' | 'multi';
  deliveryGroups?: MultiDeliverySlot[];
  address?: string;
}

interface DbProduct {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  precio_min: number | null;
  precio_max: number | null;
  categoria: string | null;
  tipo: string;
  imagen_url: string | null;
  parent_id: string | null;
  dietary_tags: string[];
  score_comercial: number;
  score_visual: number;
  pricing_model: string;
  serves_up_to: number | null;
  destacado: boolean;
  variantes: string | null;
  /** Only set when source is get-menu-cotizador. Variant-level flag from the canonical menu. */
  es_comida_main?: boolean;
  /** Short product description for the prompt */
  descripcion_corta?: string | null;
}

interface ScoredProduct extends DbProduct {
  finalScore: number;
  recommendationReason: string;
  resolvedImageUrl: string | null;
  imageSource: 'product_image' | 'parent_image' | 'generated_prompt';
  imagePrompt: string | null;
  effectivePrice: number;
}

interface PackageItem {
  productId: string;
  parentProductId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  computedPrice: number;
  score: number;
  recommendationReason: string;
  imageUrl: string | null;
  imageSource: string;
  imagePrompt: string | null;
  sourceType: 'supabase';
  swapGroup: string | null;
  categoria: string | null;
}

interface Package {
  tier: 'esencial' | 'equilibrado' | 'experiencia';
  title: string;
  tagline: string;
  narrativa?: string;
  items: PackageItem[];
  subtotal: number;
  iva: number;
  shipping: number;
  total: number;
  pricePerPerson: number;
  recommendationReason: string;
  rankingScore: number;
  isRecommended: boolean;
  highlights: string[];
  /** Set true when budgetPerPerson was provided but pricePerPerson exceeds it after composition. */
  excedePresupuesto?: boolean;
  /** When excedePresupuesto, this is the absolute over-amount per person. */
  diferenciaPresupuesto?: number;
}

// ═══ CONSTANTS ═══
const BASE_SHIPPING = 360;
const IVA_RATE = 0.16;

// ═══ CATEGORY MAPPING ═══
// First item = PRIMARY category (the "plato fuerte" of la propuesta).
// El resto son COMPLEMENTOS opcionales que sólo se agregan después del principal.
const EVENT_TO_CATEGORIES: Record<string, string[]> = {
  'desayuno': ['Desayuno', 'Bebidas', 'Coffee Break'],
  'coffee-break': ['Coffee Break', 'Bebidas'],
  'working-lunch': ['Working Lunch', 'Bebidas', 'Coffee Break'],
  'comida': ['Working Lunch', 'Bebidas', 'Coffee Break'],
  'capacitacion': ['Working Lunch', 'Desayuno', 'Coffee Break', 'Bebidas'],
  'reunion-ejecutiva': ['Working Lunch', 'Bebidas', 'Coffee Break'],
  'filmacion': ['Working Lunch', 'Coffee Break', 'Bebidas'],
};

// Etiqueta legible para el prompt
const EVENT_LABEL: Record<string, string> = {
  'desayuno': 'DESAYUNO (mañana)',
  'coffee-break': 'COFFEE BREAK',
  'working-lunch': 'COMIDA / WORKING LUNCH',
  'comida': 'COMIDA / WORKING LUNCH',
  'capacitacion': 'CAPACITACIÓN (jornada larga)',
  'reunion-ejecutiva': 'REUNIÓN EJECUTIVA',
  'filmacion': 'FILMACIÓN',
};

const DIETARY_ALIAS_MAP: Record<string, string> = {
  vegetarian: 'vegetariano',
  vegetariana: 'vegetariano',
  vegetariano: 'vegetariano',
  vegan: 'vegano',
  vegana: 'vegano',
  vegano: 'vegano',
  keto: 'keto',
  ketogenic: 'keto',
  sin_gluten: 'sin_gluten',
  'sin gluten': 'sin_gluten',
  gluten_free: 'sin_gluten',
  libre_de_gluten: 'sin_gluten',
  sin_lactosa: 'sin_lactosa',
  'sin lactosa': 'sin_lactosa',
  lactose_free: 'sin_lactosa',
  libre_de_lactosa: 'sin_lactosa',
  sin_lacteos: 'sin_lactosa',
  'sin lacteos': 'sin_lactosa',
};

function normalizeDietaryTag(tag?: string | null): string {
  if (!tag) return '';
  const normalized = tag.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return DIETARY_ALIAS_MAP[normalized] || normalized;
}

function getDietaryCountMap(req: QuoteRequest): Record<string, number> {
  const counts: Record<string, number> = {};

  if (Array.isArray(req.dietaryCounts) && req.dietaryCounts.length > 0) {
    for (const entry of req.dietaryCounts) {
      const key = normalizeDietaryTag(entry.tipo);
      if (!key) continue;
      counts[key] = (counts[key] || 0) + Math.max(0, Math.floor(entry.cantidad || 0));
    }
  }

  if (Object.keys(counts).length === 0 && Array.isArray(req.dietaryRestrictions) && req.dietaryRestrictions.length > 0) {
    for (const restriction of req.dietaryRestrictions) {
      const key = normalizeDietaryTag(restriction);
      if (!key) continue;
      counts[key] = Math.max(counts[key] || 0, req.peopleCount || 0);
    }
  }

  return counts;
}

function getActiveDietaryRestrictions(req: QuoteRequest): string[] {
  return Object.entries(getDietaryCountMap(req))
    .filter(([, count]) => count > 0)
    .map(([restriction]) => restriction);
}

function getProductDietaryTags(product: Pick<DbProduct, 'dietary_tags'>): string[] {
  return (product.dietary_tags || []).map((tag) => normalizeDietaryTag(tag)).filter(Boolean);
}

function productSupportsRestriction(product: Pick<DbProduct, 'dietary_tags'>, restriction: string): boolean {
  const target = normalizeDietaryTag(restriction);
  if (!target) return false;
  return getProductDietaryTags(product).includes(target);
}

function productSupportsAnyRestriction(product: Pick<DbProduct, 'dietary_tags'>, restrictions: string[]): boolean {
  return restrictions.some((restriction) => productSupportsRestriction(product, restriction));
}

function isBeverageCategory(category?: string | null): boolean {
  return category === 'Bebida' || category === 'Bebidas';
}

// ═══ CANONICAL MENU SOURCE — get-menu-cotizador (single source of truth) ═══
const MENU_COTIZADOR_URL =
  'https://rrfvdhegvgmejxmsdijn.supabase.co/functions/v1/get-menu-cotizador';

function isYesFlag(v: unknown): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'sí' || s === 'si';
}

interface RemoteVariante {
  variante_id: string;
  nombre_variante: string | null;
  nombre_display?: string | null;
  precio: number;
  notas_precio?: string | null;
  es_base?: boolean;
  es_comida?: string | null;
  vegetariano?: string | null;
  vegano?: string | null;
  keto?: string | null;
  sin_gluten?: string | null;
  sin_lactosa?: string | null;
  img?: string | null;
}

interface RemoteProducto {
  product_id: string;
  nombre: string;
  categoria: string;
  segunda_categoria?: string | null;
  subcategoria?: string | null;
  tipo?: string;
  desc_mini?: string | null;
  desc_corta?: string | null;
  img_principal?: string | null;
  img_fallback?: string | null;
  galeria?: string[];
  variantes: RemoteVariante[];
}

/**
 * Carga el menú canónico y aplana producto×variante a DbProduct[].
 * Cada variante es un candidato independiente con sus propios flags dietéticos.
 */
async function fetchMenuCotizador(): Promise<DbProduct[]> {
  const res = await fetch(MENU_COTIZADOR_URL, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`get-menu-cotizador responded ${res.status}`);
  }
  const json = await res.json();
  const productos: RemoteProducto[] = Array.isArray(json?.productos) ? json.productos : [];

  const flat: DbProduct[] = [];
  for (const p of productos) {
    const variantes = Array.isArray(p.variantes) ? p.variantes : [];
    const hasMany = variantes.length > 1;
    for (const v of variantes) {
      const tags: string[] = [];
      if (isYesFlag(v.vegetariano)) tags.push('vegetariano');
      if (isYesFlag(v.vegano)) tags.push('vegano');
      if (isYesFlag(v.keto)) tags.push('keto');
      if (isYesFlag(v.sin_gluten)) tags.push('sin_gluten');
      if (isYesFlag(v.sin_lactosa)) tags.push('sin_lactosa');

      const precio = Number(v.precio) || 0;
      const nombre = v.nombre_display
        || (v.nombre_variante ? `${p.nombre} — ${v.nombre_variante}` : p.nombre);

      flat.push({
        id: v.variante_id,
        nombre,
        descripcion: p.desc_corta || p.desc_mini || null,
        descripcion_corta: p.desc_mini || null,
        precio,
        precio_min: precio,
        precio_max: precio,
        categoria: p.categoria,
        tipo: 'simple',
        imagen_url: v.img || p.img_principal || p.img_fallback || null,
        parent_id: hasMany ? p.product_id : null,
        dietary_tags: tags,
        score_comercial: v.es_base ? 70 : 55,
        score_visual: 60,
        pricing_model: 'per_person',
        serves_up_to: null,
        destacado: !!v.es_base,
        variantes: v.nombre_variante || null,
        es_comida_main: isYesFlag(v.es_comida),
      });
    }
  }
  return flat;
}

function isGroupPricedProduct(product: Pick<DbProduct, 'nombre' | 'categoria' | 'precio' | 'precio_min' | 'pricing_model'>): boolean {
  const price = product.precio ?? product.precio_min ?? 0;
  return product.pricing_model === 'per_person'
    && isBeverageCategory(product.categoria)
    && (price >= 500 || /caf[eé]\s*\/\s*t[ée]/i.test(product.nombre));
}

function getDefaultQuantity(product: Pick<DbProduct, 'nombre' | 'categoria' | 'precio' | 'precio_min' | 'pricing_model' | 'serves_up_to'>, people: number): number {
  if (product.pricing_model !== 'per_person') {
    if (product.serves_up_to && product.serves_up_to > 0) {
      return Math.max(1, Math.ceil(people / product.serves_up_to));
    }
    return 1;
  }

  if (isGroupPricedProduct(product)) {
    return 1;
  }

  return people;
}

function getTierPriceCap(req: QuoteRequest, tier: 'esencial' | 'equilibrado' | 'experiencia'): number | null {
  if (!req.budgetEnabled || !req.budgetPerPerson || req.budgetPerPerson <= 0) return null;
  if (tier === 'esencial') return Math.round(req.budgetPerPerson * 0.85 * 100) / 100;
  if (tier === 'equilibrado') return Math.round(req.budgetPerPerson * 100) / 100;
  return Math.round(req.budgetPerPerson * 1.25 * 100) / 100;
}

// ═══ HEURISTIC SCORING ENGINE (FALLBACK) ═══
function scoreProduct(
  product: DbProduct,
  req: QuoteRequest,
  tier: 'esencial' | 'equilibrado' | 'experiencia'
): { score: number; reason: string } {
  let score = product.score_comercial || 50;
  const reasons: string[] = [];
  const price = product.precio ?? product.precio_min ?? 0;

  if (req.budgetEnabled && req.budgetPerPerson) {
    const budget = req.budgetPerPerson;
    if (tier === 'esencial') {
      if (price <= budget * 0.7) { score += 20; reasons.push('Dentro del presupuesto'); }
      else if (price <= budget) { score += 10; }
      else { score -= 20; }
    } else if (tier === 'equilibrado') {
      if (price >= budget * 0.8 && price <= budget * 1.2) { score += 15; reasons.push('Balance ideal costo/calidad'); }
    } else {
      if (price >= budget) { score += 10; reasons.push('Experiencia premium'); }
    }
  } else {
    if (tier === 'esencial' && price <= 200) { score += 15; reasons.push('Opción económica'); }
    else if (tier === 'equilibrado' && price >= 250 && price <= 400) { score += 15; reasons.push('Mejor relación calidad-precio'); }
    else if (tier === 'experiencia' && price >= 350) { score += 15; reasons.push('Calidad premium'); }
  }

  if (product.destacado) { score += 10; reasons.push('Producto destacado'); }
  if (product.imagen_url) { score += 5; }
  if ((product.score_visual || 50) > 70) { score += 5; reasons.push('Presentación visual excelente'); }

  if (req.dietaryRestrictions?.length) {
    const tags = product.dietary_tags || [];
    const matches = req.dietaryRestrictions.filter(r =>
      tags.some(t => t.toLowerCase().includes(r.toLowerCase()))
    );
    if (matches.length > 0) { score += 15; reasons.push(`Compatible con: ${matches.join(', ')}`); }
  }

  if (req.eventTime) {
    const hour = parseInt(req.eventTime.split(':')[0]);
    const cat = (product.categoria || '').toLowerCase();
    if (hour < 10 && cat.includes('desayuno')) { score += 10; reasons.push('Ideal para la mañana'); }
    if (hour >= 12 && (cat.includes('lunch') || cat.includes('working'))) { score += 10; reasons.push('Perfecto para la hora de comida'); }
  }

  if (req.durationHours && req.durationHours < 2 && (product.categoria === 'Bebidas' || product.categoria === 'Coffee Break')) {
    score += 10;
  }

  return { score: Math.min(100, Math.max(0, score)), reason: reasons.length > 0 ? reasons.join(' · ') : 'Selección del catálogo Berlioz' };
}

// ═══ IMAGE RESOLUTION ═══
function resolveImage(product: DbProduct, parentProducts: Map<string, DbProduct>): {
  url: string | null;
  source: 'product_image' | 'parent_image' | 'generated_prompt';
  prompt: string | null;
} {
  if (product.imagen_url) return { url: product.imagen_url, source: 'product_image', prompt: null };
  if (product.parent_id) {
    const parent = parentProducts.get(product.parent_id);
    if (parent?.imagen_url) return { url: parent.imagen_url, source: 'parent_image', prompt: null };
  }
  return { url: null, source: 'generated_prompt', prompt: `Fotografía gastronómica profesional de ${product.nombre}` };
}

// ═══ HEURISTIC PACKAGE COMPOSER (FALLBACK) ═══
function composePackageHeuristic(
  tier: 'esencial' | 'equilibrado' | 'experiencia',
  products: ScoredProduct[],
  req: QuoteRequest,
): Package {
  const people = req.peopleCount;
  const mainCategories = EVENT_TO_CATEGORIES[req.eventType] || ['Working Lunch', 'Bebidas'];
  const tierConfig = {
    esencial: { maxItems: 2, includeBeverage: false, title: 'Esencial', tagline: 'Lo necesario, bien ejecutado' },
    equilibrado: { maxItems: 4, includeBeverage: true, title: 'Equilibrado', tagline: 'La experiencia que tu equipo merece' },
    experiencia: { maxItems: 5, includeBeverage: true, title: 'Experiencia Completa', tagline: 'Cada detalle cuenta' },
  }[tier];

  const primaryCat = mainCategories[0];
  const mainProducts = products.filter(p => p.categoria === primaryCat).sort((a, b) => b.finalScore - a.finalScore);

  const items: PackageItem[] = [];
  const usedProducts = new Set<string>();

  if (mainProducts.length > 0) {
    const pickIndex = tier === 'esencial' ? Math.min(mainProducts.length - 1, Math.floor(mainProducts.length * 0.7))
      : tier === 'equilibrado' ? Math.min(mainProducts.length - 1, Math.floor(mainProducts.length * 0.3))
      : 0;
    const main = mainProducts[pickIndex] || mainProducts[0];
    const qty = getDefaultQuantity(main, people);
    items.push({
      productId: main.id, parentProductId: main.parent_id, productName: main.nombre,
      quantity: qty, unitPrice: main.effectivePrice,
      computedPrice: main.effectivePrice * qty,
      score: main.finalScore, recommendationReason: main.recommendationReason,
      imageUrl: main.resolvedImageUrl, imageSource: main.imageSource, imagePrompt: main.imagePrompt,
      sourceType: 'supabase', swapGroup: main.categoria, categoria: main.categoria,
    });
    usedProducts.add(main.id);
  }

  if (tierConfig.includeBeverage) {
    const beverages = products.filter(p => p.categoria === 'Bebidas' && !usedProducts.has(p.id)).sort((a, b) => b.finalScore - a.finalScore);
    if (beverages.length > 0) {
      const bev = tier === 'experiencia' ? beverages[0] : beverages[Math.min(1, beverages.length - 1)];
      const qty = bev.pricing_model === 'per_person' && !isGroupPricedProduct(bev)
        ? people
        : getDefaultQuantity(bev, people);
      items.push({
        productId: bev.id, parentProductId: bev.parent_id, productName: bev.nombre,
        quantity: qty, unitPrice: bev.effectivePrice,
        computedPrice: bev.effectivePrice * qty,
        score: bev.finalScore, recommendationReason: 'Bebida incluida en el paquete',
        imageUrl: bev.resolvedImageUrl, imageSource: bev.imageSource, imagePrompt: bev.imagePrompt,
        sourceType: 'supabase', swapGroup: 'Bebidas', categoria: bev.categoria,
      });
      usedProducts.add(bev.id);
    }
  }

  const remaining = tierConfig.maxItems - items.length;
  if (remaining > 0) {
    const complementary = products.filter(p => !usedProducts.has(p.id) && p.categoria !== primaryCat)
      .sort((a, b) => b.finalScore - a.finalScore).slice(0, remaining);
    for (const comp of complementary) {
      const isSurtido = comp.nombre.toLowerCase().includes('surtido');
      const qty = comp.pricing_model === 'per_person'
        ? getDefaultQuantity(comp, people)
        : isSurtido ? Math.ceil(people / 7) : 1;
      items.push({
        productId: comp.id, parentProductId: comp.parent_id, productName: comp.nombre,
        quantity: qty, unitPrice: comp.effectivePrice, computedPrice: comp.effectivePrice * qty,
        score: comp.finalScore, recommendationReason: comp.recommendationReason,
        imageUrl: comp.resolvedImageUrl, imageSource: comp.imageSource, imagePrompt: comp.imagePrompt,
        sourceType: 'supabase', swapGroup: comp.categoria, categoria: comp.categoria,
      });
      usedProducts.add(comp.id);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.computedPrice, 0);
  const base = subtotal + BASE_SHIPPING;
  const iva = Math.round(base * IVA_RATE * 100) / 100;
  const total = Math.round((base + iva) * 100) / 100;

  const highlights = {
    esencial: ['Entrega puntual garantizada', 'Precio optimizado', 'Calidad Berlioz'],
    equilibrado: ['Bebidas incluidas', 'Variedad premium', 'Presentación profesional'],
    experiencia: ['Bebidas premium', 'Productos gourmet top-tier', 'Experiencia completa'],
  }[tier];

  return {
    tier, title: tierConfig.title, tagline: tierConfig.tagline, items, subtotal, iva, shipping: BASE_SHIPPING, total,
    pricePerPerson: Math.round((total / people) * 100) / 100,
    recommendationReason: tier === 'equilibrado' ? '8 de cada 10 clientes eligen este paquete.' : tier === 'esencial' ? 'Propuesta funcional al mejor precio.' : 'Experiencia gastronómica completa.',
    rankingScore: tier === 'equilibrado' ? 90 : tier === 'experiencia' ? 80 : 70,
    isRecommended: tier === 'equilibrado',
    highlights,
  };
}

// ═══ PRICE DIFFERENTIATION ═══
function ensureDifferentiation(packages: Package[], people: number) {
  const [esencial, equilibrado, experiencia] = packages;
  if (!esencial || !equilibrado || !experiencia) return;

  if (esencial.total >= equilibrado.total * 0.85) {
    const scale = (equilibrado.total * 0.65) / esencial.total;
    esencial.items.forEach(i => { i.computedPrice = Math.round(i.computedPrice * scale); i.unitPrice = Math.round(i.unitPrice * scale); });
    recalc(esencial, people);
  }
  if (experiencia.total <= equilibrado.total * 1.15) {
    const scale = (equilibrado.total * 1.35) / experiencia.total;
    experiencia.items.forEach(i => { i.computedPrice = Math.round(i.computedPrice * scale); i.unitPrice = Math.round(i.unitPrice * scale); });
    recalc(experiencia, people);
  }
}

function recalc(pkg: Package, people: number) {
  pkg.subtotal = pkg.items.reduce((s, i) => s + i.computedPrice, 0);
  const base = pkg.subtotal + pkg.shipping;
  pkg.iva = Math.round(base * IVA_RATE * 100) / 100;
  pkg.total = Math.round((base + pkg.iva) * 100) / 100;
  pkg.pricePerPerson = Math.round((pkg.total / people) * 100) / 100;
}

// ═══ CLAUDE AI COMPOSITION ═══
interface ClaudePackageSpec {
  tier: string;
  tagline: string;
  narrativa: string;
  selectedProductIds: string[];
  productReasons: Record<string, string>;
  /** Optional explicit quantities per productId. If omitted, system uses pricing_model defaults. */
  productQuantities?: Record<string, number>;
}

async function composeWithClaude(
  products: ScoredProduct[],
  req: QuoteRequest,
  feedbackSummary: string,
): Promise<ClaudePackageSpec[] | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set, skipping Claude composition");
    return null;
  }

  // Categoría primaria del evento (definida arriba para poder restringir el catálogo expuesto a Claude).
  const eventCategories = EVENT_TO_CATEGORIES[req.eventType] || ['Comida', 'Bebida'];
  const primaryCategory = eventCategories[0];
  const secondaryCategories = eventCategories.slice(1);
  const requireMainFood = primaryCategory === 'Desayuno' || primaryCategory === 'Comida' || primaryCategory === 'Working Lunch';

  // Heurística para detectar productos en formato GRUPAL (cajas/surtidos/paquetes que ya sirven a X personas).
  // En tier EXPERIENCIA queremos preferir porciones INDIVIDUALES para no duplicar el rendimiento.
  const BULK_REGEX = /\b(surtido|surtidos|caja|cajas|bandeja|bandejas|paquete|paquetes|box|combo|kit|charola|fuente|para\s*\d+|x\s*\d+|\d+\s*(pzas|piezas|personas|pax))\b/i;
  const isBulkProduct = (p: { nombre: string; precio: number }) =>
    BULK_REGEX.test(p.nombre) || p.precio >= 800;

  // Restringimos el catálogo expuesto a Claude SOLO a la categoría primaria del evento + Bebidas.
  // Esto evita que aparezcan "crudités de Working Lunch" en un Desayuno, etc.
  const allowedCategoriesForLLM = new Set<string>([primaryCategory, 'Bebidas', 'Bebida']);
  const catalog = products
    .filter(p => allowedCategoriesForLLM.has(p.categoria || ''))
    .slice(0, 80)
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.effectivePrice,
      categoria: p.categoria,
      descripcion: (p.descripcion || '').slice(0, 80),
      pricing_model: p.pricing_model,
      score: p.finalScore,
      destacado: p.destacado,
      dietary_tags: p.dietary_tags || [],
      is_bulk: isBulkProduct({ nombre: p.nombre, precio: p.effectivePrice }),
    }));

  // Precompute compatible products per dietary restriction so Claude doesn't pick incompatible items
  // (e.g. fruta etiquetada como vegano pero NO keto cuando piden keto).
  const dietaryWhitelists: Record<string, { id: string; nombre: string; precio: number; categoria: string | null }[]> = {};
  const activeRestrictions = getActiveDietaryRestrictions(req);
  for (const r of activeRestrictions) {
    const rl = normalizeDietaryTag(r);
    dietaryWhitelists[r] = products
      .filter(p => productSupportsRestriction(p, rl))
      .slice(0, 25)
      .map(p => ({ id: p.id, nombre: p.nombre, precio: p.effectivePrice, categoria: p.categoria }));
  }

  // Precompute los mejores candidatos PRINCIPALES. Para Desayuno/Comida exigimos que sean PLATO
  // PRINCIPAL (variante.es_comida === "Sí" en el menú canónico), así Claude no propone frutas/
  // yogurt/snacks como principal cuando hay chilaquiles.
  const isMainFoodOK = (p: ScoredProduct) =>
    !requireMainFood || p.es_comida_main === true || p.es_comida_main === undefined;

  let primaryPool = products.filter(p => p.categoria === primaryCategory && isMainFoodOK(p));
  if (primaryPool.length === 0) {
    // Fallback: si nadie está marcado como principal, abre a toda la categoría
    primaryPool = products.filter(p => p.categoria === primaryCategory);
  }
  const primaryCandidates = primaryPool
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 12)
    .map(p => ({ id: p.id, nombre: p.nombre, precio: p.effectivePrice, score: p.finalScore }));

  // Variantes principales que cubren cada restricción dietética (mismo nivel que el principal regular)
  const primaryDietaryCandidates: Record<string, { id: string; nombre: string; precio: number }[]> = {};
  for (const r of activeRestrictions) {
    primaryDietaryCandidates[r] = products
      .filter(p => p.categoria === primaryCategory && isMainFoodOK(p) && productSupportsRestriction(p, normalizeDietaryTag(r)))
      .slice(0, 6)
      .map(p => ({ id: p.id, nombre: p.nombre, precio: p.effectivePrice }));
  }

  const isMulti = req.mode === 'multi' && Array.isArray(req.deliveryGroups) && req.deliveryGroups.length > 0;

  const multiInstruction = isMulti
    ? `\n\nMODO MULTI-ENTREGA:\nEl cliente tiene un evento con varias entregas. Para cada entrega genera una propuesta de menú independiente considerando la fecha, hora, número de personas y restricciones alimentarias de ese slot específico. Presenta las propuestas organizadas por entrega con su título (Entrega 1 — Día 1, etc.).`
    : '';

  const systemPrompt = `Eres el cotizador de Berlioz Catering Corporativo, empresa franco-mexicana de catering gourmet para clientes corporativos en CDMX (EY México, DHL, PepsiCo, Thomson Reuters, Maersk).

== ORDEN DE SELECCIÓN — OBLIGATORIO Y ESTRICTO ==

Componer cada tier sigue SIEMPRE este orden, sin excepción:

1) PLATO PRINCIPAL según el tipo de evento (esto es lo PRIMERO que eliges):
   - DESAYUNO    → categoria "Desayuno"     (ej: Chilaquiles, Breakfast in Roma, huevos, omelettes, molletes). NUNCA arranques con fruta o yogurt como principal.
   - COFFEE BREAK→ categoria "Coffee Break" (ej: surtidos, panes, snacks gourmet).
   - COMIDA / WORKING LUNCH → categoria "Working Lunch" (ej: bowls, sándwiches, ensaladas con proteína, boxes).
   - CAPACITACIÓN→ Working Lunch como principal + Desayuno o Coffee Break como secundario.
   - REUNIÓN EJECUTIVA / FILMACIÓN → Working Lunch como principal.

   El principal SIEMPRE debe pertenecer a la categoría primaria del evento. La selección se hace del bloque "TOP CANDIDATOS PRINCIPALES" que recibes en el user prompt — esos son los que tienen mejor score_comercial y son los que el cliente espera ver. Prefiere los primeros de esa lista antes que cualquier otro.

2) DISTRIBUCIÓN POR RESTRICCIONES DIETÉTICAS sobre el plato principal:
   - Si hay 8 personas y 1 vegano + 1 keto, entonces NO son "8 vegetarianos". Son 6 normales + 1 vegano + 1 keto.
   - El item principal regular va con qty = (personas - personas con restricción).
   - Para cada restricción, agrega su VARIANTE PRINCIPAL equivalente (también de la categoría primaria) con qty = personas con esa restricción. Usa el bloque "VARIANTES PRINCIPALES POR RESTRICCIÓN" del user prompt.
   - Sólo si NO existe una variante principal dietética, recurre a la WHITELIST dietética general.

3) BEBIDA del evento:
   - Agua, café o jugo según el tipo. Cantidad = total de personas (compartido).

4) ADD-ONS / COMPLEMENTOS (snacks, postres, surtidos, fruta):
   - SÓLO después de cumplir 1-3. Son la última prioridad y solo si el tier permite más items.
   - En ESENCIAL casi nunca van; en EQUILIBRADO máximo 1; en EXPERIENCIA hasta 2.
   - 🚫 PROHIBIDO usar como complemento productos de OTRA categoría que no sea la primaria o "Bebidas". Ejemplos: NO agregues "Crudités con hummus" (Working Lunch) en un Desayuno; NO agregues snacks/surtidos de Coffee Break en una Comida si la primaria es Working Lunch. Si necesitas un add-on debe ser de la MISMA categoría primaria o una bebida.
   - 🚫 PROHIBIDO en EXPERIENCIA usar productos en formato GRUPAL (is_bulk=true: surtidos, cajas, bandejas, paquetes "para 10", "x 12", combos, kits) cuando el grupo es pequeño (<= 20 personas). Para EXPERIENCIA con grupos chicos prefiere SIEMPRE porciones INDIVIDUALES (per_person=true, is_bulk=false) multiplicadas por personas. Un paquete diseñado para 10 personas + 10 individuales = duplicación de comida y se rechaza.

EJEMPLO CORRECTO desayuno 8 personas (1 vegano):
  ✅ 7× Chilaquiles Verdes + 1× Chilaquiles Veganos + 8× Café Berlioz + (opcional) 1× Fruta de Temporada como add-on.
EJEMPLO INCORRECTO (NUNCA hagas esto):
  ❌ 1× Ensalada de Frutas + 1× Yogurt + 8× Agua. Falta el principal de desayuno (chilaquiles/huevos).
  ❌ Para 10 personas en EXPERIENCIA: 1× Surtido Premium (para 10) + 10× Sandwich individual. Es comida duplicada — elige solo individuales.

== PRESUPUESTO — REGLA MÁS IMPORTANTE ==

El cliente indica un budget_per_person en MXN. Este número incluye comida, envío e IVA. Para calcular cuánto puedes gastar en comida:

  subtotal_comida_max = (budget_per_person × people_count - 360) / 1.16

El tier EQUILIBRADO debe tener un subtotal de comida lo más cercano posible a ese número. NUNCA lo excedas más del 10%.

El tier ESENCIAL debe estar 20-30% por debajo de ese subtotal.

El tier EXPERIENCIA puede estar hasta 25% por encima, pero jamás más del 50% sobre el subtotal_comida_max.

Si un producto tiene precio de servicio grupal (como Café/Té Berlioz a $540), inclúyelo con cantidad 1, no multipliques por número de personas. Su precio ya cubre al grupo completo.

== RESTRICCIONES ALIMENTARIAS — OBLIGATORIO ==

Si el cliente declara restricciones, TODOS los productos asignados deben respetarlas usando los dietary_tags de cada producto:

- vegano → solo productos con tag "vegano"

- vegetariano → solo productos con tag "vegetariano"

- sin_gluten → solo productos con tag "sin_gluten"

- sin_lactosa → solo productos con tag "sin_lactosa"

- keto → solo productos con tag "keto"

NUNCA incluyas un producto con carne, lácteos o gluten para personas con restricción. La distribución de personas especifica exactamente cuántas tienen cada restricción — respeta esos números en cantidades.

== ESTRUCTURA DE LOS 3 TIERS ==

ESENCIAL: 2-3 productos. Principal de la categoría primaria + bebida. Funcional y económico. Sin add-ons.

EQUILIBRADO: 3-4 productos. Principal (con sus variantes dietéticas) + bebida + máximo 1 add-on. La opción recomendada.

EXPERIENCIA: 4-5 productos. Principal (con variantes dietéticas) + bebida premium + hasta 2 add-ons (postre, snack o surtido). Premium.

== REGLAS BERLIOZ ==

- IVA: 16% sobre subtotal de comida

- Envío base: $360 (fijo para CDMX)

- Mínimo sábado: $3,000 + IVA

- Mínimo domingo/festivo: $5,000 + IVA

- Recargo antes de 7:30am: $290

- Pedido mínimo: 4 personas

- Vigencia: 20 días

- Los nombres de productos deben coincidir exactamente con el catálogo

== CALIDAD ==

Prioriza productos con mayor score_comercial DENTRO de la categoría primaria. NUNCA propongas un item de otra categoría antes que un principal disponible. Respeta literalmente las respuestas del formulario (tipo de evento, distribución dietética, hora, presupuesto).

Responde ÚNICAMENTE con el JSON especificado. Sin texto fuera del JSON.`;

  const multiBlock = isMulti
    ? `\nENTREGAS (${req.deliveryGroups!.length}):\n${JSON.stringify(req.deliveryGroups, null, 2)}\nDirección global: ${req.address || 'sin definir'}\n`
    : '';

  const budgetPerPerson = req.budgetPerPerson || 0;
  const totalDisponible = budgetPerPerson * req.peopleCount;
  const subtotalComidaMax = Math.round((totalDisponible - 360) / 1.16);
  const contextoPedido = `=== CONTEXTO DEL PEDIDO ===
Personas totales: ${req.peopleCount}
Presupuesto por persona: $${budgetPerPerson} MXN
Restricciones alimentarias declaradas: ${JSON.stringify(req.dietaryRestrictions || [])}

CÁLCULO DE PRESUPUESTO:
- Total disponible: $${totalDisponible} MXN
- Envío fijo: $360 MXN
- Subtotal máximo de comida: $${subtotalComidaMax} MXN
- El tier EQUILIBRADO debe estar lo más cerca posible a ese subtotal.

RESTRICCIÓN ABSOLUTA:
Solo puedes proponer productos que tengan en su campo dietary_tags los tags correspondientes a las restricciones declaradas.
Los dietary_tags de cada producto están incluidos en el catálogo que recibes abajo.
=== FIN CONTEXTO ===

`;

  const primaryBlock = `\n=== CATEGORÍA PRIMARIA DEL EVENTO ===
Tipo de evento: ${EVENT_LABEL[req.eventType] || req.eventType}
Categoría primaria OBLIGATORIA para el plato principal: "${primaryCategory}"
Categorías secundarias permitidas (sólo como complemento): ${secondaryCategories.map(c => `"${c}"`).join(', ') || '(ninguna)'}

TOP CANDIDATOS PRINCIPALES (categoria="${primaryCategory}", ordenados por score_comercial — elige el principal de aquí):
${primaryCandidates.length > 0
    ? primaryCandidates.map((p, i) => `  ${i + 1}. ${p.id} = ${p.nombre} ($${p.precio}, score ${p.score})`).join('\n')
    : '  ⚠️ No hay candidatos principales de esta categoría; usa la mejor alternativa secundaria y anótalo.'}
${activeRestrictions.length > 0 ? `
VARIANTES PRINCIPALES POR RESTRICCIÓN (mismo principal, versión dietética — preferir antes que sustitutos de otras categorías):
${activeRestrictions.map(r => {
  const list = primaryDietaryCandidates[r] || [];
  if (list.length === 0) return `  • ${r}: (sin variante principal — usa la WHITELIST dietética general más abajo)`;
  return `  • ${r}: ${list.map(p => `${p.id}=${p.nombre} ($${p.precio})`).join(' | ')}`;
}).join('\n')}` : ''}
=== FIN CATEGORÍA PRIMARIA ===
`;

  const userPrompt = contextoPedido + primaryBlock + `EVENTO:
- Tipo: ${req.eventType}
- Personas: ${req.peopleCount}
- Fecha: ${req.eventDate || 'sin definir'}
- Hora: ${req.eventTime || 'sin definir'}
- Duración: ${req.durationHours || 'sin definir'} horas
- Presupuesto: ${req.budgetEnabled ? '$' + req.budgetPerPerson + '/persona' : 'sin restricción'}
- Dieta: ${(() => {
    const counts = req.dietaryCounts || [];
    if (counts.length === 0) return 'ninguna';
    const total = req.peopleCount;
    const used = counts.reduce((s, c) => s + (c.cantidad || 0), 0);
    const normales = Math.max(0, total - used);
    const parts = counts.filter(c => c.cantidad > 0).map(c => `${c.cantidad} ${c.tipo}`);
    if (normales > 0) parts.push(`${normales} sin restricción`);
    const dietaryInstructions = counts.filter(c => c.cantidad > 0).map(c =>
      `   • ${c.cantidad} producto(s) con dietary_tags que contenga "${c.tipo}" (qty=${c.cantidad} en productQuantities)`
    ).join('\n');
    return `DISTRIBUCIÓN PARCIAL OBLIGATORIA — ${parts.join(', ')}.
   ⚠️ ACCIÓN REQUERIDA — para CADA tier debes incluir en selectedProductIds:
${dietaryInstructions}
   • El item PRINCIPAL normal (ej: BREAKFAST IN ROMA) con qty=${normales} (sin restricción)
   • Bebidas/snacks compartidos van por el total ${total}
   Ejemplo: si hay 1 vegano + 1 sin_gluten en 16 personas → 14 BREAKFAST normal + 1 BREAKFAST VEGETARIAN + 1 opción sin gluten + bebidas x16.
   USA productQuantities OBLIGATORIAMENTE para fijar las cantidades exactas.`;
  })()}
${req.budgetEnabled && req.budgetPerPerson ? `\n- 🚨 LÍMITE DURO DE PRESUPUESTO: el cliente fijó $${req.budgetPerPerson}/persona (IVA y envío incluidos).
   • EQUILIBRADO: pricePerPerson DEBE ser <= $${req.budgetPerPerson}. Si tu selección excede, elimina el item más caro o cámbialo por uno barato del catálogo.
   • ESENCIAL: debe ser <= $${Math.round(req.budgetPerPerson * 0.85)} (15% bajo el presupuesto).
   • EXPERIENCIA: puede llegar a $${Math.round(req.budgetPerPerson * 1.25)} máximo (no más).
   Cálculo aproximado: (suma de precio*qty) / personas + (360+IVA)/personas. Para ${req.peopleCount} personas el envío+IVA por persona ≈ $${Math.round((360 * 1.16) / req.peopleCount)}.` : ''}
${multiBlock}
${activeRestrictions.length > 0 ? `\nWHITELIST DIETÉTICA — únicos IDs válidos por restricción (no inventes ni uses otros para esa restricción):
${activeRestrictions.map(r => {
  const list = dietaryWhitelists[r] || [];
  if (list.length === 0) return `• ${r}: ⚠️ catálogo sin opciones compatibles — omite este subgrupo y anótalo en productReasons.`;
  return `• ${r} (${list.length} opciones): ${list.map(p => `${p.id}=${p.nombre} ($${p.precio})`).join(' | ')}`;
}).join('\n')}\n` : ''}
${feedbackSummary ? `HISTORIAL DE PREFERENCIAS:\n${feedbackSummary}\n` : ''}
CANDIDATOS DEL CATÁLOGO (${catalog.length} productos):
${JSON.stringify(catalog)}

Compón 3 paquetes: Esencial (económico), Equilibrado (balance), Experiencia (premium).`;

  try {
    console.log('quote-orchestrator system prompt v2 activo');
    console.log('USER MESSAGE SNIPPET:', userPrompt?.substring(0, 500));
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", response.status, errText);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      console.warn("No text in Claude response");
      return null;
    }

    // Parse JSON — handle potential markdown wrapping
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    return parsed.packages as ClaudePackageSpec[];
  } catch (err) {
    console.error("Claude composition error:", err);
    return null;
  }
}

// ═══ BUILD PACKAGE FROM CLAUDE SPEC ═══
function buildPackageFromClaude(
  spec: ClaudePackageSpec,
  productMap: Map<string, ScoredProduct>,
  people: number,
): Package {
  const tier = spec.tier as 'esencial' | 'equilibrado' | 'experiencia';
  const titles = {
    esencial: 'Esencial',
    equilibrado: 'Equilibrado',
    experiencia: 'Experiencia Completa',
  };

  const items: PackageItem[] = [];
  const seen = new Map<string, number>(); // productId -> items index
  const uniqueIds = Array.from(new Set(spec.selectedProductIds));
  for (const productId of uniqueIds) {
    const product = productMap.get(productId);
    if (!product) continue;

    const overrideQty = spec.productQuantities?.[productId];
    const qty = typeof overrideQty === 'number' && overrideQty > 0
      ? overrideQty
      : getDefaultQuantity(product, people);
    const reason = spec.productReasons?.[productId] || product.recommendationReason;
    if (seen.has(productId)) {
      const idx = seen.get(productId)!;
      items[idx].quantity += qty;
      items[idx].computedPrice = items[idx].unitPrice * items[idx].quantity;
      continue;
    }
    seen.set(productId, items.length);
    items.push({
      productId: product.id,
      parentProductId: product.parent_id,
      productName: product.nombre,
      quantity: qty,
      unitPrice: product.effectivePrice,
      computedPrice: product.effectivePrice * qty,
      score: product.finalScore,
      recommendationReason: reason,
      imageUrl: product.resolvedImageUrl,
      imageSource: product.imageSource,
      imagePrompt: product.imagePrompt,
      sourceType: 'supabase',
      swapGroup: product.categoria,
      categoria: product.categoria,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.computedPrice, 0);
  const base = subtotal + BASE_SHIPPING;
  const iva = Math.round(base * IVA_RATE * 100) / 100;
  const total = Math.round((base + iva) * 100) / 100;

  return {
    tier,
    title: titles[tier],
    tagline: spec.tagline,
    narrativa: spec.narrativa,
    items,
    subtotal,
    iva,
    shipping: BASE_SHIPPING,
    total,
    pricePerPerson: Math.round((total / people) * 100) / 100,
    recommendationReason: tier === 'equilibrado'
      ? '8 de cada 10 clientes eligen este paquete.'
      : tier === 'esencial'
        ? 'Propuesta funcional al mejor precio.'
        : 'Experiencia gastronómica completa.',
    rankingScore: tier === 'equilibrado' ? 90 : tier === 'experiencia' ? 80 : 70,
    isRecommended: tier === 'equilibrado',
    highlights: [],
  };
}

function packageIncludesRequiredDietaryCoverage(
  pkg: Package,
  req: QuoteRequest,
  productMap: Map<string, ScoredProduct>,
): boolean {
  const activeRestrictions = Object.entries(getDietaryCountMap(req)).filter(([, count]) => count > 0);
  if (activeRestrictions.length === 0) return true;

  return activeRestrictions.every(([restriction, requiredCount]) => {
    const coveredQty = pkg.items.reduce((sum, item) => {
      if (isBeverageCategory(item.categoria)) return sum;
      const product = productMap.get(item.productId);
      if (!product || !productSupportsRestriction(product, restriction)) return sum;
      return sum + item.quantity;
    }, 0);
    return coveredQty >= requiredCount;
  });
}

function packageIncludesNormalCoverage(
  pkg: Package,
  req: QuoteRequest,
  productMap: Map<string, ScoredProduct>,
): boolean {
  const activeRestrictions = Object.entries(getDietaryCountMap(req)).filter(([, count]) => count > 0);
  if (activeRestrictions.length === 0) return true;

  const normalRequired = Math.max(0, req.peopleCount - activeRestrictions.reduce((sum, [, count]) => sum + count, 0));
  if (normalRequired === 0) return true;

  const restrictionNames = activeRestrictions.map(([restriction]) => restriction);
  const normalQty = pkg.items.reduce((sum, item) => {
    if (isBeverageCategory(item.categoria)) return sum;
    const product = productMap.get(item.productId);
    if (!product) return sum;
    if (product.pricing_model !== 'per_person' || isGroupPricedProduct(product)) return sum;
    if (productSupportsAnyRestriction(product, restrictionNames)) return sum;
    return sum + item.quantity;
  }, 0);

  return normalQty >= normalRequired;
}

function packageFitsTierBudget(pkg: Package, req: QuoteRequest): boolean {
  const cap = getTierPriceCap(req, pkg.tier);
  return cap === null || pkg.pricePerPerson <= cap + 0.01;
}

function sanitizePackageForRequest(
  pkg: Package,
  req: QuoteRequest,
  productMap: Map<string, ScoredProduct>,
): Package {
  const countMap = getDietaryCountMap(req);
  const activeRestrictions = Object.entries(countMap).filter(([, count]) => count > 0);
  if (activeRestrictions.length === 0) return pkg;

  const restrictionNames = activeRestrictions.map(([restriction]) => restriction);
  const categoryPriority = EVENT_TO_CATEGORIES[req.eventType] || [];
  const existingItemsByProductId = new Map(pkg.items.map((item) => [item.productId, item]));
  const assignableItems = Array.from(productMap.values())
    .filter((product) => {
      if (isBeverageCategory(product.categoria)) return false;
      if (product.pricing_model !== 'per_person' || isGroupPricedProduct(product)) return false;
      return product.effectivePrice > 0;
    })
    .map((product) => ({ item: existingItemsByProductId.get(product.id), product }));

  if (assignableItems.length === 0) return pkg;

  const assignedQuantities = new Map<string, number>();
  const reservedProductIds = new Set<string>();
  const addAssignedQuantity = (productId: string, quantity: number) => {
    assignedQuantities.set(productId, (assignedQuantities.get(productId) || 0) + quantity);
  };
  const rankCandidate = (
    candidate: { item?: PackageItem; product: ScoredProduct },
    restriction?: string,
  ) => {
    const { item, product } = candidate;
    const categoryIndex = categoryPriority.indexOf(product.categoria || '');
    const categoryBoost = categoryIndex >= 0 ? (categoryPriority.length - categoryIndex) * 100 : 0;
    const supportsCount = restrictionNames.filter((name) => productSupportsRestriction(product, name)).length;
    return categoryBoost
      + (restriction && productSupportsRestriction(product, restriction) ? 1000 : 0)
      + (!restriction && !productSupportsAnyRestriction(product, restrictionNames) ? 500 : 0)
      + (product.categoria === 'Vegano / Vegetariano' ? 60 : 0)
      + (item ? Math.min(item.quantity, req.peopleCount) + 120 : 0)
      + product.finalScore
      - supportsCount * 10;
  };

  for (const [restriction, requiredCount] of activeRestrictions) {
    const compatibleCandidates = assignableItems
      .filter(({ product }) => productSupportsRestriction(product, restriction))
      .sort((a, b) => rankCandidate(b, restriction) - rankCandidate(a, restriction));
    const chosen = compatibleCandidates.find(({ product }) => !reservedProductIds.has(product.id)) || compatibleCandidates[0];
    if (!chosen) continue;
    addAssignedQuantity(chosen.product.id, requiredCount);
    reservedProductIds.add(chosen.product.id);
  }

  const totalRestricted = activeRestrictions.reduce((sum, [, count]) => sum + count, 0);
  const normalCount = Math.max(0, req.peopleCount - totalRestricted);

  if (normalCount > 0) {
    const preferredNormalCandidates = assignableItems
      .filter(({ product }) => !productSupportsAnyRestriction(product, restrictionNames))
      .sort((a, b) => rankCandidate(b) - rankCandidate(a));
    const fallbackNormalCandidates = assignableItems
      .filter(({ product }) => !reservedProductIds.has(product.id))
      .sort((a, b) => rankCandidate(b) - rankCandidate(a));
    const chosenNormal = preferredNormalCandidates[0] || fallbackNormalCandidates[0] || [...assignableItems].sort((a, b) => rankCandidate(b) - rankCandidate(a))[0];
    if (chosenNormal) {
      addAssignedQuantity(chosenNormal.product.id, normalCount);
    }
  }

  for (const [productId, quantity] of assignedQuantities.entries()) {
    if (pkg.items.some((item) => item.productId === productId)) continue;
    const product = productMap.get(productId);
    if (!product || quantity <= 0) continue;
    const reason = pkg.items.find((item) => item.categoria === product.categoria)?.recommendationReason
      || product.recommendationReason;
    pkg.items.push({
      productId: product.id,
      parentProductId: product.parent_id,
      productName: product.nombre,
      quantity,
      unitPrice: product.effectivePrice,
      computedPrice: product.effectivePrice * quantity,
      score: product.finalScore,
      recommendationReason: reason,
      imageUrl: product.resolvedImageUrl,
      imageSource: product.imageSource,
      imagePrompt: product.imagePrompt,
      sourceType: 'supabase',
      swapGroup: product.categoria,
      categoria: product.categoria,
    });
  }

  pkg.items = pkg.items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return item;

      const assignedQty = assignedQuantities.get(item.productId);
      if (typeof assignedQty === 'number') {
        return {
          ...item,
          quantity: assignedQty,
          computedPrice: item.unitPrice * assignedQty,
        };
      }

      if (
        !isBeverageCategory(item.categoria)
        && product.pricing_model === 'per_person'
        && !isGroupPricedProduct(product)
        && productSupportsAnyRestriction(product, restrictionNames)
      ) {
        return {
          ...item,
          quantity: 0,
          computedPrice: 0,
        };
      }

      return item;
    })
    .filter((item) => item.quantity > 0);

  recalc(pkg, req.peopleCount);
  return pkg;
}

// ═══ MAIN HANDLER ═══
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QuoteRequest = await req.json();
    const { eventType, peopleCount } = body;

    if (!eventType || !peopleCount || peopleCount < 1) {
      return new Response(JSON.stringify({ error: "eventType y peopleCount son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. Persist quote request ──
    const { data: quoteRequest, error: qrError } = await supabase
      .from('quote_requests')
      .insert({
        user_id: body.userId || null,
        event_type: eventType,
        people_count: peopleCount,
        event_date: body.eventDate || null,
        event_time: body.eventTime || null,
        delivery_time: body.deliveryTime || null,
        zip_code: body.zipCode || null,
        duration_hours: body.durationHours || null,
        budget_enabled: body.budgetEnabled || false,
        budget_per_person: body.budgetPerPerson || null,
        dietary_restrictions: body.dietaryRestrictions || [],
        contact_name: body.contactName || null,
        company_name: body.companyName || null,
        source_flow: 'cotizar',
        raw_payload: body,
      })
      .select('id')
      .single();

    if (qrError) console.error('Quote request insert error:', qrError);

    // ── 2. Retrieve canonical menu (get-menu-cotizador → flat variant catalog) ──
    const categories = EVENT_TO_CATEGORIES[eventType] || ['Comida', 'Bebida'];
    let menuAll: DbProduct[] = [];
    try {
      menuAll = await fetchMenuCotizador();
    } catch (e) {
      console.error('Menu cotizador fetch failed:', e);
      menuAll = [];
    }
    // Sólo las categorías relevantes al tipo de evento
    const allProducts: DbProduct[] = menuAll.filter(p => categories.includes(p.categoria || ''));
    const parentMap = new Map<string, DbProduct>(); // imágenes ya van resueltas en el flat

    // ── 3. Score & enrich all products ──
    const allScored: ScoredProduct[] = allProducts.map(p => {
      const { score, reason } = scoreProduct(p, body, 'equilibrado');
      const img = resolveImage(p, parentMap);
      return {
        ...p,
        finalScore: score,
        recommendationReason: reason,
        resolvedImageUrl: img.url,
        imageSource: img.source,
        imagePrompt: img.prompt,
        effectivePrice: p.precio ?? p.precio_min ?? 0,
      };
    }).filter(p => p.effectivePrice > 0);

    const productMap = new Map<string, ScoredProduct>();
    allScored.forEach(p => productMap.set(p.id, p));

    // ── 4. Fetch learning data (feedback + sales history) ──
    let feedbackSummary = '';
    try {
      const { data: popular } = await supabase
        .from('popular_products_by_event')
        .select('*')
        .eq('event_type', eventType)
        .order('times_selected', { ascending: false })
        .limit(15);

      if (popular && popular.length > 0) {
        feedbackSummary = `Los productos más seleccionados para eventos "${eventType}" son:\n` +
          popular.map((p: any) => `- ${p.product_name}: seleccionado ${p.times_selected}x, aceptado ${p.times_accepted}x, tier favorito: ${p.tier}`).join('\n');
      }
    } catch (e) {
      console.warn('Could not fetch feedback data:', e);
    }

    // ── 4b. Fetch real sales history from 2025 ──
    let salesContext = '';
    try {
      const relevantCategories = categories;
      let salesQuery = supabase
        .from('sales_history')
        .select('product_name, product_id, categoria, total_qty_sold, total_revenue, unique_companies, avg_order_size, peak_months, common_time_slots')
        .order('total_revenue', { ascending: false })
        .limit(25);

      if (relevantCategories.length > 0) {
        salesQuery = salesQuery.in('categoria', relevantCategories);
      }

      const { data: salesData } = await salesQuery;

      if (salesData && salesData.length > 0) {
        const totalRevenue = salesData.reduce((s: number, r: any) => s + (r.total_revenue || 0), 0);
        const totalUnits = salesData.reduce((s: number, r: any) => s + (r.total_qty_sold || 0), 0);
        salesContext = `\nDATOS DE VENTAS REALES 2025 (${totalUnits.toLocaleString()} unidades, $${Math.round(totalRevenue).toLocaleString()} MXN en revenue):\n` +
          salesData.slice(0, 15).map((r: any) =>
            `- ${r.product_name}: ${r.total_qty_sold} uds vendidas, $${Math.round(r.total_revenue).toLocaleString()} revenue, ${r.unique_companies} empresas, horarios populares: ${(r.common_time_slots || []).slice(0, 2).join(', ')}`
          ).join('\n') +
          `\nPrioriza estos productos probados por el mercado. Los clientes los prefieren por experiencia comprobada.`;
      }
    } catch (e) {
      console.warn('Could not fetch sales history:', e);
    }

    // ── 4c. Fetch business rules & insights from sales_insights ──
    let insightsContext = '';
    try {
      const { data: insights } = await supabase
        .from('sales_insights')
        .select('insight_type, context_key, insight_text, metadata')
        .limit(100);

      if (insights && insights.length > 0) {
        const people = peopleCount;
        // Determine which historico bands apply to this request
        const band =
          people <= 10 ? 'banda_1_10'
          : people <= 30 ? 'banda_11_30'
          : people <= 60 ? 'banda_31_60'
          : people <= 120 ? 'banda_61_120'
          : 'banda_120_mas';

        const ppBand = (() => {
          const b = body.budgetPerPerson || 0;
          if (!b) return null;
          if (b < 250) return 'menor_250';
          if (b < 350) return 'rango_250_350';
          if (b < 500) return 'rango_350_500';
          if (b < 800) return 'rango_500_800';
          return 'mayor_800';
        })();

        const relevant = insights.filter((i: any) => {
          if (i.insight_type === 'historico_comensales') {
            return i.context_key === band || i.context_key === 'resumen_dataset';
          }
          if (i.insight_type === 'historico_presupuesto_pp') {
            return ppBand ? i.context_key === ppBand : false;
          }
          // Always include business rules & upselling
          return ['reglas_negocio', 'operaciones', 'presupuesto', 'precios_adicionales', 'upselling'].includes(i.insight_type);
        });

        const high = relevant.filter((i: any) => i.metadata?.priority === 'alta');
        const others = relevant.filter((i: any) => i.metadata?.priority !== 'alta');
        const ordered = [...high, ...others].slice(0, 30);

        if (ordered.length > 0) {
          insightsContext = `\n\nREGLAS DE NEGOCIO Y APRENDIZAJES BERLIOZ (úsalos como contexto para componer la propuesta):\n` +
            ordered.map((i: any) => `- [${i.insight_type}${i.metadata?.priority ? ' · ' + i.metadata.priority : ''}] ${i.insight_text}`).join('\n');
        }
      }
    } catch (e) {
      console.warn('Could not fetch sales_insights:', e);
    }

    // ── 5. AI Composition with Claude (heuristic fallback) ──
    // Helper: compose 3 packages for a specific request signature
    const composeFor = async (
      reqOverride: QuoteRequest,
      label: string,
    ): Promise<{ packages: Package[]; engineVersion: string; fallbackUsed: boolean }> => {
      const ev0 = 'v1-heuristic';
      let pkgs: Package[];
      let ev = ev0;
      let fb = false;

      const specs = await composeWithClaude(allScored, reqOverride, feedbackSummary + salesContext + insightsContext);
      if (specs && specs.length === 3) {
        pkgs = specs.map(spec => sanitizePackageForRequest(
          buildPackageFromClaude(spec, productMap, reqOverride.peopleCount),
          reqOverride,
          productMap,
        ));
        const valid = pkgs.every(p =>
          p.items.length >= 1
          && packageIncludesRequiredDietaryCoverage(p, reqOverride, productMap)
          && packageIncludesNormalCoverage(p, reqOverride, productMap)
          && packageFitsTierBudget(p, reqOverride)
        );
        if (valid) {
          ev = 'v3-claude-sonnet';
          ensureDifferentiation(pkgs, reqOverride.peopleCount);
        } else {
          console.warn(`[${label}] Claude packages invalid, falling back to heuristic`);
          fb = true;
          pkgs = buildHeuristicFallback(allProducts, reqOverride, parentMap, reqOverride.peopleCount);
        }
      } else {
        fb = true;
        pkgs = buildHeuristicFallback(allProducts, reqOverride, parentMap, reqOverride.peopleCount);
      }
      // Budget enforcement flag
      if (reqOverride.budgetEnabled && reqOverride.budgetPerPerson && reqOverride.budgetPerPerson > 0) {
        const limit = reqOverride.budgetPerPerson;
        for (const p of pkgs) {
          if (p.pricePerPerson > limit) {
            p.excedePresupuesto = true;
            p.diferenciaPresupuesto = Math.round((p.pricePerPerson - limit) * 100) / 100;
          }
        }
      }
      return { packages: pkgs, engineVersion: ev, fallbackUsed: fb };
    };

    // Multi-delivery: produce one proposal per slot
    const isMulti = body.mode === 'multi' && Array.isArray(body.deliveryGroups) && body.deliveryGroups.length > 0;
    let proposalsBySlot: Array<{
      slot_id: string;
      label: string;
      date: string;
      time: string;
      guests_count: number;
      tiers: Package[];
      engineVersion: string;
      fallbackUsed: boolean;
    }> = [];
    let packages: Package[];
    let engineVersion = 'v1-heuristic';
    let fallbackUsed = false;

    if (isMulti) {
      for (const slot of body.deliveryGroups!) {
        const slotDietary: string[] = [];
        if ((slot.dietary?.vegano || 0) > 0) slotDietary.push('vegano');
        if ((slot.dietary?.vegetariano || 0) > 0) slotDietary.push('vegetariano');
        if ((slot.dietary?.sin_gluten || 0) > 0) slotDietary.push('sin_gluten');
        if ((slot.dietary?.sin_lactosa || 0) > 0) slotDietary.push('sin_lactosa');
        if ((slot.dietary?.keto || 0) > 0) slotDietary.push('keto');

        const slotReq: QuoteRequest = {
          ...body,
          peopleCount: Math.max(1, slot.guests_count || 1),
          eventDate: slot.date || body.eventDate,
          eventTime: slot.time || body.eventTime,
          dietaryRestrictions: slotDietary,
          dietaryCounts: [
            { tipo: 'vegano', cantidad: slot.dietary?.vegano || 0 },
            { tipo: 'vegetariano', cantidad: slot.dietary?.vegetariano || 0 },
            { tipo: 'sin_gluten', cantidad: slot.dietary?.sin_gluten || 0 },
            { tipo: 'sin_lactosa', cantidad: slot.dietary?.sin_lactosa || 0 },
            { tipo: 'keto', cantidad: slot.dietary?.keto || 0 },
          ].filter(c => c.cantidad > 0),
          mode: 'multi',
          deliveryGroups: [slot], // pass only this slot to Claude for context
        };
        const result = await composeFor(slotReq, slot.label || slot.id);
        proposalsBySlot.push({
          slot_id: slot.id,
          label: slot.label || slot.id,
          date: slot.date,
          time: slot.time,
          guests_count: slot.guests_count,
          tiers: result.packages,
          engineVersion: result.engineVersion,
          fallbackUsed: result.fallbackUsed,
        });
      }
      // Backward compat: expose first slot's packages as `packages`
      packages = proposalsBySlot[0]?.tiers ?? [];
      engineVersion = proposalsBySlot.every(p => p.engineVersion === 'v3-claude-sonnet')
        ? 'v3-claude-sonnet-multi'
        : 'v1-heuristic-multi';
      fallbackUsed = proposalsBySlot.some(p => p.fallbackUsed);
    } else {
      const single = await composeFor(body, 'single');
      packages = single.packages;
      engineVersion = single.engineVersion;
      fallbackUsed = single.fallbackUsed;
    }

    // ── 6. Persist proposal ──
    let proposalId: string | null = null;
    if (quoteRequest?.id) {
      const { data: proposal } = await supabase
        .from('quote_proposals')
        .insert({
          quote_request_id: quoteRequest.id,
          engine_version: engineVersion,
          strategy_used: engineVersion === 'v3-claude-sonnet' ? 'claude-composition' : 'scoring-contextual',
          fallback_used: fallbackUsed,
          total_estimated: packages.find(p => p.isRecommended)?.total || packages[1]?.total,
          shipping_amount: BASE_SHIPPING,
          tax_amount: packages.find(p => p.isRecommended)?.iva || 0,
          recommendation_summary: engineVersion === 'v3-claude-sonnet'
            ? 'Propuesta compuesta por Claude AI usando catálogo real y preferencias históricas.'
            : 'Propuesta generada con scoring heurístico basado en catálogo real Berlioz.',
          reasoning_json: {
            productsRetrieved: allProducts.length,
            categories,
            scoringVersion: engineVersion,
            feedbackDataUsed: feedbackSummary.length > 0,
          },
        })
        .select('id')
        .single();

      proposalId = proposal?.id || null;

      if (proposalId) {
        for (const pkg of packages) {
          const { data: pkgRow } = await supabase
            .from('quote_packages')
            .insert({
              proposal_id: proposalId,
              tier: pkg.tier, title: pkg.title, tagline: pkg.tagline,
              subtotal: pkg.subtotal, iva: pkg.iva, shipping: pkg.shipping, total: pkg.total,
              price_per_person: pkg.pricePerPerson, recommendation_reason: pkg.recommendationReason,
              ranking_score: pkg.rankingScore, is_recommended: pkg.isRecommended, highlights: pkg.highlights,
            })
            .select('id')
            .single();

          if (pkgRow?.id) {
            const itemRows = pkg.items.map(item => ({
              package_id: pkgRow.id, product_id: item.productId, parent_product_id: item.parentProductId,
              product_name: item.productName, quantity: item.quantity, unit_price: item.unitPrice,
              computed_price: item.computedPrice, score: item.score, recommendation_reason: item.recommendationReason,
              image_url: item.imageUrl, image_source: item.imageSource, image_prompt: item.imagePrompt,
              source_type: item.sourceType, swap_group: item.swapGroup,
            }));
            await supabase.from('quote_package_items').insert(itemRows);
          }
        }
      }
    }

    // ── 7. Return response ──
    return new Response(JSON.stringify({
      requestId: quoteRequest?.id || null,
      proposalId,
      engineVersion,
      fallbackUsed,
      mode: isMulti ? 'multi' : 'single',
      packages,
      proposals: isMulti ? proposalsBySlot : undefined,
      recommendationSummary: engineVersion.startsWith('v3-claude-sonnet')
        ? 'Propuesta inteligente generada con Claude AI, basada en el catálogo Berlioz y las preferencias de clientes anteriores.'
        : 'Propuesta generada con el catálogo real de Berlioz.',
      debug: {
        retrievalStrategy: 'rpc-search_products_for_quote',
        scoringVersion: engineVersion,
        matchedProducts: allProducts.length,
        feedbackDataUsed: feedbackSummary.length > 0,
        slotsCount: isMulti ? proposalsBySlot.length : 1,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Quote orchestrator error:", error);
    return new Response(JSON.stringify({ error: "Error interno del orquestador", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ═══ HEURISTIC FALLBACK HELPER ═══
function buildHeuristicFallback(
  allProducts: DbProduct[],
  body: QuoteRequest,
  parentMap: Map<string, DbProduct>,
  peopleCount: number,
): Package[] {
  const scoredByTier: Record<string, ScoredProduct[]> = {};
  for (const tier of ['esencial', 'equilibrado', 'experiencia'] as const) {
    scoredByTier[tier] = allProducts.map(p => {
      const { score, reason } = scoreProduct(p, body, tier);
      const img = resolveImage(p, parentMap);
      return { ...p, finalScore: score, recommendationReason: reason, resolvedImageUrl: img.url, imageSource: img.source, imagePrompt: img.prompt, effectivePrice: p.precio ?? p.precio_min ?? 0 };
    }).filter(p => p.effectivePrice > 0);
  }
  const pkgs = [
    composePackageHeuristic('esencial', scoredByTier['esencial'], body),
    composePackageHeuristic('equilibrado', scoredByTier['equilibrado'], body),
    composePackageHeuristic('experiencia', scoredByTier['experiencia'], body),
  ].map((pkg) => sanitizePackageForRequest(
    pkg,
    body,
    new Map(scoredByTier[pkg.tier].map((product) => [product.id, product])),
  ));
  ensureDifferentiation(pkgs, peopleCount);
  return pkgs;
}
