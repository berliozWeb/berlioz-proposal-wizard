import { useRef, useState, useEffect, useCallback } from "react";
import { analytics } from "@/lib/mixpanel";
import { saveLeadToStorage, saveEmpresa, searchEmpresas } from "@/lib/leadStorage";

interface LeadCaptureSectionProps {
  nombre: string;
  empresa: string;
  celular: string;
  onUpdate: (field: 'nombre' | 'empresa' | 'celular', value: string) => void;
  isComplete: boolean;
}

const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.3em',
  color: 'hsl(var(--gold))',
  textTransform: 'uppercase' as const,
  marginBottom: 4,
  fontFamily: 'var(--font-body)',
};

const INPUT_STYLE: React.CSSProperties = {
  border: 'none',
  borderBottom: '2px solid hsl(var(--primary))',
  background: 'transparent',
  padding: '12px 4px',
  fontSize: 16,
  color: 'hsl(var(--foreground))',
  outline: 'none',
  width: '100%',
  fontFamily: 'var(--font-body)',
};

const DIVIDER_STYLE: React.CSSProperties = {
  width: 1,
  background: '#E8E6DF',
  alignSelf: 'stretch',
  margin: '8px 0',
};

const LeadCaptureSection = ({ nombre, empresa, celular, onUpdate, isComplete }: LeadCaptureSectionProps) => {
  const [shaking, setShaking] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const empresaRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      saveEmpresa(empresa.trim());
      saveLeadToStorage({ nombre: nombre.trim(), empresa: empresa.trim(), celular: celular.trim() });
      analytics.track('lead_captured', { nombre, empresa, timestamp: new Date().toISOString() });
      analytics.identify(celular);
      analytics.setUser({ '$name': nombre, empresa, celular });
      document.getElementById('entry-points')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      if (nombre.trim().length < 2) nombreRef.current?.focus();
      else if (empresa.trim().length < 2) empresaRef.current?.focus();
      else if (celular.trim().length < 2) celularRef.current?.focus();
    }
  };

  const getInputStyle = (fieldName: string, value: string): React.CSSProperties => ({
    ...INPUT_STYLE,
    borderBottomColor: focusedField === fieldName ? '#C9973A' : '#1C3A2F',
  });

  const shakeClass = (value: string) =>
    !isComplete && shaking && value.trim().length < 2 ? 'animate-shake' : '';

  return (
    <section className="max-w-3xl mx-auto px-6" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <div className="flex flex-col sm:flex-row items-stretch gap-6 sm:gap-0">
        {/* Nombre */}
        <div className={`flex-1 min-w-0 ${shakeClass(nombre)}`}>
          <div style={FIELD_LABEL_STYLE}>Nombre</div>
          <input
            ref={nombreRef}
            type="text"
            value={nombre}
            onChange={(e) => onUpdate('nombre', e.target.value)}
            onFocus={() => setFocusedField('nombre')}
            onBlur={() => setFocusedField(null)}
            placeholder="Tu nombre"
            style={getInputStyle('nombre', nombre)}
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block" style={{ ...DIVIDER_STYLE, margin: '8px 24px' }} />

        {/* Empresa */}
        <div className={`flex-1 min-w-0 relative ${shakeClass(empresa)}`} ref={dropdownRef}>
          <div style={FIELD_LABEL_STYLE}>Empresa</div>
          <input
            ref={empresaRef}
            type="text"
            value={empresa}
            onChange={(e) => handleEmpresaChange(e.target.value)}
            onFocus={() => { setFocusedField('empresa'); if (empresa.trim()) handleEmpresaChange(empresa); }}
            onBlur={() => setFocusedField(null)}
            placeholder="Tu empresa"
            style={getInputStyle('empresa', empresa)}
          />
          {showDropdown && (suggestions.length > 0 || (!exactMatch && empresa.trim().length > 0)) && (
            <div
              className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden"
              style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, maxHeight: 5 * 44, overflowY: 'auto' }}
            >
              {suggestions.map((s) => (
                <div
                  key={s}
                  onClick={() => selectSuggestion(s)}
                  className="font-body cursor-pointer"
                  style={{ padding: '10px 16px', fontSize: 14 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F3EF')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {s}
                </div>
              ))}
              {!exactMatch && empresa.trim().length > 0 && (
                <div
                  onClick={() => { saveEmpresa(empresa.trim()); setShowDropdown(false); }}
                  className="font-body cursor-pointer font-medium"
                  style={{ padding: '10px 16px', fontSize: 14, color: '#C9973A' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F3EF')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  + Agregar &apos;{empresa.trim()}&apos;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block" style={{ ...DIVIDER_STYLE, margin: '8px 24px' }} />

        {/* Celular */}
        <div className={`flex-1 min-w-0 ${shakeClass(celular)}`}>
          <div style={FIELD_LABEL_STYLE}>Celular</div>
          <input
            ref={celularRef}
            type="tel"
            value={celular}
            onChange={(e) => onUpdate('celular', e.target.value)}
            onFocus={() => setFocusedField('celular')}
            onBlur={() => setFocusedField(null)}
            placeholder="Tu celular"
            style={getInputStyle('celular', celular)}
          />
        </div>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center" style={{ marginTop: 32 }}>
        <button
          type="button"
          onClick={handleArrowClick}
          className="animate-bob bg-transparent border-none p-0 cursor-pointer transition-all duration-300"
          style={{
            color: isComplete ? '#C9973A' : '#1C3A2F',
            fontSize: 24,
            lineHeight: 1,
            transform: isComplete ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          ↓
        </button>

        {!isComplete && (
          <p className="text-center font-body" style={{ fontSize: 12, marginTop: 12, color: '#C9973A' }}>
            Completa tus datos para continuar
          </p>
        )}
      </div>
    </section>
  );
};

export default LeadCaptureSection;
