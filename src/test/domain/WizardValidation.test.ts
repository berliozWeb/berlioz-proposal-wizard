import { describe, it, expect } from 'vitest';
import { canAdvanceStep } from '@/domain/shared/WizardValidation';
import { DEFAULT_INTAKE } from '@/domain/entities/IntakeForm';

describe('WizardValidation', () => {
  it('step 1: requires nombre, empresa, celular, eventType', () => {
    expect(canAdvanceStep(1, DEFAULT_INTAKE)).toBe(false);

    const partial = { ...DEFAULT_INTAKE, nombre: 'Juan', empresa: 'Acme', celular: '55' };
    expect(canAdvanceStep(1, partial)).toBe(false); // no eventType

    const complete = { ...partial, eventType: 'desayuno' as const };
    expect(canAdvanceStep(1, complete)).toBe(true);
  });

  it('step 2: requires personas > 0 and fechaInicio', () => {
    expect(canAdvanceStep(2, DEFAULT_INTAKE)).toBe(false);

    const withDate = { ...DEFAULT_INTAKE, personas: 30, fechaInicio: '2026-04-01' };
    expect(canAdvanceStep(2, withDate)).toBe(true);
  });

  it('step 3: requires at least one delivery hour', () => {
    expect(canAdvanceStep(3, DEFAULT_INTAKE)).toBe(false);

    const withHour = { ...DEFAULT_INTAKE, horasEntrega: ['9:00am'] };
    expect(canAdvanceStep(3, withHour)).toBe(true);
  });

  it('step 4+: returns false for unknown steps', () => {
    expect(canAdvanceStep(4, DEFAULT_INTAKE)).toBe(false);
  });
});
