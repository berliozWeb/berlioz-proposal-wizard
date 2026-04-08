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
}
