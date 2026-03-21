export type PricingModel = 'per_person' | 'per_group' | 'fixed';

export interface GroupPriceTier {
  people: number;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** For per_person items: price per unit. For fixed items: the fixed price. For per_group: use groupPrices. */
  pricePerPerson: number;
  category: MenuCategory;
  image?: string;
  isTopSeller?: boolean;
  pricingModel: PricingModel;
  /** Group-priced items have tiered pricing */
  groupPrices?: GroupPriceTier[];
  /** Number of people this item serves (for surtidos/group items) */
  servesUpTo?: number;
  /** Min order quantity */
  minQty?: number;
  /** Variants (e.g. "con yogurt", "con pan") */
  variants?: string[];
  /** Special notes for the agent */
  agentNote?: string;
}

export type MenuCategory =
  | 'coffee_break'
  | 'coffee_break_surtido'
  | 'coffee_break_individual'
  | 'desayuno'
  | 'working_lunch'
  | 'working_lunch_economico'
  | 'tortas'
  | 'bebidas';

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  coffee_break: 'Coffee Break (Paquetes)',
  coffee_break_surtido: 'Surtidos',
  coffee_break_individual: 'Individuales Coffee Break',
  desayuno: 'Desayuno',
  working_lunch: 'Working Lunch',
  working_lunch_economico: 'Working Lunch Económico',
  tortas: 'Tortas Piropo',
  bebidas: 'Bebidas',
};

/** Simplified categories for the browse UI */
export const BROWSE_CATEGORIES: MenuCategory[] = [
  'coffee_break',
  'coffee_break_surtido',
  'coffee_break_individual',
  'desayuno',
  'working_lunch',
  'working_lunch_economico',
  'tortas',
  'bebidas',
];

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
