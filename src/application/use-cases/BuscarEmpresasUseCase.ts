import type { ICompanyRepository } from '@/domain/repositories/ICompanyRepository';
import type { Result } from '@/domain/shared/Result';

export class BuscarEmpresasUseCase {
  constructor(private readonly repo: ICompanyRepository) {}

  execute(query: string): Result<string[], Error> {
    const result = this.repo.getAll();
    if (!result.success) return result;

    if (!query.trim()) return result;

    const filtered = result.data.filter((c) =>
      c.toLowerCase().includes(query.toLowerCase()),
    );
    return { success: true, data: filtered };
  }

  save(name: string): void {
    this.repo.save(name);
  }
}
