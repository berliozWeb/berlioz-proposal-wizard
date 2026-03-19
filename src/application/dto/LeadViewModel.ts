import type { Lead } from '@/domain/entities/Lead';
import { EVENT_TYPE_LABELS, type EventType } from '@/domain/value-objects/EventType';

export interface LeadRowViewModel {
  date: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  eventLabel: string;
  packageSelected: string;
}

export function mapLeadToViewModel(lead: Lead): LeadRowViewModel {
  return {
    date: lead.timestamp ? new Date(lead.timestamp).toLocaleDateString('es-MX') : '—',
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone || '—',
    eventLabel: EVENT_TYPE_LABELS[lead.eventType as EventType] || lead.eventType,
    packageSelected: lead.packageSelected,
  };
}

export function leadsToCSV(leads: Lead[]): string {
  const header = 'Fecha,Nombre,Empresa,Email,Teléfono,Evento,Paquete';
  const rows = leads.map((l) => {
    const vm = mapLeadToViewModel(l);
    return [vm.date, vm.name, vm.company, vm.email, vm.phone, vm.eventLabel, vm.packageSelected]
      .map((v) => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',');
  });
  return [header, ...rows].join('\n');
}
