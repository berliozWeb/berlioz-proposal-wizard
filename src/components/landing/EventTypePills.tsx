import { useState } from "react";
import type { IntakeForm } from "@/domain/entities/IntakeForm";
import { cn } from "@/lib/utils";

interface EventTypePillsProps {
  selected: IntakeForm['eventType'];
  onSelect: (type: IntakeForm['eventType']) => void;
}

const CL = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

type DietTag = { emoji: string; label: string; color: string };

const DIET_TAGS: Record<string, DietTag> = {
  vegano: { emoji: '🌱', label: 'Vegano', color: 'hsl(142 71% 45%)' },
  vegetariano: { emoji: '🥗', label: 'Vegetariano', color: 'hsl(142 50% 50%)' },
  sin_gluten: { emoji: '🌾', label: 'Sin gluten', color: 'hsl(35 90% 55%)' },
  keto: { emoji: '🔥', label: 'Keto', color: 'hsl(0 70% 55%)' },
};

interface EventCard {
  value: 'desayuno' | 'coffee_break' | 'comida' | 'capacitacion' | 'evento_especial' | 'filmacion';
  label: string;
  descriptor: string;
  image: string;
  budgetTag: string;
  budgetLevel: number;
  diets: string[];
  badge?: string;
  isVegan?: boolean;
  isSmallGroup?: boolean;
  maxPrice?: number;
}

const EVENT_CARDS: EventCard[] = [
  {
    value: 'desayuno',
    label: 'Desayuno',
    descriptor: 'Desde 4 personas · 7am en adelante',
    image: `${CL}/Healthy-breakfast-1_wax9nd`,
    budgetTag: 'Desde $170/persona',
    budgetLevel: 1,
    diets: ['vegetariano', 'vegano', 'sin_gluten'],
    badge: '🌅 Perfecto para morning meetings',
    maxPrice: 170,
  },
  {
    value: 'coffee_break',
    label: 'Coffee Break',
    descriptor: 'Desde 4 personas · mañana o tarde',
    image: `${CL}/coffeebreak_AM_cafe_zhxb1e`,
    budgetTag: 'Desde $240/persona',
    budgetLevel: 2,
    diets: ['vegetariano'],
    badge: '☕ Ideal para juntas',
    maxPrice: 240,
  },
  {
    value: 'comida',
    label: 'Working Lunch',
    descriptor: 'El producto estrella de Berlioz',
    image: `${CL}/Surtido-Camille-Berlioz-bocadillos_paaynm`,
    budgetTag: 'Desde $150/persona',
    budgetLevel: 2,
    diets: ['vegano', 'vegetariano', 'sin_gluten', 'keto'],
    badge: '⭐ El más pedido',
    maxPrice: 150,
  },
  {
    value: 'capacitacion',
    label: 'Capacitación',
    descriptor: 'Servicio completo de día',
    image: `${CL}/cateringCorporativo12_a0kxxe`,
    budgetTag: 'Paquete de día completo',
    budgetLevel: 3,
    diets: ['vegetariano', 'vegano'],
    isSmallGroup: false,
  },
  {
    value: 'evento_especial',
    label: 'Reunión ejecutiva',
    descriptor: 'Para grupos pequeños y VIP',
    image: `${CL}/5_wkgrwj`,
    budgetTag: 'Experiencia premium',
    budgetLevel: 3,
    diets: ['vegetariano', 'sin_gluten', 'keto'],
    isSmallGroup: true,
  },
  {
    value: 'filmacion',
    label: 'Filmación',
    descriptor: 'Bags y opciones portables',
    image: `${CL}/breakfast-bag_zctq0h`,
    budgetTag: 'Opciones económicas portables',
    budgetLevel: 1,
    diets: ['vegetariano'],
    badge: '💡 Económico y portable',
    maxPrice: 150,
  },
];

type FilterKey = 'todos' | 'vegano' | 'sin_gluten' | 'bajo_200' | 'pequeno';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'vegano', label: 'Con opciones veganas' },
  { key: 'sin_gluten', label: 'Sin gluten' },
  { key: 'bajo_200', label: 'Menos de $200/persona' },
  { key: 'pequeno', label: 'Grupos pequeños (<10)' },
];

function matchesFilter(card: EventCard, filter: FilterKey): boolean {
  if (filter === 'todos') return true;
  if (filter === 'vegano') return card.diets.includes('vegano');
  if (filter === 'sin_gluten') return card.diets.includes('sin_gluten');
  if (filter === 'bajo_200') return (card.maxPrice ?? 999) <= 200;
  if (filter === 'pequeno') return card.isSmallGroup === true || card.value === 'filmacion';
  return true;
}

const EventTypePills = ({ selected, onSelect }: EventTypePillsProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('todos');

  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-foreground mb-3">¿Qué tipo de evento?</p>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border",
              activeFilter === f.key
                ? "bg-gold text-gold-foreground border-gold"
                : "bg-card border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EVENT_CARDS.map((card) => {
          const matches = matchesFilter(card, activeFilter);
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => onSelect(card.value)}
              className={cn(
                "group text-left rounded-2xl overflow-hidden border transition-all duration-200",
                selected === card.value
                  ? "border-primary ring-2 ring-primary/30 shadow-lg"
                  : "border-border shadow-sm hover:shadow-md hover:scale-[1.02]",
                !matches && "opacity-40 pointer-events-none",
              )}
              style={{ minHeight: 280 }}
            >
              {/* Badge */}
              {card.badge && (
                <div
                  className="px-3 py-1.5 text-xs font-semibold text-center"
                  style={{ background: 'hsl(var(--gold))', color: 'hsl(var(--gold-foreground))' }}
                >
                  {card.badge}
                </div>
              )}

              {/* Photo — top 55% */}
              <div className="relative overflow-hidden" style={{ height: card.badge ? 130 : 150 }}>
                <img
                  src={card.image}
                  alt={card.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content — bottom 45% */}
              <div className="p-4 bg-card">
                <h3 className="font-body text-base font-bold text-foreground mb-0.5">{card.label}</h3>
                <p className="text-xs text-muted-foreground mb-2.5">{card.descriptor}</p>

                {/* Budget tag */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-xs">
                    {'💰'.repeat(card.budgetLevel)}
                  </span>
                  <span className="text-xs font-medium text-foreground">{card.budgetTag}</span>
                </div>

                {/* Diet icons */}
                {card.diets.length > 0 && (
                  <p className="font-body mb-1" style={{ fontSize: 11, color: '#888880' }}>
                    También tenemos opciones:
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {card.diets.map((d) => {
                    const tag = DIET_TAGS[d];
                    if (!tag) return null;
                    return (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}
                      >
                        {tag.emoji} {tag.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EventTypePills;
