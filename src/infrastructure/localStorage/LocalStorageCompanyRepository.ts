import type { ICompanyRepository } from '@/domain/repositories/ICompanyRepository';
import type { Result } from '@/domain/shared/Result';
import { ok } from '@/domain/shared/Result';

const STORAGE_KEY = 'berlioz_companies';

export class LocalStorageCompanyRepository implements ICompanyRepository {
  getAll(): Result<string[], Error> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return ok(raw ? JSON.parse(raw) : []);
    } catch {
      return ok([]);
    }
  }

  save(company: string): Result<void, Error> {
    try {
      const result = this.getAll();
      const companies = result.success ? result.data : [];
      if (!companies.some((c) => c.toLowerCase() === company.toLowerCase())) {
        companies.push(company);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
      }
      return ok(undefined);
    } catch {
      return ok(undefined);
    }
  }
}
