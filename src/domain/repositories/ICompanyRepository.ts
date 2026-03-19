import type { Result } from '@/domain/shared/Result';

export interface ICompanyRepository {
  getAll(): Result<string[], Error>;
  save(company: string): Result<void, Error>;
}
