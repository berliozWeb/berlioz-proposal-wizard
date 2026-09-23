import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SmartQuoteRequest, SmartQuoteResponse, ProposalPackage } from '@/domain/entities/SmartQuote';
import { BASE_SHIPPING_COST, IVA_RATE, type PackageTier } from '@/domain/entities/BerliozCatalog';

// ═══ FALLBACK — se arma con el espejo de WooCommerce, nunca con listas fijas ═══
// Regla: si un producto no está publicado y activo en Woo, no existe aquí.
async function buildFallbackPackages(eventType: string, people: number): Promise<ProposalPackage[]> {
  const ev = eventType.toLowerCase();
  const categoria = ev.includes('coffee') ? 'Coffee Break'
    : ev.includes('desayuno') ? 'Desayuno'
    : 'Working Lunch';

  const { data } = await supabase
    .from('productos')
    .select('id, nombre, precio, precio_min, imagen_url, categoria, woo_categorias, total_sales')
    .eq('activo', true)
    .eq('woo_source', true)
    .contains('woo_categorias', [categoria])
    .order('total_sales', { ascending: false })
    .limit(80);

  const candidatos = (data ?? [])
    .map(p => ({
      id: String(p.id),
      name: p.nombre as string,
      price: Number(p.precio ?? p.precio_min ?? 0),
      img: (p.imagen_url as string | null) ?? null,
      categoria: (p.categoria as string | null) ?? categoria,
    }))
    .filter(p => p.price > 0 && !/costo por cambio/i.test(p.name))
    .sort((a, b) => a.price - b.price);

  if (candidatos.length === 0) return [];

  const pick: Record<PackageTier, typeof candidatos[number]> = {
    esencial: candidatos[0],
    equilibrado: candidatos[Math.floor(candidatos.length / 2)],
    experiencia: candidatos[candidatos.length - 1],
  };

  const tiers: PackageTier[] = ['esencial', 'equilibrado', 'experiencia'];
  const titles: Record<PackageTier, { title: string; tagline: string }> = {
    esencial: { title: 'Esencial', tagline: 'Lo necesario, bien ejecutado' },
    equilibrado: { title: 'Equilibrado', tagline: 'La experiencia que tu equipo merece' },
    experiencia: { title: 'Experiencia Completa', tagline: 'Cada detalle cuenta' },
  };

  return tiers.map(tier => {
    const product = pick[tier];
    const items = [{
      productId: product.id,
      parentProductId: null,
      productName: product.name,
      quantity: people,
      unitPrice: product.price,
      computedPrice: product.price * people,
      score: 50,
      recommendationReason: 'Selección del catálogo Berlioz',
      imageUrl: product.img,
      imageSource: 'catalog' as const,
      imagePrompt: null,
      sourceType: 'deterministic-fallback' as const,
      swapGroup: product.categoria,
      categoria: product.categoria,
    }] as ProposalPackage['items'];

    const subtotal = items.reduce((s, i) => s + i.computedPrice, 0);
    const shipping = BASE_SHIPPING_COST;
    const base = subtotal + shipping;
    const iva = Math.round(base * IVA_RATE * 100) / 100;
    const total = Math.round((base + iva) * 100) / 100;

    return {
      tier,
      title: titles[tier].title,
      tagline: titles[tier].tagline,
      items,
      subtotal,
      iva,
      shipping,
      total,
      pricePerPerson: Math.round((total / people) * 100) / 100,
      recommendationReason: tier === 'equilibrado'
        ? '8 de cada 10 clientes eligen este paquete.'
        : tier === 'esencial'
          ? 'Propuesta funcional al mejor precio.'
          : 'Experiencia gastronómica completa.',
      rankingScore: tier === 'equilibrado' ? 90 : tier === 'experiencia' ? 80 : 70,
      isRecommended: tier === 'equilibrado',
      highlights: tier === 'esencial'
        ? ['Entrega puntual', 'Precio optimizado', 'Calidad Berlioz']
        : tier === 'equilibrado'
          ? ['Bebidas incluidas', 'Variedad premium', 'Presentación profesional']
          : ['Bebidas premium', 'Productos gourmet', 'Experiencia completa'],
    };
  });
}

export function useSmartQuote() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SmartQuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateQuote = useCallback(async (request: SmartQuoteRequest) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('quote-orchestrator', {
        body: request,
      });

      if (fnError || !data || data.error) {
        console.warn('Smart quote failed, using fallback:', fnError || data?.error);

        // Fallback to deterministic
        const fallbackPkgs = await buildFallbackPackages(request.eventType, request.peopleCount);
        const fallbackResponse: SmartQuoteResponse = {
          requestId: null,
          proposalId: null,
          engineVersion: 'v0-fallback',
          fallbackUsed: true,
          packages: fallbackPkgs,
          recommendationSummary: 'Propuesta generada con el catálogo estándar Berlioz.',
          debug: { retrievalStrategy: 'deterministic-fallback', matchedProducts: 0 },
        };
        setResponse(fallbackResponse);
        return fallbackResponse;
      }

      setResponse(data as SmartQuoteResponse);
      return data as SmartQuoteResponse;
    } catch (err) {
      console.error('Smart quote error:', err);

      // Fallback
      const fallbackPkgs = await buildFallbackPackages(request.eventType, request.peopleCount);
      const fallbackResponse: SmartQuoteResponse = {
        requestId: null,
        proposalId: null,
        engineVersion: 'v0-fallback',
        fallbackUsed: true,
        packages: fallbackPkgs,
        recommendationSummary: 'Propuesta generada con el catálogo estándar Berlioz.',
      };
      setResponse(fallbackResponse);
      setError('Se usó el catálogo estándar como respaldo.');
      return fallbackResponse;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitFeedback = useCallback(async (feedback: {
    proposalId: string;
    selectedTier?: string;
    accepted?: boolean;
    productsAdded?: string[];
    productsRemoved?: string[];
    manualChanges?: Record<string, unknown>;
    rating?: number;
    comments?: string;
  }) => {
    try {
      await supabase.functions.invoke('quote-feedback', { body: feedback });
    } catch (err) {
      console.warn('Feedback submission failed:', err);
    }
  }, []);

  return { loading, response, error, generateQuote, submitFeedback };
}
