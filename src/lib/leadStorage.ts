/* localStorage helpers for leads and company autocomplete */

const LEADS_KEY = 'berlioz_leads';
const EMPRESAS_KEY = 'berlioz_empresas';

export interface StoredLead {
  nombre: string;
  empresa: string;
  celular: string;
  timestamp: string;
  path: string | null;
}

export function saveLeadToStorage(lead: Omit<StoredLead, 'timestamp' | 'path'>): void {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    const leads: StoredLead[] = raw ? JSON.parse(raw) : [];
    leads.push({ ...lead, timestamp: new Date().toISOString(), path: null });
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch { /* silent */ }
}

export function updateLastLeadPath(path: string): void {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    if (!raw) return;
    const leads: StoredLead[] = JSON.parse(raw);
    if (leads.length > 0) {
      leads[leads.length - 1].path = path;
      localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    }
  } catch { /* silent */ }
}

export function getAllLeads(): StoredLead[] {
  try {
    const raw = localStorage.getItem(LEADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getEmpresas(): string[] {
  try {
    const raw = localStorage.getItem(EMPRESAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEmpresa(name: string): void {
  try {
    const empresas = getEmpresas();
    if (!empresas.some((e) => e.toLowerCase() === name.toLowerCase())) {
      empresas.push(name);
      localStorage.setItem(EMPRESAS_KEY, JSON.stringify(empresas));
    }
  } catch { /* silent */ }
}

export function searchEmpresas(query: string): string[] {
  if (!query.trim()) return [];
  const all = getEmpresas();
  return all.filter((e) => e.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
}
