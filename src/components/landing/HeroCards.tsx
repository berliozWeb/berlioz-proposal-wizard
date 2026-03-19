import { Calendar, Utensils, ArrowRight } from "lucide-react";
import { analytics } from "@/lib/mixpanel";

const CDN = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

interface HeroCardsProps {
  onCotiza: () => void;
  onMenu: () => void;
}

const HeroCards = ({ onCotiza, onMenu }: HeroCardsProps) => (
  <section className="max-w-4xl mx-auto px-4 pb-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card A — Cotiza tu evento */}
      <button
        type="button"
        onClick={onCotiza}
        className="group relative overflow-hidden rounded-xl text-left transition-transform hover:scale-[1.02] active:scale-[0.99]"
        style={{ height: 240 }}
      >
        <img
          src={`${CDN}/cateringCorporativo12_a0kxxe`}
          alt="Cotiza tu evento"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(28, 58, 47, 0.45)' }} />
        <div className="relative z-10 p-6 h-full flex flex-col justify-end">
          <Calendar className="w-7 h-7 text-white/70 mb-3" />
          <h2 className="font-heading text-xl font-bold text-white mb-1">
            Cotiza tu evento
          </h2>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">
            Dinos qué necesitas y te armamos 3 propuestas
          </p>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gold text-primary w-fit">
            Listo en 2 min
          </span>
        </div>
        <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors z-10" />
      </button>

      {/* Card B — Explora el menú */}
      <button
        type="button"
        onClick={onMenu}
        className="group relative overflow-hidden rounded-xl text-left transition-transform hover:scale-[1.02] active:scale-[0.99]"
        style={{ height: 240 }}
      >
        <img
          src={`${CDN}/Surtido-Camille-Berlioz-bocadillos2_zkkuyr`}
          alt="Explora el menú"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(201, 151, 58, 0.45)' }} />
        <div className="relative z-10 p-6 h-full flex flex-col justify-end">
          <Utensils className="w-7 h-7 text-white mb-3" />
          <h2 className="font-heading text-xl font-bold text-white mb-1">
            Explora el menú
          </h2>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">
            Coffee break, desayunos, comidas y más
          </p>
        </div>
        <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors z-10" />
      </button>
    </div>
  </section>
);

export default HeroCards;
