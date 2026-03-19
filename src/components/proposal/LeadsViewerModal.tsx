import { toast } from "sonner";
import { useLeadsPresenter } from "@/presentation/hooks/useLeadsPresenter";

interface LeadsViewerModalProps {
  open: boolean;
  onClose: () => void;
}

const COLUMNS = ['Fecha', 'Nombre', 'Empresa', 'Email', 'Teléfono', 'Evento', 'Paquete'];

const LeadsViewerModal = ({ open, onClose }: LeadsViewerModalProps) => {
  const { viewModels, isEmpty, getCSV } = useLeadsPresenter(open);

  const copyCSV = () => {
    navigator.clipboard.writeText(getCSV());
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
              disabled={isEmpty}
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
          {isEmpty ? (
            <p className="text-sm text-muted-foreground text-center py-10">No hay leads capturados aún.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {COLUMNS.map((h) => (
                    <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewModels.map((vm, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-2 font-mono">{vm.date}</td>
                    <td className="py-2 px-2">{vm.name}</td>
                    <td className="py-2 px-2">{vm.company}</td>
                    <td className="py-2 px-2">{vm.email}</td>
                    <td className="py-2 px-2 font-mono">{vm.phone}</td>
                    <td className="py-2 px-2">{vm.eventLabel}</td>
                    <td className="py-2 px-2">{vm.packageSelected}</td>
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
