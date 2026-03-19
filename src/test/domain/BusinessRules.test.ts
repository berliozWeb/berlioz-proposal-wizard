import { describe, it, expect } from 'vitest';
import { getDateDisclaimer, getDeliveryCount, getDayCount } from '@/domain/shared/BusinessRules';

describe('BusinessRules', () => {
  describe('getDateDisclaimer', () => {
    it('returns null for empty date', () => {
      expect(getDateDisclaimer('')).toBeNull();
    });

    it('returns saturday disclaimer for a Saturday', () => {
      // 2026-03-21 is a Saturday
      const result = getDateDisclaimer('2026-03-21');
      expect(result).toContain('sábados');
    });

    it('returns sunday/holiday disclaimer for Jan 1', () => {
      const result = getDateDisclaimer('2026-01-01');
      expect(result).toContain('festivos');
    });

    it('returns null for normal weekday', () => {
      // 2026-03-19 is Thursday
      const result = getDateDisclaimer('2026-03-19');
      expect(result).toBeNull();
    });
  });

  describe('getDeliveryCount', () => {
    it('returns horasEntrega length for single-day events', () => {
      expect(getDeliveryCount(false, [], ['9:00am', '1:00pm'], '2026-04-01')).toBe(2);
    });

    it('returns at least 1 for single-day with no hours', () => {
      expect(getDeliveryCount(false, [], [], '2026-04-01')).toBe(1);
    });

    it('multiplies periods by days for multi-day events', () => {
      expect(getDeliveryCount(true, ['manana', 'mediodia'], [], '2026-04-01', '2026-04-03')).toBe(6);
    });
  });

  describe('getDayCount', () => {
    it('returns 1 when no end date', () => {
      expect(getDayCount('2026-04-01')).toBe(1);
    });

    it('returns correct day count', () => {
      expect(getDayCount('2026-04-01', '2026-04-03')).toBe(3);
    });
  });
});
