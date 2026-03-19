import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Lead {
  name: string;
  company: string;
  phone: string;
  email: string;
  eventType: string;
  date: string;
  personas: number;
  packageSelected: string;
  timestamp: string;
}

const EVENT_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  coffee_break: 'Coffee break',
  comida: 'Comida',
  capacitacion: 'Capacitación',
  evento_especial: 'Evento especial',
  otro: 'Otro',
};

interface LeadsViewerModalProps {
  open: boolean;
  onClose: () => void;
}

const LeadsViewerModal = ({ open, onClose }: LeadsViewerModalProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem('berlioz_leads');
        setLeads(raw ? JSON.parse(raw) : []);
      } catch {
        setLeads([]);
      }
    }
  }, [open]);

  const copyCSV = () => {
    const header = 'Fecha,Nombre,Empresa,Email,Teléfono,Evento,Paquete';
    const rows = leads.map((l) =>
      [l.timestamp ? new Date(l.timestamp).toLocaleDateString('es-MX') : '', l.name, l.company, l.email, l.phone, EVENT_LABELS[l.eventType] || l.eventType, l.packageSelected].map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(',')
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    toast.success('CSV copiado al portapapeles');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-4xl mx-4 p-6 max-h-[80vh] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl font-semibold text-foreground">Leads capturados</h3>
          <div className="flex gap-2">
            <button
              onClick={copyCSV}
              disabled={leads.length === 0}
              className="px-4 py-2 rounded-lg border border-border text-foreground font-body text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              Copiar como CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-foreground font-body text-xs font-medium hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No hay leads capturados aún.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Fecha', 'Nombre', 'Empresa', 'Email', 'Teléfono', 'Evento', 'Paquete'].map((h) => (
                    <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono">{l.timestamp ? new Date(l.timestamp).toLocaleDateString('es-MX') : '—'}</td>
                    <td className="py-2 px-2">{l.name}</td>
                    <td className="py-2 px-2">{l.company}</td>
                    <td className="py-2 px-2">{l.email}</td>
                    <td className="py-2 px-2 font-mono">{l.phone || '—'}</td>
                    <td className="py-2 px-2">{EVENT_LABELS[l.eventType] || l.eventType}</td>
                    <td className="py-2 px-2">{l.packageSelected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsViewerModal;
