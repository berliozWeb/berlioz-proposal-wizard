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
    <section className="max-w-4xl mx-auto px-6" style={{ paddingBottom: 48 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A — Cotiza tu evento */}
        <button
          type="button"
          onClick={handleCotiza}
          className="group text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] flex overflow-hidden"
          style={{ borderRadius: 16, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', height: 200 }}
        >
          <div className="relative w-[40%] shrink-0 overflow-hidden">
            <img
              src={HERO_IMAGES.cotiza}
              alt="Cotiza tu evento"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Calendar className="w-5 h-5 shrink-0 text-primary" />
                <h2 className="font-heading font-bold text-foreground" style={{ fontSize: 22 }}>
                  Cotiza tu evento
                </h2>
              </div>
              <p className="font-body text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Dinos qué necesitas y te armamos 3 propuestas personalizadas
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="inline-block px-3 py-1 rounded-full font-body font-semibold text-white"
                style={{ fontSize: 11, background: 'hsl(var(--gold))' }}
              >
                Listo en 2 min
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </button>

        {/* Card B — Explora el menú */}
        <button
          type="button"
          onClick={handleMenu}
          className="group text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] flex overflow-hidden"
          style={{ borderRadius: 16, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', height: 200 }}
        >
          <div className="relative w-[40%] shrink-0 overflow-hidden">
            <img
              src={HERO_IMAGES.menu}
              alt="Explora el menú"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Utensils className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--gold))' }} />
                <h2 className="font-heading font-bold text-foreground" style={{ fontSize: 22 }}>
                  Explora el menú
                </h2>
              </div>
              <p className="font-body text-muted-foreground" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Coffee break, desayunos, comidas y más
              </p>
            </div>
            <div className="flex items-center justify-end">
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};

export default HeroCards;
