import RadioCard from "./RadioCard";
import type { IntakeForm } from "@/domain/entities/IntakeForm";
import { SERVICE_LEVEL_OPTIONS } from "@/domain/value-objects/ServiceLevel";

interface StepLevelProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const StepLevel = ({ form, onChange }: StepLevelProps) => (
  <div className="animate-slide-in">
    <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
      Nivel esperado
    </h2>
    <p className="text-muted-foreground mb-8">
      ¿Qué nivel de servicio necesitas?
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {SERVICE_LEVEL_OPTIONS.map((lv) => (
        <div key={lv.value} className="relative">
          {lv.value === 'balanceado' && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-medium px-3 py-0.5 rounded-full z-10">
              Más elegido
            </span>
          )}
          <RadioCard
            icon={lv.icon}
            label={lv.label}
            selected={form.nivelEsperado === lv.value}
            onClick={() => onChange({ ...form, nivelEsperado: lv.value })}
          />
          <p className="text-xs text-muted-foreground text-center mt-2">{lv.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default StepLevel;
