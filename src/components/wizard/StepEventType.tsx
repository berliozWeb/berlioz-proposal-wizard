import RadioCard from "./RadioCard";
import type { IntakeForm } from "@/types";

const EVENT_TYPES = [
  { value: 'desayuno', icon: '🍳', label: 'Desayuno corporativo' },
  { value: 'coffee_break', icon: '☕', label: 'Coffee break' },
  { value: 'comida', icon: '🍱', label: 'Comida de trabajo' },
  { value: 'capacitacion', icon: '🎓', label: 'Capacitación (día completo)' },
  { value: 'evento_especial', icon: '🎉', label: 'Evento especial' },
  { value: 'otro', icon: '📦', label: 'Otro' },
] as const;

interface StepEventTypeProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const StepEventType = ({ form, onChange }: StepEventTypeProps) => (
  <div className="animate-slide-in">
    <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
      ¿Qué tipo de evento tienes?
    </h2>
    <p className="text-muted-foreground mb-8">
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
);

export default StepEventType;
