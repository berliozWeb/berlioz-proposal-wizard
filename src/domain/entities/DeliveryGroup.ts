// ═══════════════════════════════════════════════════════════
// DeliveryGroup — supports single or multi-delivery events
// For single delivery, the array always has exactly 1 element.
// ═══════════════════════════════════════════════════════════

import type { ProposedProduct } from './SmartQuote';

export type QuoteItem = ProposedProduct;

export interface DeliveryGroup {
  id: string;
  date: string;          // ISO date YYYY-MM-DD
  time: string;          // HH:mm
  address: string;
  guests_count: number;
  items: QuoteItem[];
}

export type EventMode = 'single' | 'multi';

/** Pre-populates delivery_groups with empty slots = days × deliveriesPerDay */
export function buildDeliveryGroupSlots(
  days: number,
  deliveriesPerDay: number,
  defaults: { date?: string; time?: string; address?: string; guests?: number } = {},
): DeliveryGroup[] {
  const safeDays = Math.max(1, Math.min(30, Math.floor(days)));
  const safePerDay = Math.max(1, Math.min(4, Math.floor(deliveriesPerDay)));
  const groups: DeliveryGroup[] = [];

  for (let d = 0; d < safeDays; d++) {
    for (let n = 0; n < safePerDay; n++) {
      groups.push({
        id: `dg-${d + 1}-${n + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: defaults.date ?? '',
        time: defaults.time ?? '',
        address: defaults.address ?? '',
        guests_count: defaults.guests ?? 0,
        items: [],
      });
    }
  }

  return groups;
}

/** Builds a single-delivery group (default for the existing flow) */
export function buildSingleDeliveryGroup(
  defaults: { date?: string; time?: string; address?: string; guests?: number } = {},
): DeliveryGroup[] {
  return buildDeliveryGroupSlots(1, 1, defaults);
}
