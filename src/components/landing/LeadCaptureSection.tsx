import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface LeadCaptureSectionProps {
  nombre: string;
  empresa: string;
  celular: string;
  onUpdate: (field: 'nombre' | 'empresa' | 'celular', value: string) => void;
  isComplete: boolean;
}

const LeadCaptureSection = ({ nombre, empresa, celular, onUpdate, isComplete }: LeadCaptureSectionProps) => {
  const [shaking, setShaking] = useState(false);
  const nombreRef = useRef<HTMLInputElement>(null);
  const empresaRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);

  const handleArrowClick = () => {
    if (isComplete) {
      document.getElementById('entry-points')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      // Focus the first empty field
      if (nombre.trim().length < 2) nombreRef.current?.focus();
      else if (empresa.trim().length < 2) empresaRef.current?.focus();
      else if (celular.trim().length < 2) celularRef.current?.focus();
    }
  };

  const inputClass = (value: string) =>
    `flex-1 min-w-0 px-4 py-3 text-base rounded-xl bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
      !isComplete && shaking && value.trim().length < 2 ? 'animate-shake' : ''
    }`;

  const inputStyle = { border: '1px solid #E8E6DF', fontSize: 16 };

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
          style={inputStyle}
        />
        <input
          ref={empresaRef}
          type="text"
          value={empresa}
          onChange={(e) => onUpdate('empresa', e.target.value)}
          placeholder="Tu empresa"
          className={inputClass(empresa)}
          style={inputStyle}
        />
        <input
          ref={celularRef}
          type="tel"
          value={celular}
          onChange={(e) => onUpdate('celular', e.target.value)}
          placeholder="Tu celular"
          className={inputClass(celular)}
          style={inputStyle}
        />
      </div>

      {/* Animated arrow button */}
      <div className="flex flex-col items-center mt-5">
        <button
          type="button"
          onClick={handleArrowClick}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 animate-bob"
          style={{
            border: '2px solid hsl(var(--forest))',
            background: isComplete ? 'hsl(var(--forest))' : 'transparent',
            color: isComplete ? 'white' : 'hsl(var(--forest))',
          }}
        >
          <ChevronDown className="w-5 h-5" />
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
