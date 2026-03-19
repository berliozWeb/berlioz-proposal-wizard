import { Calendar, Utensils, ArrowRight } from "lucide-react";
import foodSalad from "@/assets/food-salad.jpg";

interface HeroCardsProps {
  onCotiza: () => void;
  onMenu: () => void;
}

const HeroCards = ({ onCotiza, onMenu }: HeroCardsProps) => (
  <section className="max-w-6xl mx-auto px-4 pt-10 pb-8">
    <div className="text-center mb-10">
      <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground tracking-tight">
        ¿Qué se te antoja hoy?
      </h1>
      <p className="text-muted-foreground mt-3 text-base">
        Comida corporativa lista en minutos · Ciudad de México
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Card A — Cotiza tu evento */}
      <button
        type="button"
        onClick={onCotiza}
        className="group relative overflow-hidden rounded-xl p-8 text-left transition-transform hover:scale-[1.02] active:scale-[0.99]"
        style={{ backgroundColor: 'hsl(155, 38%, 18%)' }}
      >
        <div className="relative z-10">
          <Calendar className="w-8 h-8 text-forest-foreground/70 mb-4" />
          <h2 className="font-heading text-2xl font-bold text-forest-foreground mb-2">
            Cotiza tu evento
          </h2>
          <p className="text-forest-foreground/70 text-sm mb-6 leading-relaxed">
            Dinos qué necesitas y te armamos 3 propuestas
          </p>
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'hsl(38, 55%, 50%)', color: 'hsl(155, 38%, 10%)' }}
          >
            Listo en 2 min
          </span>
        </div>
        <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-forest-foreground/40 group-hover:text-forest-foreground/70 transition-colors" />
      </button>

      {/* Card B — Explora el menú */}
      <button
        type="button"
        onClick={onMenu}
        className="group relative overflow-hidden rounded-xl text-left transition-transform hover:scale-[1.02] active:scale-[0.99] border-2"
        style={{ borderColor: 'hsl(38, 55%, 50%)', backgroundColor: 'hsl(48, 30%, 98%)' }}
      >
        <img
          src={foodSalad}
          alt="Explora el menú"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="relative z-10 p-8">
          <Utensils className="w-8 h-8 text-forest mb-4" />
          <h2 className="font-heading text-2xl font-bold text-forest mb-2">
            Explora el menú
          </h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Coffee break, desayunos, comidas y más
          </p>
        </div>
        <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-forest/40 group-hover:text-forest/70 transition-colors z-10" />
      </button>
    </div>
  </section>
);

export default HeroCards;
