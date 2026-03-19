import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import type { ICompanyRepository } from '@/domain/repositories/ICompanyRepository';
import type { IntakeForm } from '@/domain/entities/IntakeForm';
import type { Lead } from '@/domain/entities/Lead';
import type { Result } from '@/domain/shared/Result';
import { ok, fail } from '@/domain/shared/Result';
import { ValidationError } from '@/domain/errors';

export interface SaveLeadInput {
  form: IntakeForm;
  email: string;
  empresa: string;
  packageSelected: string;
}

export class GuardarLeadUseCase {
  constructor(
    private readonly leadRepo: ILeadRepository,
    private readonly companyRepo: ICompanyRepository,
  ) {}

  execute(input: SaveLeadInput): Result<Lead, ValidationError> {
    if (!input.email.trim()) {
      return fail(new ValidationError('Email requerido', 'email'));
    }
    if (!input.empresa.trim()) {
      return fail(new ValidationError('Empresa requerida', 'empresa'));
    }

    const lead: Lead = {
      name: input.form.nombre,
      company: input.empresa.trim(),
      phone: input.form.celular,
      email: input.email.trim(),
      eventType: input.form.eventType,
      date: input.form.fechaInicio,
      personas: input.form.personas,
      packageSelected: input.packageSelected,
      timestamp: new Date().toISOString(),
    };

    this.leadRepo.save(lead);
    this.companyRepo.save(input.empresa.trim());

    return ok(lead);
  }
}
