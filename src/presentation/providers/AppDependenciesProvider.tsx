import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

// Repositories
import { LocalStorageLeadRepository } from '@/infrastructure/localStorage/LocalStorageLeadRepository';
import { LocalStorageCompanyRepository } from '@/infrastructure/localStorage/LocalStorageCompanyRepository';
import { DeterministicProposalGenerator } from '@/infrastructure/proposal/DeterministicProposalGenerator';

// Use Cases
import { GenerarPropuestaUseCase } from '@/application/use-cases/GenerarPropuestaUseCase';
import { GuardarLeadUseCase } from '@/application/use-cases/GuardarLeadUseCase';
import { ObtenerLeadsUseCase } from '@/application/use-cases/ObtenerLeadsUseCase';
import { BuscarEmpresasUseCase } from '@/application/use-cases/BuscarEmpresasUseCase';

export interface AppDependencies {
  generarPropuesta: GenerarPropuestaUseCase;
  guardarLead: GuardarLeadUseCase;
  obtenerLeads: ObtenerLeadsUseCase;
  buscarEmpresas: BuscarEmpresasUseCase;
}

function createDependencies(): AppDependencies {
  const leadRepo = new LocalStorageLeadRepository();
  const companyRepo = new LocalStorageCompanyRepository();
  const proposalGenerator = new DeterministicProposalGenerator();

  return {
    generarPropuesta: new GenerarPropuestaUseCase(proposalGenerator),
    guardarLead: new GuardarLeadUseCase(leadRepo, companyRepo),
    obtenerLeads: new ObtenerLeadsUseCase(leadRepo),
    buscarEmpresas: new BuscarEmpresasUseCase(companyRepo),
  };
}

const DependenciesContext = createContext<AppDependencies | null>(null);

export function AppDependenciesProvider({ children }: { children: ReactNode }) {
  const deps = useMemo(createDependencies, []);
  return (
    <DependenciesContext.Provider value={deps}>
      {children}
    </DependenciesContext.Provider>
  );
}

export function useDependencies(): AppDependencies {
  const ctx = useContext(DependenciesContext);
  if (!ctx) throw new Error('useDependencies must be used within AppDependenciesProvider');
  return ctx;
}
