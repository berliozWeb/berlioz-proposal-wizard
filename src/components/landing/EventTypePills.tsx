import type { IntakeForm } from "@/domain/entities/IntakeForm";
import { EVENT_TYPE_DESCRIPTORS } from "@/domain/value-objects/EventType";
import { cn } from "@/lib/utils";
import { CATEGORY_IMAGES, FALLBACK_IMAGE } from "@/domain/entities/ProductImages";

interface EventTypePillsProps {
  selected: IntakeForm['eventType'];
  onSelect: (type: IntakeForm['eventType']) => void;
}

const CL = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

const pills = [
  { value: 'desayuno' as const, label: 'Desayuno', image: CATEGORY_IMAGES.desayuno },
  { value: 'coffee_break' as const, label: 'Coffee Break', image: `${CL}/coffeebreak_AM_cafe_zhxb1e` },
  { value: 'comida' as const, label: 'Working Lunch', image: FALLBACK_IMAGE },
  { value: 'capacitacion' as const, label: 'Capacitación', image: `${CL}/comedorBERLIOZ_vvm0rz` },
  { value: 'evento_especial' as const, label: 'Reunión ejecutiva', image: `${CL}/web-_Mesa-de-trabajo-1_n9hqc4` },
  { value: 'filmacion' as const, label: 'Filmación', image: `${CL}/breakfast-bag_zctq0h` },
] as const;

const EventTypePills = ({ selected, onSelect }: EventTypePillsProps) => (
  <div className="mb-8">
    <p className="text-sm font-medium text-foreground mb-3">¿Qué tipo de evento?</p>
    <div className="flex flex-wrap gap-3">
      {pills.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onSelect(p.value)}
          className={cn(
            "relative overflow-hidden px-5 py-3 rounded-xl text-sm font-medium transition-all border min-w-[120px]",
            selected === p.value
              ? "border-primary ring-2 ring-primary/30"
              : "border-border hover:border-primary/40",
          )}
        >
          <img
            src={p.image}
            alt={p.label}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity",
              selected === p.value ? "opacity-30" : "opacity-15 group-hover:opacity-25",
            )}
          />
          <div className="relative z-10">
            <span className="text-foreground font-semibold block">{p.label}</span>
            {EVENT_TYPE_DESCRIPTORS[p.value] && (
              <span className="text-xs text-muted-foreground block mt-0.5">{EVENT_TYPE_DESCRIPTORS[p.value]}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default EventTypePills;
