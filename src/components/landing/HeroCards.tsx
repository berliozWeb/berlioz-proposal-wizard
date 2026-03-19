import { Calendar, Utensils, ArrowRight } from "lucide-react";

const CDN = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

interface HeroCardsProps {
  onCotiza: () => void;
  onMenu: () => void;
}

const HeroCards = ({ onCotiza, onMenu }: HeroCardsProps) => (
  <section className="max-w-6xl mx-auto px-4" style={{ padding: '48px 1rem 32px' }}>
    <div className="text-center mb-10">
      <h1
        className="font-heading font-bold text-foreground tracking-tight"
        style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}
      >
        ¿Qué se te antoja hoy?
      </h1>
      <p className="text-muted-foreground mt-3 text-base">
        Comida corporativa lista en minutos · Ciudad de México
      </p>
    </div>

    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mx-auto" style={{ maxWidth: 720 }}>
      {/* Card A — Cotiza tu evento */}
      <button
        type="button"
        onClick={onCotiza}
        className="group relative overflow-hidden rounded-xl text-left transition-transform hover:scale-[1.02] active:scale-[0.99] w-full"
        style={{ maxWidth: 340, height: 420 }}
      >
        <img
          src={`${CDN}/cateringCorporativo12_a0kxxe`}
          alt="Cotiza tu evento"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(28, 58, 47, 0.55)' }} />
        <div className="relative z-10 p-8 h-full flex flex-col justify-end">
          <Calendar className="w-8 h-8 text-white/70 mb-4" />
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            Cotiza tu evento
          </h2>
          <p className="text-white/70 text-sm mb-6 leading-relaxed">
            Dinos qué necesitas y te armamos 3 propuestas
          </p>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gold text-primary w-fit">
            Listo en 2 min
          </span>
        </div>
        <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors z-10" />
      </button>

      {/* Card B — Explora el menú */}
      <button
        type="button"
        onClick={onMenu}
        className="group relative overflow-hidden rounded-xl text-left transition-transform hover:scale-[1.02] active:scale-[0.99] w-full"
        style={{ maxWidth: 340, height: 420 }}
      >
        <img
          src={`${CDN}/Surtido-Camille-Berlioz-bocadillos2_zkkuyr`}
          alt="Explora el menú"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(201, 151, 58, 0.5)' }} />
        <div className="relative z-10 p-8 h-full flex flex-col justify-end">
          <Utensils className="w-8 h-8 text-white mb-4" />
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            Explora el menú
          </h2>
          <p className="text-white/70 text-sm mb-6 leading-relaxed">
            Coffee break, desayunos, comidas y más
          </p>
        </div>
        <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors z-10" />
      </button>
    </div>
  </section>
);

export default HeroCards;
