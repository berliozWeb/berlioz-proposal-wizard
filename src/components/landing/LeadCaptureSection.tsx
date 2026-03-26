import { useRef, useState, useEffect, useCallback } from "react";
import { User, Building2, Phone, ArrowDown, ChevronRight } from "lucide-react";
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const empresaRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    };
    window.addEventListener('berlioz:shake-lead', handler);
    return () => window.removeEventListener('berlioz:shake-lead', handler);
  }, []);

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

  const shakeClass = (value: string) =>
    !isComplete && shaking && value.trim().length < 2 ? 'animate-shake' : '';

  const inputWrapperStyle = (field: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderBottom: `2px solid ${focusedField === field ? 'hsl(var(--gold))' : 'hsl(var(--primary) / 0.25)'}`,
    paddingBottom: 8,
    transition: 'border-color 0.2s',
  });

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 15,
    color: 'hsl(var(--foreground))',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    paddingTop: 2,
  };

  return (
    <section className="max-w-3xl mx-auto px-6 animate-fade-in-up" style={{ paddingTop: 40, paddingBottom: 8 }}>
      {/* Section intro */}
      <div className="text-center mb-8">
        <h2
          className="font-heading text-foreground"
          style={{ fontSize: 26 }}
        >
          Cotiza tu evento en 2 minutos
        </h2>
        <div
          className="mx-auto mt-2 mb-3"
          style={{ width: 40, height: 2, background: 'hsl(var(--gold))' }}
        />
        <p className="font-body text-muted-foreground" style={{ fontSize: 13 }}>
          Sin compromiso · Entrega a toda la CDMX · Respuesta inmediata
        </p>
      </div>

      {/* Glass card */}
      <div
        className={shaking ? 'animate-shake' : ''}
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 20,
          boxShadow: '0 4px 32px 0 rgba(0,61,91,0.08), 0 1px 4px 0 rgba(0,0,0,0.04)',
          padding: '28px 32px 24px',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Nombre */}
          <div className={shakeClass(nombre)}>
            <label
              htmlFor="lead-nombre-input"
              className="font-body uppercase"
              style={{ fontSize: 10, letterSpacing: '0.25em', color: 'hsl(var(--gold))', display: 'block', marginBottom: 8 }}
            >
              Nombre
            </label>
            <div style={inputWrapperStyle('nombre')}>
              <User style={{ width: 15, height: 15, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
              <input
                ref={nombreRef}
                id="lead-nombre-input"
                type="text"
                value={nombre}
                onChange={(e) => onUpdate('nombre', e.target.value)}
                onFocus={() => setFocusedField('nombre')}
                onBlur={() => setFocusedField(null)}
                placeholder="Tu nombre"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Empresa */}
          <div className={`relative ${shakeClass(empresa)}`} ref={dropdownRef}>
            <label
              className="font-body uppercase"
              style={{ fontSize: 10, letterSpacing: '0.25em', color: 'hsl(var(--gold))', display: 'block', marginBottom: 8 }}
            >
              Empresa
            </label>
            <div style={inputWrapperStyle('empresa')}>
              <Building2 style={{ width: 15, height: 15, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
              <input
                ref={empresaRef}
                type="text"
                value={empresa}
                onChange={(e) => handleEmpresaChange(e.target.value)}
                onFocus={() => { setFocusedField('empresa'); if (empresa.trim()) handleEmpresaChange(empresa); }}
                onBlur={() => setFocusedField(null)}
                placeholder="Tu empresa"
                style={inputStyle}
              />
            </div>
            {showDropdown && (suggestions.length > 0 || (!exactMatch && empresa.trim().length > 0)) && (
              <div
                className="absolute left-0 right-0 top-full z-50 overflow-hidden"
                style={{
                  marginTop: 6,
                  background: '#fff',
                  border: '1px solid #E8E6DF',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  maxHeight: 5 * 44,
                  overflowY: 'auto',
                }}
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

          {/* Celular */}
          <div className={shakeClass(celular)}>
            <label
              className="font-body uppercase"
              style={{ fontSize: 10, letterSpacing: '0.25em', color: 'hsl(var(--gold))', display: 'block', marginBottom: 8 }}
            >
              Celular
            </label>
            <div style={inputWrapperStyle('celular')}>
              <Phone style={{ width: 15, height: 15, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
              <input
                ref={celularRef}
                type="tel"
                value={celular}
                onChange={(e) => onUpdate('celular', e.target.value)}
                onFocus={() => setFocusedField('celular')}
                onBlur={() => setFocusedField(null)}
                placeholder="Tu celular"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-7">
          <button
            type="button"
            onClick={handleArrowClick}
            className="w-full flex items-center justify-center gap-2 font-body font-semibold transition-all duration-300"
            style={{
              height: 48,
              borderRadius: 999,
              background: isComplete ? 'hsl(var(--gold))' : 'hsl(var(--primary) / 0.08)',
              color: isComplete ? '#fff' : 'hsl(var(--muted-foreground))',
              fontSize: 14,
              cursor: isComplete ? 'pointer' : 'default',
              boxShadow: isComplete ? '0 4px 16px hsl(var(--gold) / 0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {isComplete ? (
              <>
                Ver opciones y precios
                <ChevronRight style={{ width: 16, height: 16 }} />
              </>
            ) : (
              <>
                <ArrowDown style={{ width: 14, height: 14 }} className="animate-bob" />
                Completa tus datos para continuar
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default LeadCaptureSection;
