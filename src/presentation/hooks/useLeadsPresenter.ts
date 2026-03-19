import { useState, useEffect, useCallback } from 'react';
import { useDependencies } from '@/presentation/providers/AppDependenciesProvider';
import { mapLeadToViewModel, leadsToCSV, type LeadRowViewModel } from '@/application/dto/LeadViewModel';
import type { Lead } from '@/domain/entities/Lead';

export function useLeadsPresenter(open: boolean) {
  const { obtenerLeads } = useDependencies();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewModels, setViewModels] = useState<LeadRowViewModel[]>([]);

  useEffect(() => {
    if (open) {
      const result = obtenerLeads.execute();
      if (result.success) {
        setLeads(result.data);
        setViewModels(result.data.map(mapLeadToViewModel));
      }
    }
  }, [open, obtenerLeads]);

  const getCSV = useCallback(() => leadsToCSV(leads), [leads]);

  return { viewModels, isEmpty: viewModels.length === 0, getCSV };
}
