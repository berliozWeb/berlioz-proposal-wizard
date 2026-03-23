/**
 * Cross-sell and swap data based on 5,344 real Berlioz orders (2025).
 */

import type { PackageItem } from './Proposal';

// ── SWAP ALTERNATIVES (3-4 similar-tier options) ──
export const SWAP_MAP: Record<string, string[]> = {
  desayuno_berlioz: ['breakfast_roma', 'breakfast_london', 'box_chilaquiles_verdes_huevo'],
  breakfast_roma: ['breakfast_london', 'breakfast_blt', 'breakfast_madrid'],
  breakfast_london: ['breakfast_roma', 'breakfast_blt', 'breakfast_montreal'],
  breakfast_montreal: ['breakfast_london', 'healthy_breakfast'],
  breakfast_blt: ['breakfast_roma', 'breakfast_london', 'breakfast_madrid'],
  breakfast_madrid: ['breakfast_roma', 'breakfast_blt'],
  healthy_breakfast: ['breakfast_montreal', 'breakfast_london'],
  breakfast_bag_pavo: ['breakfast_bag_especial', 'breakfast_vegano'],
  golden_box: ['black_box', 'white_box', 'blt_box', 'aqua_box'],
  black_box: ['golden_box', 'white_box', 'blt_box', 'pink_box'],
  white_box: ['golden_box', 'black_box', 'blt_box'],
  blt_box: ['golden_box', 'black_box', 'white_box'],
  pink_box: ['golden_box', 'black_box', 'salmon_box'],
  salmon_box: ['orzo_pasta_salad_box', 'green_box', 'pink_box'],
  orzo_pasta_salad_box: ['salmon_box', 'green_box', 'pink_box'],
  green_box: ['salmon_box', 'orzo_pasta_salad_box', 'pink_box'],
  mini_box: ['lunch_bag_pasta_pollo', 'lunch_bag_ciabatta_pavo'],
  lunch_bag_pasta_pollo: ['lunch_bag_ciabatta_pavo', 'mini_box'],
  lunch_bag_ciabatta_pavo: ['lunch_bag_pasta_pollo', 'mini_box'],
  cb_am_cafe: ['cb_am_jugo', 'cb_pm'],
  cb_am_jugo: ['cb_am_cafe', 'cb_pm'],
  cb_pm: ['cb_am_cafe', 'cb_am_jugo'],
  surtido_camille: ['surtido_voltaire', 'surtido_hugo', 'surtido_colette'],
  surtido_voltaire: ['surtido_camille', 'surtido_hugo', 'surtido_colette'],
  surtido_hugo: ['surtido_colette', 'surtido_balzac', 'surtido_zadig'],
  surtido_colette: ['surtido_hugo', 'surtido_balzac', 'surtido_zadig'],
  surtido_balzac: ['surtido_hugo', 'surtido_colette', 'surtido_zadig'],
  surtido_zadig: ['surtido_hugo', 'surtido_colette', 'surtido_balzac'],
  cafe_te_berlioz: ['cafe_frio', 'jugo_naranja'],
  cafe_frio: ['cafe_te_berlioz', 'jugo_naranja'],
  jugo_naranja: ['cafe_te_berlioz', 'cafe_frio'],
  agua_jamaica: ['agua_bui_natural', 'agua_bui_mineral', 'agua_limon'],
  agua_bui_natural: ['agua_jamaica', 'agua_bui_mineral', 'agua_limon'],
  agua_bui_mineral: ['agua_bui_natural', 'agua_jamaica'],
  agua_limon: ['agua_jamaica', 'agua_bui_natural'],
  crudites: ['ensalada_pepino', 'ensalada_jicama', 'ensalada_fruta'],
  ensalada_pepino: ['crudites', 'ensalada_jicama', 'ensalada_fruta'],
  ensalada_jicama: ['crudites', 'ensalada_pepino', 'ensalada_fruta'],
  ensalada_fruta: ['crudites', 'ensalada_pepino', 'ensalada_jicama'],
  cookies: ['panque_naranja', 'panque_pera', 'mix_semillas'],
  panque_naranja: ['cookies', 'panque_pera', 'mix_semillas'],
  panque_pera: ['cookies', 'panque_naranja', 'mix_semillas'],
  mix_semillas: ['cookies', 'panque_naranja', 'panque_pera'],
  surtido_snacks: ['surtido_colette', 'surtido_zadig'],
};

// ── CROSS-SELL SUGGESTIONS (top 3 "también llevan") ──
export interface CrossSellChip {
  icon: string;
  code: string;
  name: string;
  price: string; // display price
  unitPrice: number;
  isFixed: boolean; // true = qty 1 always, false = qty per person
}

function chip(icon: string, code: string, name: string, price: string, unitPrice: number, isFixed = false): CrossSellChip {
  return { icon, code, name, price, unitPrice, isFixed };
}

const CAFE = chip('☕', 'cafe_te_berlioz', 'Café/Té', '$540', 540, true);
const AGUA_J = chip('💧', 'agua_jamaica', 'Agua Jamaica', '$45/pza', 45);
const AGUA_B = chip('💧', 'agua_bui_natural', 'Agua BUI', '$50/pza', 50);
const CRUDITES = chip('🥗', 'crudites', 'Crudités', '$50/pza', 50);
const COLETTE = chip('🥐', 'surtido_colette', 'Surtido Colette', '$450', 450, true);
const COOKIES = chip('🍪', 'cookies', 'Cookies', '$50/pza', 50);
const SNACKS = chip('🍿', 'surtido_snacks', 'Surtido Snacks', '$300', 300, true);
const MIX = chip('🌱', 'mix_semillas', 'Mix Semillas', '$60/pza', 60);
const ENS_JICAMA = chip('🥗', 'ensalada_jicama', 'Ensalada Jícama', '$50/pza', 50);

// Match by product code prefix
const CROSS_SELL_RULES: { match: (code: string) => boolean; chips: CrossSellChip[] }[] = [
  { match: c => c.startsWith('breakfast') || c === 'desayuno_berlioz' || c.startsWith('box_chilaquiles') || c === 'healthy_breakfast', chips: [CAFE, AGUA_B, COLETTE] },
  { match: c => ['golden_box', 'black_box', 'white_box', 'blt_box', 'aqua_box'].includes(c), chips: [CAFE, CRUDITES, AGUA_J] },
  { match: c => c === 'surtido_colette', chips: [CAFE, AGUA_J, COOKIES] },
  { match: c => c === 'surtido_camille' || c === 'surtido_voltaire', chips: [CAFE, AGUA_J, SNACKS] },
  { match: c => c === 'surtido_hugo', chips: [CAFE, AGUA_J, CRUDITES] },
  { match: c => c === 'cb_pm', chips: [CAFE, CRUDITES, COLETTE] },
  { match: c => c === 'cb_am_cafe' || c === 'cb_am_jugo', chips: [CAFE, SNACKS, COLETTE] },
  { match: c => c.includes('piropo'), chips: [CAFE, SNACKS] },
  { match: c => c === 'salmon_box' || c === 'orzo_pasta_salad_box' || c === 'green_box', chips: [CAFE, MIX, ENS_JICAMA] },
  { match: c => c === 'pink_box', chips: [CAFE, CRUDITES, AGUA_J] },
  { match: c => c === 'mini_box' || c.startsWith('lunch_bag'), chips: [CAFE, AGUA_B, SNACKS] },
  { match: c => c === 'snack_bag', chips: [CAFE, SNACKS] },
];

export function getCrossSells(item: PackageItem, existingCodes: string[]): CrossSellChip[] {
  for (const rule of CROSS_SELL_RULES) {
    if (rule.match(item.code)) {
      return rule.chips.filter(ch => !existingCodes.includes(ch.code));
    }
  }
  // Default: suggest Café/Té and water
  return [CAFE, AGUA_B].filter(ch => !existingCodes.includes(ch.code));
}

// ── SEASONALITY ──
export function getSeasonalMessage(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const m = d.getMonth(); // 0-indexed
  
  if (m === 9 || m === 10) return '📅 Esta es época de alta demanda — confirma con anticipación.';
  if (m === 11) return '🎄 ¿Algo especial para el cierre de año o posada?';
  if (m === 3) return '🌴 Esta semana puede haber restricciones operativas (Semana Santa) — confirma disponibilidad.';
  if (m === 0) return '🎉 ¡Bienvenido al año! Hay disponibilidad inmediata.';
  return null;
}

// ── ESENCIAL NUDGE ──
export const ESENCIAL_BEVERAGE_NUDGE = 'El 85% de nuestros clientes agrega bebidas a este pedido';
