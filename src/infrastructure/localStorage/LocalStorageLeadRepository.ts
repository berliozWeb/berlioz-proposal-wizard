import type { ILeadRepository } from '@/domain/repositories/ILeadRepository';
import type { Lead } from '@/domain/entities/Lead';
import type { Result } from '@/domain/shared/Result';
import { ok, fail } from '@/domain/shared/Result';
import { UnexpectedError } from '@/domain/errors';

const STORAGE_KEY = 'berlioz_leads';

export class LocalStorageLeadRepository implements ILeadRepository {
  save(lead: Lead): Result<void, Error> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const leads: Lead[] = raw ? JSON.parse(raw) : [];
      leads.push(lead);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
      return ok(undefined);
    } catch (e) {
      return fail(new UnexpectedError('Error guardando lead'));
    }
  }

  getAll(): Result<Lead[], Error> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return ok(raw ? JSON.parse(raw) : []);
    } catch {
      return ok([]);
    }
  }
}
