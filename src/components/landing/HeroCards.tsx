import { Calendar, Utensils, ArrowRight } from "lucide-react";
import { analytics } from "@/lib/mixpanel";
import { updateLastLeadPath } from "@/lib/leadStorage";

const WP = 'https://berlioz.mx/wp-content/uploads';

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
        className="group relative overflow-hidden text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
        style={{ height: 320, borderRadius: 16 }}
      >
        <img
          src={`${WP}/2023/03/cateringCorporativo12.jpg`}
          alt="Cotiza tu evento"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(28,58,47,0.75) 0%, rgba(28,58,47,0.4) 100%)' }}
        />
        <div className="relative z-10 p-8 h-full flex flex-col justify-end">
          <Calendar className="w-7 h-7 text-white/80 mb-4" />
          <h2
            className="font-heading font-bold text-white mb-2"
            style={{ fontSize: 28 }}
          >
            Cotiza tu evento
          </h2>
          <p className="font-body text-white/85 mb-5" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Dinos qué necesitas y te armamos 3 propuestas
          </p>
          <span
            className="inline-block px-4 py-1.5 rounded-full font-body font-semibold w-fit"
            style={{ fontSize: 12, background: '#C9973A', color: '#fff' }}
          >
            Listo en 2 min
          </span>
        </div>
        <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors z-10" />
      </button>

      {/* Card B — Explora el menú */}
      <button
        type="button"
        onClick={() => { updateLastLeadPath('menu'); analytics.track('entry_point_selected', { path: 'menu' }); onMenu(); }}
        className="group relative overflow-hidden text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
        style={{ height: 320, borderRadius: 16 }}
      >
        <img
          src={`${WP}/2025/08/coffeebreak_AM_cafe.jpg`}
          alt="Explora el menú"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(201,151,58,0.65) 0%, rgba(201,151,58,0.3) 100%)' }}
        />
        <div className="relative z-10 p-8 h-full flex flex-col justify-end">
          <Utensils className="w-7 h-7 text-white mb-4" />
          <h2
            className="font-heading font-bold text-white mb-2"
            style={{ fontSize: 28 }}
          >
            Explora el menú
          </h2>
          <p className="font-body text-white/85" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Coffee break, desayunos, comidas y más
          </p>
        </div>
        <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors z-10" />
      </button>
    </div>
  </section>
);

export default HeroCards;
