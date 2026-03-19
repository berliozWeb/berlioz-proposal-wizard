import type { IntakeForm } from "@/domain/entities/IntakeForm";
import { cn } from "@/lib/utils";

interface EventTypePillsProps {
  selected: IntakeForm['eventType'];
  onSelect: (type: IntakeForm['eventType']) => void;
}

const pills = [
  { value: 'desayuno' as const, label: 'Desayuno' },
  { value: 'coffee_break' as const, label: 'Coffee break' },
  { value: 'comida' as const, label: 'Comida' },
  { value: 'capacitacion' as const, label: 'Capacitación' },
  { value: 'evento_especial' as const, label: 'Evento especial' },
] as const;

const EventTypePills = ({ selected, onSelect }: EventTypePillsProps) => (
  <div className="mb-8">
    <p className="text-sm font-medium text-foreground mb-3">¿Qué tipo de evento?</p>
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onSelect(p.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all border",
            selected === p.value
              ? "bg-forest text-forest-foreground border-forest"
              : "bg-card text-foreground border-border hover:border-forest/40",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  </div>
);

export default EventTypePills;
