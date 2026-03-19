import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import type { Lead } from '@/domain/entities/Lead';
import type { Result } from '@/domain/shared/Result';

export class ObtenerLeadsUseCase {
  constructor(private readonly repo: ILeadRepository) {}

  execute(): Result<Lead[], Error> {
    return this.repo.getAll();
  }
}
