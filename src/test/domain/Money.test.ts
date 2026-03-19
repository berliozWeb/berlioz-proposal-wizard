import { describe, it, expect } from 'vitest';
import { formatMXN, calculateIVA, roundCents } from '@/domain/value-objects/Money';

describe('Money value object', () => {
  it('formatMXN formats correctly', () => {
    const result = formatMXN(1500);
    expect(result).toContain('1,500');
  });

  it('calculateIVA applies 16% rate', () => {
    expect(calculateIVA(1000)).toBe(160);
    expect(calculateIVA(999.99)).toBeCloseTo(160, 0);
  });

  it('roundCents rounds to 2 decimals', () => {
    expect(roundCents(100.456)).toBe(100.46);
    expect(roundCents(100.001)).toBe(100);
  });
});
