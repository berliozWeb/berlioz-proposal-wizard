import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ═══ TYPES ═══
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
  contactName?: string;
  companyName?: string;
  userId?: string;
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
}

// ═══ CONSTANTS ═══
const BASE_SHIPPING = 360;
const IVA_RATE = 0.16;
const STORAGE_BASE = "https://ktyupdpzgmzzfkskkvpn.supabase.co/storage/v1/object/public/Berlioz-images/";

// ═══ CATEGORY MAPPING ═══
const EVENT_TO_CATEGORIES: Record<string, string[]> = {
  'desayuno': ['Desayuno', 'Coffee Break', 'Bebidas'],
  'coffee-break': ['Coffee Break', 'Bebidas'],
  'working-lunch': ['Working Lunch', 'Vegano / Vegetariano', 'Bebidas', 'Coffee Break'],
  'capacitacion': ['Desayuno', 'Working Lunch', 'Coffee Break', 'Bebidas', 'Vegano / Vegetariano'],
  'reunion-ejecutiva': ['Working Lunch', 'Coffee Break', 'Bebidas', 'Vegano / Vegetariano'],
  'filmacion': ['Working Lunch', 'Coffee Break', 'Bebidas'],
};

// ═══ SCORING ENGINE ═══
function scoreProduct(
  product: DbProduct,
  req: QuoteRequest,
  tier: 'esencial' | 'equilibrado' | 'experiencia'
): { score: number; reason: string } {
  let score = product.score_comercial || 50;
  const reasons: string[] = [];
  const price = product.precio ?? product.precio_min ?? 0;

  // Budget alignment
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
    // No budget: tier-based price scoring
    if (tier === 'esencial' && price <= 200) { score += 15; reasons.push('Opción económica'); }
    else if (tier === 'equilibrado' && price >= 250 && price <= 400) { score += 15; reasons.push('Mejor relación calidad-precio'); }
    else if (tier === 'experiencia' && price >= 350) { score += 15; reasons.push('Calidad premium'); }
  }

  // Bestseller bonus
  if (product.destacado) { score += 10; reasons.push('Producto destacado'); }

  // Visual quality bonus
  if (product.imagen_url) { score += 5; }
  if ((product.score_visual || 50) > 70) { score += 5; reasons.push('Presentación visual excelente'); }

  // Dietary compatibility
  if (req.dietaryRestrictions?.length) {
    const tags = product.dietary_tags || [];
    const matches = req.dietaryRestrictions.filter(r =>
      tags.some(t => t.toLowerCase().includes(r.toLowerCase()))
    );
    if (matches.length > 0) {
      score += 15;
      reasons.push(`Compatible con: ${matches.join(', ')}`);
    }
  }

  // Time-based adjustments
  if (req.eventTime) {
    const hour = parseInt(req.eventTime.split(':')[0]);
    const cat = (product.categoria || '').toLowerCase();
    if (hour < 10 && cat.includes('desayuno')) { score += 10; reasons.push('Ideal para la mañana'); }
    if (hour >= 12 && (cat.includes('lunch') || cat.includes('working'))) { score += 10; reasons.push('Perfecto para la hora de comida'); }
  }

  // Duration-based
  if (req.durationHours) {
    if (req.durationHours < 2 && (product.categoria === 'Bebidas' || product.categoria === 'Coffee Break')) {
      score += 10;
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reason: reasons.length > 0 ? reasons.join(' · ') : 'Selección del catálogo Berlioz',
  };
}

// ═══ IMAGE RESOLUTION ═══
function resolveImage(product: DbProduct, parentProducts: Map<string, DbProduct>): {
  url: string | null;
  source: 'product_image' | 'parent_image' | 'generated_prompt';
  prompt: string | null;
} {
  // 1. Own image
  if (product.imagen_url) {
    return { url: product.imagen_url, source: 'product_image', prompt: null };
  }

  // 2. Parent image
  if (product.parent_id) {
    const parent = parentProducts.get(product.parent_id);
    if (parent?.imagen_url) {
      return { url: parent.imagen_url, source: 'parent_image', prompt: null };
    }
  }

  // 3. Generated prompt
  const prompt = `Fotografía gastronómica profesional de ${product.nombre}, estilo catering corporativo premium, ${product.descripcion ? `con ${product.descripcion}` : ''}, emplatado elegante, iluminación suave natural, composición editorial, fondo limpio, alta resolución, aspecto realista y apetitoso`;

  return { url: null, source: 'generated_prompt', prompt };
}

// ═══ PACKAGE COMPOSER ═══
function composePackage(
  tier: 'esencial' | 'equilibrado' | 'experiencia',
  products: ScoredProduct[],
  req: QuoteRequest,
): Package {
  const people = req.peopleCount;

  // Select products for tier
  const mainCategories = EVENT_TO_CATEGORIES[req.eventType] || ['Working Lunch', 'Bebidas'];
  const tierConfig = {
    esencial: { maxItems: 2, includeBeverage: false, title: 'Esencial', tagline: 'Lo necesario, bien ejecutado' },
    equilibrado: { maxItems: 4, includeBeverage: true, title: 'Equilibrado', tagline: 'La experiencia que tu equipo merece' },
    experiencia: { maxItems: 5, includeBeverage: true, title: 'Experiencia Completa', tagline: 'Cada detalle cuenta' },
  }[tier];

  // Get main food product (highest scored from primary category)
  const primaryCat = mainCategories[0];
  const mainProducts = products
    .filter(p => p.categoria === primaryCat)
    .sort((a, b) => b.finalScore - a.finalScore);

  const items: PackageItem[] = [];
  const usedProducts = new Set<string>();

  // Add main product
  if (mainProducts.length > 0) {
    // For each tier, pick different quality levels
    const pickIndex = tier === 'esencial' ? Math.min(mainProducts.length - 1, Math.floor(mainProducts.length * 0.7))
      : tier === 'equilibrado' ? Math.min(mainProducts.length - 1, Math.floor(mainProducts.length * 0.3))
      : 0; // experiencia = best

    const main = mainProducts[pickIndex] || mainProducts[0];
    const isPerPerson = main.pricing_model === 'per_person';

    items.push({
      productId: main.id,
      parentProductId: main.parent_id,
      productName: main.nombre,
      quantity: isPerPerson ? people : 1,
      unitPrice: main.effectivePrice,
      computedPrice: main.effectivePrice * (isPerPerson ? people : 1),
      score: main.finalScore,
      recommendationReason: main.recommendationReason,
      imageUrl: main.resolvedImageUrl,
      imageSource: main.imageSource,
      imagePrompt: main.imagePrompt,
      sourceType: 'supabase',
      swapGroup: main.categoria,
      categoria: main.categoria,
    });
    usedProducts.add(main.id);
  }

  // Add beverage if tier requires it
  if (tierConfig.includeBeverage) {
    const beverages = products
      .filter(p => p.categoria === 'Bebidas' && !usedProducts.has(p.id))
      .sort((a, b) => b.finalScore - a.finalScore);

    if (beverages.length > 0) {
      const bev = tier === 'experiencia' ? beverages[0] : beverages[Math.min(1, beverages.length - 1)];
      const isPerPerson = bev.pricing_model === 'per_person';
      items.push({
        productId: bev.id,
        parentProductId: bev.parent_id,
        productName: bev.nombre,
        quantity: isPerPerson ? people : Math.ceil(people / 12),
        unitPrice: bev.effectivePrice,
        computedPrice: bev.effectivePrice * (isPerPerson ? people : Math.ceil(people / 12)),
        score: bev.finalScore,
        recommendationReason: 'Bebida incluida en el paquete',
        imageUrl: bev.resolvedImageUrl,
        imageSource: bev.imageSource,
        imagePrompt: bev.imagePrompt,
        sourceType: 'supabase',
        swapGroup: 'Bebidas',
        categoria: bev.categoria,
      });
      usedProducts.add(bev.id);
    }
  }

  // Fill remaining slots with complementary items
  const remaining = tierConfig.maxItems - items.length;
  if (remaining > 0) {
    const complementary = products
      .filter(p => !usedProducts.has(p.id) && p.categoria !== primaryCat)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, remaining);

    for (const comp of complementary) {
      const isPerPerson = comp.pricing_model === 'per_person';
      const isSurtido = comp.nombre.toLowerCase().includes('surtido');
      const qty = isPerPerson ? people : isSurtido ? Math.ceil(people / 7) : 1;

      items.push({
        productId: comp.id,
        parentProductId: comp.parent_id,
        productName: comp.nombre,
        quantity: qty,
        unitPrice: comp.effectivePrice,
        computedPrice: comp.effectivePrice * qty,
        score: comp.finalScore,
        recommendationReason: comp.recommendationReason,
        imageUrl: comp.resolvedImageUrl,
        imageSource: comp.imageSource,
        imagePrompt: comp.imagePrompt,
        sourceType: 'supabase',
        swapGroup: comp.categoria,
        categoria: comp.categoria,
      });
      usedProducts.add(comp.id);
    }
  }

  // Calculate totals
  const subtotal = items.reduce((s, i) => s + i.computedPrice, 0);
  const shipping = BASE_SHIPPING;
  const base = subtotal + shipping;
  const iva = Math.round(base * IVA_RATE * 100) / 100;
  const total = Math.round((base + iva) * 100) / 100;
  const pricePerPerson = Math.round((total / people) * 100) / 100;

  const highlights = {
    esencial: ['Entrega puntual garantizada', 'Precio optimizado', 'Calidad Berlioz'],
    equilibrado: ['Bebidas incluidas', 'Variedad premium', 'Presentación profesional'],
    experiencia: ['Bebidas premium', 'Productos gourmet top-tier', 'Experiencia completa'],
  }[tier];

  return {
    tier,
    title: tierConfig.title,
    tagline: tierConfig.tagline,
    items,
    subtotal,
    iva,
    shipping,
    total,
    pricePerPerson,
    recommendationReason: tier === 'equilibrado'
      ? '8 de cada 10 clientes eligen este paquete. Incluye bebidas y la mejor relación calidad-precio.'
      : tier === 'esencial'
        ? 'Propuesta funcional optimizada al mejor precio.'
        : 'La experiencia gastronómica más completa para impresionar.',
    rankingScore: tier === 'equilibrado' ? 90 : tier === 'experiencia' ? 80 : 70,
    isRecommended: tier === 'equilibrado',
    highlights,
  };
}

// ═══ ENSURE PRICE DIFFERENTIATION ═══
function ensureDifferentiation(packages: Package[], people: number) {
  const [esencial, equilibrado, experiencia] = packages;
  if (!esencial || !equilibrado || !experiencia) return;

  // Ensure esencial < equilibrado < experiencia
  if (esencial.total >= equilibrado.total * 0.85) {
    const scale = (equilibrado.total * 0.65) / esencial.total;
    esencial.items.forEach(i => {
      i.computedPrice = Math.round(i.computedPrice * scale);
      i.unitPrice = Math.round(i.unitPrice * scale);
    });
    recalc(esencial, people);
  }

  if (experiencia.total <= equilibrado.total * 1.15) {
    const scale = (equilibrado.total * 1.35) / experiencia.total;
    experiencia.items.forEach(i => {
      i.computedPrice = Math.round(i.computedPrice * scale);
      i.unitPrice = Math.round(i.unitPrice * scale);
    });
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

    if (qrError) {
      console.error('Quote request insert error:', qrError);
    }

    // ── 2. Retrieve products ──
    const categories = EVENT_TO_CATEGORIES[eventType] || ['Working Lunch', 'Bebidas'];
    const allProducts: DbProduct[] = [];

    for (const cat of categories) {
      const { data, error } = await supabase.rpc('search_products_for_quote', {
        p_categoria: cat,
        p_dietary_tags: body.dietaryRestrictions || [],
        p_budget_max: body.budgetEnabled && body.budgetPerPerson ? body.budgetPerPerson * 1.5 : null,
        p_limit: 30,
      });

      if (!error && data) {
        allProducts.push(...(data as DbProduct[]));
      }
    }

    // Also get parent images for variations
    const parentIds = [...new Set(allProducts.filter(p => p.parent_id).map(p => p.parent_id!))];
    const parentMap = new Map<string, DbProduct>();

    if (parentIds.length > 0) {
      const { data: parents } = await supabase
        .from('productos')
        .select('id, nombre, imagen_url')
        .in('id', parentIds);

      if (parents) {
        parents.forEach((p: any) => parentMap.set(p.id, p as DbProduct));
      }
    }

    // ── 3. Score & enrich products ──
    const scoredByTier: Record<string, ScoredProduct[]> = {};

    for (const tier of ['esencial', 'equilibrado', 'experiencia'] as const) {
      scoredByTier[tier] = allProducts.map(p => {
        const { score, reason } = scoreProduct(p, body, tier);
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
    }

    // ── 4. Compose packages ──
    const packages: Package[] = [
      composePackage('esencial', scoredByTier['esencial'], body),
      composePackage('equilibrado', scoredByTier['equilibrado'], body),
      composePackage('experiencia', scoredByTier['experiencia'], body),
    ];

    ensureDifferentiation(packages, peopleCount);

    // ── 5. Persist proposal ──
    let proposalId: string | null = null;

    if (quoteRequest?.id) {
      const { data: proposal } = await supabase
        .from('quote_proposals')
        .insert({
          quote_request_id: quoteRequest.id,
          engine_version: 'v1-heuristic',
          strategy_used: 'scoring-contextual',
          fallback_used: false,
          total_estimated: packages.find(p => p.isRecommended)?.total || packages[1]?.total,
          shipping_amount: BASE_SHIPPING,
          tax_amount: packages.find(p => p.isRecommended)?.iva || 0,
          recommendation_summary: 'Propuesta generada con scoring heurístico basado en catálogo real Berlioz.',
          reasoning_json: {
            productsRetrieved: allProducts.length,
            categories: categories,
            scoringVersion: 'v1',
          },
        })
        .select('id')
        .single();

      proposalId = proposal?.id || null;

      // Persist packages and items
      if (proposalId) {
        for (const pkg of packages) {
          const { data: pkgRow } = await supabase
            .from('quote_packages')
            .insert({
              proposal_id: proposalId,
              tier: pkg.tier,
              title: pkg.title,
              tagline: pkg.tagline,
              subtotal: pkg.subtotal,
              iva: pkg.iva,
              shipping: pkg.shipping,
              total: pkg.total,
              price_per_person: pkg.pricePerPerson,
              recommendation_reason: pkg.recommendationReason,
              ranking_score: pkg.rankingScore,
              is_recommended: pkg.isRecommended,
              highlights: pkg.highlights,
            })
            .select('id')
            .single();

          if (pkgRow?.id) {
            const itemRows = pkg.items.map(item => ({
              package_id: pkgRow.id,
              product_id: item.productId,
              parent_product_id: item.parentProductId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              computed_price: item.computedPrice,
              score: item.score,
              recommendation_reason: item.recommendationReason,
              image_url: item.imageUrl,
              image_source: item.imageSource,
              image_prompt: item.imagePrompt,
              source_type: item.sourceType,
              swap_group: item.swapGroup,
            }));

            await supabase.from('quote_package_items').insert(itemRows);
          }
        }
      }
    }

    // ── 6. Return response ──
    const response = {
      requestId: quoteRequest?.id || null,
      proposalId,
      engineVersion: 'v1-heuristic',
      fallbackUsed: false,
      packages,
      recommendationSummary: 'Propuesta generada con el catálogo real de Berlioz, optimizada para tu evento.',
      debug: {
        retrievalStrategy: 'rpc-search_products_for_quote',
        scoringVersion: 'v1',
        matchedProducts: allProducts.length,
        dataWarnings: allProducts.length < 5 ? ['Pocos productos encontrados para las categorías seleccionadas'] : [],
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quote-orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
