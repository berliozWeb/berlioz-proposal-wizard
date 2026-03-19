import { describe, it, expect, beforeEach } from 'vitest';
import { GuardarLeadUseCase } from '@/application/use-cases/GuardarLeadUseCase';
import { LocalStorageLeadRepository } from '@/infrastructure/localStorage/LocalStorageLeadRepository';
import { LocalStorageCompanyRepository } from '@/infrastructure/localStorage/LocalStorageCompanyRepository';
import { DEFAULT_INTAKE } from '@/domain/entities/IntakeForm';

describe('GuardarLeadUseCase', () => {
  let useCase: GuardarLeadUseCase;

  beforeEach(() => {
    localStorage.clear();
    useCase = new GuardarLeadUseCase(
      new LocalStorageLeadRepository(),
      new LocalStorageCompanyRepository(),
    );
  });

  it('fails on empty email', () => {
    const result = useCase.execute({
      form: DEFAULT_INTAKE,
      email: '',
      empresa: 'Acme',
      packageSelected: 'Esencial',
    });
    expect(result.success).toBe(false);
  });

  it('saves lead and company correctly', () => {
    const form = { ...DEFAULT_INTAKE, nombre: 'Juan', celular: '55', eventType: 'desayuno' as const, fechaInicio: '2026-04-01', personas: 30 };
    const result = useCase.execute({
      form,
      email: 'juan@acme.com',
      empresa: 'Acme Corp',
      packageSelected: 'Equilibrado',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('juan@acme.com');
      expect(result.data.company).toBe('Acme Corp');
    }

    const leads = JSON.parse(localStorage.getItem('berlioz_leads') || '[]');
    expect(leads).toHaveLength(1);

    const companies = JSON.parse(localStorage.getItem('berlioz_companies') || '[]');
    expect(companies).toContain('Acme Corp');
  });
});
