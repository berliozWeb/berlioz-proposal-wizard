import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = 'berlioz_companies';

function getSavedCompanies(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCompany(name: string) {
  const companies = getSavedCompanies();
  if (!companies.some((c) => c.toLowerCase() === name.toLowerCase())) {
    companies.push(name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  }
}

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
  const [empresa, setEmpresa] = useState(defaultEmpresa || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail || '');
      setEmpresa(defaultEmpresa || '');
    }
  }, [open, defaultEmail, defaultEmpresa]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleEmpresaChange = (value: string) => {
    setEmpresa(value);
    const saved = getSavedCompanies();
    const filtered = saved.filter((c) => c.toLowerCase().includes(value.toLowerCase()));
    setSuggestions(filtered);
    setShowDropdown(value.trim().length > 0);
  };

  const exactMatch = suggestions.some((s) => s.toLowerCase() === empresa.trim().toLowerCase());

  const handleSubmit = () => {
    if (!email.trim() || !empresa.trim()) return;
    saveCompany(empresa.trim());
    onSubmit(email.trim(), empresa.trim());
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

          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirmar nombre de empresa</label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => handleEmpresaChange(e.target.value)}
              onFocus={() => { if (empresa.trim()) handleEmpresaChange(empresa); }}
              placeholder="Nombre de la empresa"
              className={inputClass}
              autoComplete="off"
            />
            {showDropdown && (suggestions.length > 0 || (!exactMatch && empresa.trim())) && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setEmpresa(s); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
                {!exactMatch && empresa.trim() && (
                  <button
                    type="button"
                    onClick={() => { saveCompany(empresa.trim()); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-primary font-medium hover:bg-muted transition-colors border-t border-border"
                  >
                    + Agregar '{empresa.trim()}'
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
            disabled={!email.trim() || !empresa.trim()}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold transition-colors",
              (!email.trim() || !empresa.trim()) ? "opacity-40 cursor-not-allowed" : "hover:bg-primary/90"
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
