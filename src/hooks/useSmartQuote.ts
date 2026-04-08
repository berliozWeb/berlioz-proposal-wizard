import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SmartQuoteRequest, SmartQuoteResponse, ProposalPackage } from '@/domain/entities/SmartQuote';
import {
  CATALOG, getDefaultItems, findProduct,
  BASE_SHIPPING_COST, IVA_RATE, type PackageTier,
} from '@/domain/entities/BerliozCatalog';

// ═══ FALLBACK — builds packages from hardcoded catalog ═══
function buildFallbackPackages(eventType: string, people: number): ProposalPackage[] {
  const defaults = getDefaultItems(eventType);
  const tiers: PackageTier[] = ['esencial', 'equilibrado', 'experiencia'];
  const titles: Record<PackageTier, { title: string; tagline: string }> = {
    esencial: { title: 'Esencial', tagline: 'Lo necesario, bien ejecutado' },
    equilibrado: { title: 'Equilibrado', tagline: 'La experiencia que tu equipo merece' },
    experiencia: { title: 'Experiencia Completa', tagline: 'Cada detalle cuenta' },
  };

  return tiers.map(tier => {
    const items = defaults[tier].map(d => {
      const product = findProduct(d.productName);
      if (!product) return null;
      const qty = d.qtyMultiplier === 'N' ? people : d.qtyMultiplier;
      return {
        productId: product.id,
        parentProductId: null,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        computedPrice: product.price * qty,
        score: 50,
        recommendationReason: 'Selección del catálogo Berlioz',
        imageUrl: null,
        imageSource: 'generated_prompt' as const,
        imagePrompt: null,
        sourceType: 'deterministic-fallback' as const,
        swapGroup: product.sidebarCategory,
        categoria: product.category,
      };
    }).filter(Boolean) as ProposalPackage['items'];

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
        const fallbackPkgs = buildFallbackPackages(request.eventType, request.peopleCount);
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
      const fallbackPkgs = buildFallbackPackages(request.eventType, request.peopleCount);
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

  return { loading, response, error, generateQuote };
}
