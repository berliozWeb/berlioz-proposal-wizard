import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { analytics } from "@/lib/mixpanel";
import { saveLeadToStorage, saveEmpresa, searchEmpresas } from "@/lib/leadStorage";

interface LeadCaptureSectionProps {
  nombre: string;
  empresa: string;
  celular: string;
  onUpdate: (field: 'nombre' | 'empresa' | 'celular', value: string) => void;
  isComplete: boolean;
}

const LeadCaptureSection = ({ nombre, empresa, celular, onUpdate, isComplete }: LeadCaptureSectionProps) => {
  const [shaking, setShaking] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const nombreRef = useRef<HTMLInputElement>(null);
  const empresaRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleEmpresaChange = useCallback((value: string) => {
    onUpdate('empresa', value);
    const results = searchEmpresas(value);
    setSuggestions(results);
    setShowDropdown(value.trim().length > 0);
  }, [onUpdate]);

  const selectSuggestion = useCallback((name: string) => {
    onUpdate('empresa', name);
    setShowDropdown(false);
  }, [onUpdate]);

  const exactMatch = suggestions.some(
    (s) => s.toLowerCase() === empresa.trim().toLowerCase(),
  );

  const handleArrowClick = () => {
    if (isComplete) {
      // Save empresa to autocomplete list
      saveEmpresa(empresa.trim());
      // Save lead to localStorage
      saveLeadToStorage({ nombre: nombre.trim(), empresa: empresa.trim(), celular: celular.trim() });
      // Mixpanel
      analytics.track('lead_captured', {
        nombre,
        empresa,
        timestamp: new Date().toISOString(),
      });
      analytics.identify(celular);
      analytics.setUser({
        '$name': nombre,
        empresa,
        celular,
      });
      document.getElementById('entry-points')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      if (nombre.trim().length < 2) nombreRef.current?.focus();
      else if (empresa.trim().length < 2) empresaRef.current?.focus();
      else if (celular.trim().length < 2) celularRef.current?.focus();
    }
  };

  const inputClass = (value: string) =>
    `flex-1 min-w-0 rounded-xl bg-white text-foreground focus:outline-none transition-all lead-input ${
      !isComplete && shaking && value.trim().length < 2 ? 'animate-shake' : ''
    }`;

  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      <p className="text-center text-xs text-muted-foreground mb-3 tracking-wide">
        Antes de continuar
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          ref={nombreRef}
          type="text"
          value={nombre}
          onChange={(e) => onUpdate('nombre', e.target.value)}
          placeholder="Tu nombre"
          className={inputClass(nombre)}
        />
        {/* Empresa with autocomplete */}
        <div className="relative flex-1 min-w-0" ref={dropdownRef}>
          <input
            ref={empresaRef}
            type="text"
            value={empresa}
            onChange={(e) => handleEmpresaChange(e.target.value)}
            onFocus={() => { if (empresa.trim()) handleEmpresaChange(empresa); }}
            placeholder="Tu empresa"
            className={inputClass(empresa) + ' w-full'}
          />
          {showDropdown && (suggestions.length > 0 || (!exactMatch && empresa.trim().length > 0)) && (
            <div
              className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden"
              style={{
                background: '#fff',
                border: '1px solid #E8E6DF',
                borderRadius: 8,
                maxHeight: 5 * 44,
                overflowY: 'auto',
              }}
            >
              {suggestions.map((s) => (
                <div
                  key={s}
                  onClick={() => selectSuggestion(s)}
                  style={{
                    padding: '10px 16px',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F3EF')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {s}
                </div>
              ))}
              {!exactMatch && empresa.trim().length > 0 && (
                <div
                  onClick={() => {
                    saveEmpresa(empresa.trim());
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: 16,
                    cursor: 'pointer',
                    color: '#C9973A',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F3EF')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  + Agregar '{empresa.trim()}'
                </div>
              )}
            </div>
          )}
        </div>
        <input
          ref={celularRef}
          type="tel"
          value={celular}
          onChange={(e) => onUpdate('celular', e.target.value)}
          placeholder="Tu celular"
          className={inputClass(celular)}
        />
      </div>

      {/* Bare animated arrow */}
      <div className="flex flex-col items-center mt-5">
        <button
          type="button"
          onClick={handleArrowClick}
          className="animate-bob transition-all duration-300 bg-transparent border-none p-0 cursor-pointer"
          style={{
            color: isComplete ? 'hsl(var(--gold))' : 'hsl(var(--forest))',
            transform: isComplete ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          <ChevronDown className="w-7 h-7" strokeWidth={2.5} />
        </button>

        {!isComplete && (
          <p className="text-center text-xs mt-3" style={{ color: 'hsl(var(--gold))' }}>
            Completa tus datos para continuar
          </p>
        )}
      </div>
    </section>
  );
};

export default LeadCaptureSection;
