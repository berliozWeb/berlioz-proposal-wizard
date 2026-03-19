import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { analytics } from "@/lib/mixpanel";

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
        <input
          ref={empresaRef}
          type="text"
          value={empresa}
          onChange={(e) => onUpdate('empresa', e.target.value)}
          placeholder="Tu empresa"
          className={inputClass(empresa)}
        />
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
