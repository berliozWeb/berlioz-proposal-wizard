import { Calendar, Utensils, ArrowRight } from "lucide-react";
import { analytics } from "@/lib/mixpanel";
import { updateLastLeadPath } from "@/lib/leadStorage";
import { HERO_IMAGES } from "@/domain/entities/ProductImages";

interface HeroCardsProps {
  onCotiza: () => void;
  onMenu: () => void;
  isLeadComplete: boolean;
  onIncompleteClick: () => void;
}

const HeroCards = ({ onCotiza, onMenu, isLeadComplete, onIncompleteClick }: HeroCardsProps) => {
  const handleCotiza = () => {
    if (!isLeadComplete) { onIncompleteClick(); return; }
    updateLastLeadPath('evento');
    analytics.track('entry_point_selected', { path: 'evento' });
    onCotiza();
  };
  const handleMenu = () => {
    if (!isLeadComplete) { onIncompleteClick(); return; }
    updateLastLeadPath('menu');
    analytics.track('entry_point_selected', { path: 'menu' });
    onMenu();
  };

  return (
    <section id="entry-points" className="max-w-4xl mx-auto px-6 animate-fade-in-up" style={{ paddingBottom: 48 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Card A — Cotiza tu evento */}
        <button
          type="button"
          onClick={handleCotiza}
          className="group text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] hover:shadow-xl flex overflow-hidden"
          style={{
            borderRadius: 18,
            border: '1px solid rgba(0,0,0,0.07)',
            background: 'hsl(var(--card))',
            height: 240,
            boxShadow: '0 2px 12px rgba(0,61,91,0.07)',
          }}
        >
          {/* Left accent bar */}
          <div style={{ width: 4, background: 'hsl(var(--primary))', flexShrink: 0 }} />

          {/* Image */}
          <div className="relative overflow-hidden" style={{ width: '38%', flexShrink: 0 }}>
            <img
              src={HERO_IMAGES.cotiza}
              alt="Cotiza tu evento"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* gradient blend */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, transparent 60%, hsl(var(--card)))' }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span
                  className="inline-flex items-center justify-center rounded-full"
                  style={{ width: 32, height: 32, background: 'hsl(var(--primary) / 0.1)', flexShrink: 0 }}
                >
                  <Calendar style={{ width: 15, height: 15, color: 'hsl(var(--primary))' }} />
                </span>
                <h2 className="font-heading text-foreground" style={{ fontSize: 22 }}>
                  Cotiza tu evento
                </h2>
              </div>
              <p className="font-body text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.65 }}>
                Dinos qué necesitas y te armamos 3 propuestas personalizadas
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="inline-block px-3 py-1 rounded-full font-body font-semibold text-white"
                style={{ fontSize: 11, background: 'hsl(var(--gold))', letterSpacing: '0.02em' }}
              >
                Listo en 2 min ✓
              </span>
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                style={{ width: 18, height: 18, color: 'hsl(var(--primary))' }}
              />
            </div>
          </div>
        </button>

        {/* Card B — Explora el menú */}
        <button
          type="button"
          onClick={handleMenu}
          className="group text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] hover:shadow-xl flex overflow-hidden"
          style={{
            borderRadius: 18,
            border: '1px solid rgba(0,0,0,0.07)',
            background: 'hsl(var(--card))',
            height: 240,
            boxShadow: '0 2px 12px rgba(0,61,91,0.07)',
          }}
        >
          {/* Left accent bar */}
          <div style={{ width: 4, background: 'hsl(var(--gold))', flexShrink: 0 }} />

          {/* Image */}
          <div className="relative overflow-hidden" style={{ width: '38%', flexShrink: 0 }}>
            <img
              src={HERO_IMAGES.menu}
              alt="Explora el menú"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, transparent 60%, hsl(var(--card)))' }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span
                  className="inline-flex items-center justify-center rounded-full"
                  style={{ width: 32, height: 32, background: 'hsl(var(--gold) / 0.12)', flexShrink: 0 }}
                >
                  <Utensils style={{ width: 15, height: 15, color: 'hsl(var(--gold))' }} />
                </span>
                <h2 className="font-heading text-foreground" style={{ fontSize: 22 }}>
                  Explora el menú
                </h2>
              </div>
              <p className="font-body text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.65 }}>
                Coffee break, desayunos, comidas y más — elige directamente
              </p>
            </div>
            <div className="flex items-center justify-end">
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                style={{ width: 18, height: 18, color: 'hsl(var(--gold))' }}
              />
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};

export default HeroCards;
