import { Calendar, Utensils, ArrowRight } from "lucide-react";
import { analytics } from "@/lib/mixpanel";
import { updateLastLeadPath } from "@/lib/leadStorage";
import { HERO_IMAGES } from "@/domain/entities/ProductImages";

interface HeroCardsProps {
  onCotiza: () => void;
  onMenu: () => void;
}

const HeroCards = ({ onCotiza, onMenu }: HeroCardsProps) => (
  <section className="max-w-4xl mx-auto px-6" style={{ paddingBottom: 48 }}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card A — Cotiza tu evento */}
      <button
        type="button"
        onClick={() => { updateLastLeadPath('evento'); analytics.track('entry_point_selected', { path: 'evento' }); onCotiza(); }}
        className="group text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
        style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E8E6DF', background: '#fff' }}
      >
        <div className="relative overflow-hidden" style={{ height: 200 }}>
          <img
            src={HERO_IMAGES.cotiza}
            alt="Cotiza tu evento"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 shrink-0 text-primary" />
            <h2 className="font-heading font-bold text-foreground" style={{ fontSize: 20 }}>
              Cotiza tu evento
            </h2>
          </div>
          <p className="font-body text-muted-foreground mb-4" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Dinos qué necesitas y te armamos 3 propuestas
          </p>
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
        onClick={() => { updateLastLeadPath('menu'); analytics.track('entry_point_selected', { path: 'menu' }); onMenu(); }}
        className="group text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
        style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E8E6DF', background: '#fff' }}
      >
        <div className="relative overflow-hidden" style={{ height: 200 }}>
          <img
            src={HERO_IMAGES.menu}
            alt="Explora el menú"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Utensils className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--gold))' }} />
            <h2 className="font-heading font-bold text-foreground" style={{ fontSize: 20 }}>
              Explora el menú
            </h2>
          </div>
          <p className="font-body text-muted-foreground mb-4" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Coffee break, desayunos, comidas y más
          </p>
          <div className="flex items-center justify-end">
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </button>
    </div>
  </section>
);

export default HeroCards;
