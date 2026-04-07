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
    borderBottom: `2px solid ${focusedField === field ? '#014D6F' : 'rgba(1,77,111,0.25)'}`,
    paddingBottom: 8,
    transition: 'border-color 0.2s',
  });

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 15,
    color: '#014D6F',
    outline: 'none',
    fontFamily: "'Montserrat', sans-serif",
    paddingTop: 2,
  };

  return (
    <section className="max-w-3xl mx-auto px-6 animate-fade-in-up" style={{ paddingTop: 40, paddingBottom: 8 }}>
      {/* Section intro */}
      <div className="text-center mb-8">
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 26, color: '#014D6F' }}>
          Cotiza tu evento en 2 minutos
        </h2>
        <div className="mx-auto mt-2 mb-3" style={{ width: 40, height: 2, background: '#014D6F' }} />
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#888888' }}>
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
          border: '1px solid #E2D3CA',
          borderRadius: 16,
          boxShadow: '0 4px 32px 0 rgba(1,77,111,0.08)',
          padding: '28px 32px 24px',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Nombre */}
          <div className={shakeClass(nombre)}>
            <label htmlFor="lead-nombre-input" style={{ fontSize: 10, letterSpacing: '0.25em', color: '#014D6F', display: 'block', marginBottom: 8, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, textTransform: 'uppercase' as const }}>
              Nombre
            </label>
            <div style={inputWrapperStyle('nombre')}>
              <User style={{ width: 15, height: 15, color: '#888888', flexShrink: 0 }} />
              <input ref={nombreRef} id="lead-nombre-input" type="text" value={nombre} onChange={(e) => onUpdate('nombre', e.target.value)} onFocus={() => setFocusedField('nombre')} onBlur={() => setFocusedField(null)} placeholder="Tu nombre" style={inputStyle} />
            </div>
          </div>

          {/* Empresa */}
          <div className={`relative ${shakeClass(empresa)}`} ref={dropdownRef}>
            <label style={{ fontSize: 10, letterSpacing: '0.25em', color: '#014D6F', display: 'block', marginBottom: 8, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, textTransform: 'uppercase' as const }}>
              Empresa
            </label>
            <div style={inputWrapperStyle('empresa')}>
              <Building2 style={{ width: 15, height: 15, color: '#888888', flexShrink: 0 }} />
              <input ref={empresaRef} type="text" value={empresa} onChange={(e) => handleEmpresaChange(e.target.value)} onFocus={() => { setFocusedField('empresa'); if (empresa.trim()) handleEmpresaChange(empresa); }} onBlur={() => setFocusedField(null)} placeholder="Tu empresa" style={inputStyle} />
            </div>
            {showDropdown && (suggestions.length > 0 || (!exactMatch && empresa.trim().length > 0)) && (
              <div className="absolute left-0 right-0 top-full z-50 overflow-hidden" style={{ marginTop: 6, background: '#fff', border: '1px solid #E2D3CA', borderRadius: 12, boxShadow: '0 8px 24px rgba(1,77,111,0.1)', maxHeight: 5 * 44, overflowY: 'auto' }}>
                {suggestions.map((s) => (
                  <div key={s} onClick={() => selectSuggestion(s)} className="cursor-pointer" style={{ padding: '10px 16px', fontSize: 14, fontFamily: "'Montserrat', sans-serif", color: '#014D6F' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F7E8DF')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {s}
                  </div>
                ))}
                {!exactMatch && empresa.trim().length > 0 && (
                  <div onClick={() => { saveEmpresa(empresa.trim()); setShowDropdown(false); }} className="cursor-pointer" style={{ padding: '10px 16px', fontSize: 14, color: '#014D6F', fontWeight: 500, fontFamily: "'Montserrat', sans-serif" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F7E8DF')}
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
            <label style={{ fontSize: 10, letterSpacing: '0.25em', color: '#014D6F', display: 'block', marginBottom: 8, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, textTransform: 'uppercase' as const }}>
              Celular
            </label>
            <div style={inputWrapperStyle('celular')}>
              <Phone style={{ width: 15, height: 15, color: '#888888', flexShrink: 0 }} />
              <input ref={celularRef} type="tel" value={celular} onChange={(e) => onUpdate('celular', e.target.value)} onFocus={() => setFocusedField('celular')} onBlur={() => setFocusedField(null)} placeholder="Tu celular" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-7">
          <button
            type="button"
            onClick={handleArrowClick}
            className="w-full flex items-center justify-center gap-2 transition-all duration-300"
            style={{
              height: 48,
              borderRadius: 6,
              background: isComplete ? '#014D6F' : 'rgba(1,77,111,0.08)',
              color: isComplete ? '#fff' : '#888888',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Montserrat', sans-serif",
              cursor: isComplete ? 'pointer' : 'default',
              boxShadow: isComplete ? '0 4px 16px rgba(1,77,111,0.25)' : 'none',
              transition: 'all 0.3s ease',
              border: 'none',
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
