export interface PackageItem {
  code: string;
  name: string;
  unitPrice: number;
  qtyPerPerson: number;
  totalQty: number;
  subtotal: number;
}

export type PackageId = 'basico' | 'recomendado' | 'premium';

export interface Package {
  id: PackageId;
  displayName: string;
  tagline: string;
  narrative: string;
  highlights: string[];
  items: PackageItem[];
  subtotalBeforeIVA: number;
  iva: number;
  deliveryFee: number;
  total: number;
  pricePerPerson: number;
}

export interface Proposal {
  proposalId: string;
  createdAt: string;
  intro: string;
  packages: Package[];
  recommendedId: 'recomendado';
  recommendedReason: string;
  validUntil: string;
  businessRules: string[];
}
