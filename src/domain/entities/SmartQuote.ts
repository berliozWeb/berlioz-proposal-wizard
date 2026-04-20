// ═══════════════════════════════════════════════════════════
// Smart Quote Types — used by the new orchestrator
// ═══════════════════════════════════════════════════════════

export interface ProposedProduct {
  productId: string;
  parentProductId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  computedPrice: number;
  score: number;
  recommendationReason: string;
  imageUrl: string | null;
  imageSource: 'product_image' | 'parent_image' | 'gallery_image' | 'generated_prompt';
  imagePrompt: string | null;
  sourceType: 'supabase' | 'deterministic-fallback';
  swapGroup: string | null;
  categoria: string | null;
}

export interface ProposalPackage {
  tier: 'esencial' | 'equilibrado' | 'experiencia';
  title: string;
  tagline: string;
  narrativa?: string;
  items: ProposedProduct[];
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

export interface SmartQuoteResponse {
  requestId: string | null;
  proposalId: string | null;
  engineVersion: string;
  fallbackUsed: boolean;
  packages: ProposalPackage[];
  recommendationSummary: string;
  debug?: {
    retrievalStrategy?: string;
    scoringVersion?: string;
    matchedProducts?: number;
    dataWarnings?: string[];
  };
}

export interface MultiDeliverySlot {
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

export interface SmartQuoteRequest {
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
  /** When 'multi', deliveryGroups must be provided and the AI should produce a per-slot menu. */
  mode?: 'single' | 'multi';
  deliveryGroups?: MultiDeliverySlot[];
  address?: string;
}
