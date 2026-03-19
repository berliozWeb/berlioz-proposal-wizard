import type { Lead } from '@/domain/entities/Lead';
import type { Result } from '@/domain/shared/Result';

export interface ILeadRepository {
  save(lead: Lead): Result<void, Error>;
  getAll(): Result<Lead[], Error>;
}
