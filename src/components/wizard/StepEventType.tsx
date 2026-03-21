import { useState, useRef, useEffect } from "react";
import RadioCard from "./RadioCard";
import type { IntakeForm } from "@/domain/entities/IntakeForm";
import { EVENT_TYPE_OPTIONS, EVENT_TYPE_DESCRIPTORS } from "@/domain/value-objects/EventType";
import { useCompanyAutocomplete } from "@/presentation/hooks/useCompanyAutocomplete";
import { cn } from "@/lib/utils";

interface StepEventTypeProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const inputClass =
  "w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";

const StepEventType = ({ form, onChange }: StepEventTypeProps) => {
  const autocomplete = useCompanyAutocomplete(form.empresa);

  const leadComplete = form.nombre.trim() !== '' && form.empresa.trim() !== '' && form.celular.trim() !== '';

  // Sync autocomplete value back to form
  useEffect(() => {
    if (autocomplete.value !== form.empresa) {
      onChange({ ...form, empresa: autocomplete.value });
    }
  }, [autocomplete.value]);

  const handleEmpresaChange = (value: string) => {
    autocomplete.onChange(value);
    onChange({ ...form, empresa: value });
  };

  return (
    <div className="animate-slide-in space-y-8">
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
          <div className="relative" ref={autocomplete.dropdownRef}>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tu empresa</label>
            <input
              type="text"
              value={form.empresa}
              onChange={(e) => handleEmpresaChange(e.target.value)}
              onFocus={autocomplete.onFocus}
              placeholder="Nombre de la empresa"
              className={inputClass}
              autoComplete="off"
            />
            {autocomplete.showDropdown && (autocomplete.suggestions.length > 0 || (!autocomplete.exactMatch && form.empresa.trim())) && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {autocomplete.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      autocomplete.selectCompany(s);
                      onChange({ ...form, empresa: s });
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {s}
                  </button>
                ))}
                {!autocomplete.exactMatch && form.empresa.trim() && (
                  <button
                    type="button"
                    onClick={autocomplete.saveNew}
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

      <div className={cn(!leadComplete && "opacity-40 pointer-events-none transition-opacity")}>
        <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
          ¿Qué tipo de evento tienes?
        </h2>
        <p className="text-muted-foreground mb-6">
          Selecciona el que mejor describa tu evento
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EVENT_TYPE_OPTIONS.map((et) => (
            <RadioCard
              key={et.value}
              icon={et.icon}
              label={et.label}
              descriptor={EVENT_TYPE_DESCRIPTORS[et.value]}
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
