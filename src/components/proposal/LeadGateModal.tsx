import { useState, useEffect } from "react";
import { useCompanyAutocomplete } from "@/presentation/hooks/useCompanyAutocomplete";
import { cn } from "@/lib/utils";

interface LeadGateModalProps {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultEmpresa?: string;
  onSubmit: (email: string, empresa: string) => void;
}

const inputClass =
  "w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";

const LeadGateModal = ({ open, onClose, defaultEmail, defaultEmpresa, onSubmit }: LeadGateModalProps) => {
  const [email, setEmail] = useState(defaultEmail || '');
  const autocomplete = useCompanyAutocomplete(defaultEmpresa || '');

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail || '');
      autocomplete.setValue(defaultEmpresa || '');
    }
  }, [open, defaultEmail, defaultEmpresa]);

  const handleSubmit = () => {
    if (!email.trim() || !autocomplete.value.trim()) return;
    onSubmit(email.trim(), autocomplete.value.trim());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6 animate-slide-in">
        <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
          ¿A dónde enviamos tu propuesta?
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Confirma tus datos para continuar
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              className={inputClass}
            />
          </div>

          <div className="relative" ref={autocomplete.dropdownRef}>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirmar nombre de empresa</label>
            <input
              type="text"
              value={autocomplete.value}
              onChange={(e) => autocomplete.onChange(e.target.value)}
              onFocus={autocomplete.onFocus}
              placeholder="Nombre de la empresa"
              className={inputClass}
              autoComplete="off"
            />
            {autocomplete.showDropdown && (autocomplete.suggestions.length > 0 || (!autocomplete.exactMatch && autocomplete.value.trim())) && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {autocomplete.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => autocomplete.selectCompany(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
                {!autocomplete.exactMatch && autocomplete.value.trim() && (
                  <button
                    type="button"
                    onClick={autocomplete.saveNew}
                    className="w-full text-left px-4 py-2.5 text-sm text-primary font-medium hover:bg-muted transition-colors border-t border-border"
                  >
                    + Agregar '{autocomplete.value.trim()}'
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!email.trim() || !autocomplete.value.trim()}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold transition-colors",
              (!email.trim() || !autocomplete.value.trim()) ? "opacity-40 cursor-not-allowed" : "hover:bg-primary/90",
            )}
          >
            Ver y descargar propuesta →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadGateModal;
