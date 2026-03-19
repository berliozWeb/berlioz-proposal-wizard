import { describe, it, expect } from 'vitest';
import { GenerarPropuestaUseCase } from '@/application/use-cases/GenerarPropuestaUseCase';
import { DeterministicProposalGenerator } from '@/infrastructure/proposal/DeterministicProposalGenerator';
import { DEFAULT_INTAKE } from '@/domain/entities/IntakeForm';

describe('GenerarPropuestaUseCase', () => {
  const generator = new DeterministicProposalGenerator();
  const useCase = new GenerarPropuestaUseCase(generator);

  it('fails when eventType is empty', () => {
    const result = useCase.execute(DEFAULT_INTAKE);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.field).toBe('eventType');
  });

  it('fails when nivelEsperado is empty', () => {
    const form = { ...DEFAULT_INTAKE, eventType: 'desayuno' as const };
    const result = useCase.execute(form);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.field).toBe('nivelEsperado');
  });

  it('fails when personas is 0', () => {
    const form = {
      ...DEFAULT_INTAKE,
      eventType: 'desayuno' as const,
      nivelEsperado: 'balanceado' as const,
      personas: 0,
    };
    const result = useCase.execute(form);
    expect(result.success).toBe(false);
  });

  it('generates a valid proposal with complete form', () => {
    const form = {
      ...DEFAULT_INTAKE,
      nombre: 'Juan',
      empresa: 'Acme',
      eventType: 'desayuno' as const,
      nivelEsperado: 'balanceado' as const,
      personas: 30,
      fechaInicio: '2026-04-01',
      horasEntrega: ['9:00am'],
    };
    const result = useCase.execute(form);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.packages).toHaveLength(3);
      expect(result.data.packages[0].id).toBe('basico');
      expect(result.data.packages[1].id).toBe('recomendado');
      expect(result.data.packages[2].id).toBe('premium');
      expect(result.data.proposalId).toMatch(/^BZ-/);
      expect(result.data.intro).toContain('Juan');
      expect(result.data.intro).toContain('Acme');
    }
  });
});
