import { useState, useEffect, useRef } from "react";
import RadioCard from "./RadioCard";
import type { IntakeForm } from "@/types";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: 'desayuno', icon: '🍳', label: 'Desayuno corporativo' },
  { value: 'coffee_break', icon: '☕', label: 'Coffee break' },
  { value: 'comida', icon: '🍱', label: 'Comida de trabajo' },
  { value: 'capacitacion', icon: '🎓', label: 'Capacitación (día completo)' },
  { value: 'evento_especial', icon: '🎉', label: 'Evento especial' },
  { value: 'otro', icon: '📦', label: 'Otro' },
] as const;

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

interface StepEventTypeProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const inputClass =
  "w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";

const StepEventType = ({ form, onChange }: StepEventTypeProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const leadComplete = form.nombre.trim() !== '' && form.empresa.trim() !== '' && form.celular.trim() !== '';

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
    onChange({ ...form, empresa: value });
    const saved = getSavedCompanies();
    const filtered = saved.filter((c) =>
      c.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered);
    setShowDropdown(value.trim().length > 0);
  };

  const selectCompany = (name: string) => {
    onChange({ ...form, empresa: name });
    setShowDropdown(false);
  };

  const exactMatch = suggestions.some(
    (s) => s.toLowerCase() === form.empresa.trim().toLowerCase()
  );

  return (
    <div className="animate-slide-in space-y-8">
      {/* Lead capture */}
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
          Cuéntanos sobre ti
        </h2>
        <p className="text-muted-foreground mb-6">
          Estos datos aparecerán en tu cotización
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tu nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => onChange({ ...form, nombre: e.target.value })}
              placeholder="Nombre completo"
              className={inputClass}
            />
          </div>
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tu empresa</label>
            <input
              ref={inputRef}
              type="text"
              value={form.empresa}
              onChange={(e) => handleEmpresaChange(e.target.value)}
              onFocus={() => {
                if (form.empresa.trim().length > 0) {
                  handleEmpresaChange(form.empresa);
                }
              }}
              placeholder="Nombre de la empresa"
              className={inputClass}
              autoComplete="off"
            />
            {showDropdown && (suggestions.length > 0 || (!exactMatch && form.empresa.trim())) && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => selectCompany(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
                {!exactMatch && form.empresa.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      saveCompany(form.empresa.trim());
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-primary font-medium hover:bg-muted transition-colors border-t border-border"
                  >
                    + Agregar '{form.empresa.trim()}'
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tu celular</label>
            <input
              type="tel"
              value={form.celular}
              onChange={(e) => onChange({ ...form, celular: e.target.value })}
              placeholder="55 1234 5678"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Event type selection */}
      <div className={cn(!leadComplete && "opacity-40 pointer-events-none transition-opacity")}>
        <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
          ¿Qué tipo de evento tienes?
        </h2>
        <p className="text-muted-foreground mb-6">
          Selecciona el que mejor describa tu evento
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EVENT_TYPES.map((et) => (
            <RadioCard
              key={et.value}
              icon={et.icon}
              label={et.label}
              selected={form.eventType === et.value}
              onClick={() => onChange({ ...form, eventType: et.value })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepEventType;
