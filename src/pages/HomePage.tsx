import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, CalendarIcon, Users, Utensils, ChevronRight, Clock, MapPin, Truck } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/hero-catering.jpg";
import breakfastImg from "@/assets/food-breakfast.jpg";
import boxlunchImg from "@/assets/food-boxlunch.jpg";
import coffeeAmImg from "@/assets/platos/coffee-break-pm/Surtido-Camille-Berlioz-bocadillos2.webp";
import coffeePmImg from "@/assets/platos/coffee-break-pm/coffee-break-BERLIOZ.webp";
import juntaImg from "@/assets/platos/coffee-break-pm/berlioz_fabian-11-1-scaled.webp";
import veganoImg from "@/assets/platos/coffee-break-pm/Crudites-juliana-de-verduras-Berlioz-zoom.webp";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import WordRotator from "@/components/ui/WordRotator";

/* ── data ── */
const TRUST_COMPANIES = ["EY", "DHL", "INVEX", "Maersk", "MillerKnoll", "Thomson Reuters", "Biotechlives"];

const EVENT_OPTIONS = [
  { value: "junta", label: "Junta ejecutiva" },
  { value: "desayuno", label: "Desayuno de trabajo" },
  { value: "coffee_break", label: "Coffee break" },
  { value: "comida", label: "Comida de equipo" },
  { value: "evento_especial", label: "Evento especial" },
];

const OCCASIONS: { id: string; name: string; price: number; emoji: string; image?: string }[] = [
  { id: "desayuno", name: "Desayuno de trabajo", price: 185, emoji: "🍳", image: breakfastImg },
  { id: "coffee_am", name: "Coffee Break AM", price: 145, emoji: "☕", image: coffeeAmImg },
  { id: "coffee_pm", name: "Coffee Break PM", price: 145, emoji: "🍪", image: coffeePmImg },
  { id: "working_lunch", name: "Working Lunch", price: 280, emoji: "🍱", image: boxlunchImg },
  { id: "junta", name: "Junta Ejecutiva", price: 350, emoji: "💼", image: juntaImg },
  { id: "vegano", name: "Pedido Vegano", price: 240, emoji: "🌱", image: veganoImg },
];

const STATS = [
  { label: "Clientes Felices", value: 2500 },
  { label: "Comidas Entregadas", value: 500000 },
  { label: "Empresas Internacionales", value: 500 },
];

const TESTIMONIALS = [
  {
    quote: "¡WOW, me encanta! ¡Qué gran iniciativa y CALIDAD! Todo estaba delicioso, salado o dulce, la gente no paraba de comer. ¡Encontré lo que ustedes hacen y me enamoré!",
    name: "Jessica Pons",
    company: "Fundación Grupo México",
    role: "Directora",
  },
  {
    quote: "Berlioz nos salvó la junta de directivos — llegó todo perfecto, presentación impecable y la comida estaba increíble. La puntualidad es lo que más valoramos.",
    name: "Rocío Ornelas",
    company: "EY México",
    role: "Executive Assistant",
  },
  {
    quote: "Necesitábamos catering para un evento de última hora y Berlioz entregó en menos de 24 horas. Servicio excepcional y presentación muy profesional.",
    name: "Ana Lucía Torres",
    company: "DHL Logistics",
    role: "Project Manager",
  },
];

const STEPS = [
  { icon: Utensils, title: "Elige tu menú", desc: "Explora opciones por tipo de evento o arma tu pedido desde el catálogo completo." },
  { icon: Clock, title: "Selecciona fecha y horario", desc: "Elige cuándo y a qué hora necesitas tu entrega. Disponibilidad en tiempo real." },
  { icon: Truck, title: "Lo entregamos en tu oficina", desc: "Llegamos puntuales con todo listo para servir. Sin complicaciones." },
];

/* ── component ── */
const HomePage = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState("");
  const [people, setPeople] = useState<number | "">("");
  const [date, setDate] = useState<Date | undefined>();
  const tomorrow = addDays(new Date(), 1);

  const handleQuickQuote = () => {
    const params = new URLSearchParams();
    if (eventType) params.set("event", eventType);
    if (people) params.set("people", String(people));
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    navigate(`/cotizar?${params.toString()}`);
  };

  return (
    <BaseLayout>
      {/* ═══ SECTION 1 — HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center -mt-[72px]">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
        <div className="relative z-10 max-w-[720px] mx-auto px-6 text-center">
          <h1 className="font-heading text-4xl md:text-[60px] md:leading-[1.08] tracking-tight text-card mb-6">
            Catering gourmet entregado en tu sala de juntas
          </h1>
          <p className="font-body text-lg text-card/80 mb-10 max-w-xl mx-auto leading-relaxed">
            Desayunos · Coffee breaks · Working lunches para equipos de 10 a 500 personas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/menu"
              className="inline-flex items-center justify-center h-13 px-9 py-3.5 rounded-full bg-card text-primary font-body font-semibold text-sm hover:bg-card/95 hover:shadow-lg hover:shadow-black/30 transition-all duration-200"
            >
              Ver menú completo
            </a>
            <a
              href="/cotizar"
              className="inline-flex items-center justify-center h-13 px-9 py-3.5 rounded-full border-2 border-card/70 text-card font-body font-semibold text-sm backdrop-blur-sm bg-white/10 hover:bg-white/20 hover:border-card transition-all duration-200"
            >
              Cotizar ahora
            </a>
          </div>
          <div className="mt-10 flex items-center justify-center gap-1.5 text-card/80">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4.5 h-4.5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="font-body text-sm ml-2.5">4.9/5 — Más de 5,000 pedidos entregados</span>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2 — TRUST BAR ═══ */}
      <section className="bg-card py-10 border-b border-border overflow-hidden">
        <p className="font-body text-[11px] text-muted-foreground text-center mb-6 uppercase tracking-[0.15em]">
          Empresas que confían en Berlioz
        </p>
        {/* marquee track */}
        <div
          className="relative"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        >
          <div className="flex w-max animate-marquee gap-4">
            {[...TRUST_COMPANIES, ...TRUST_COMPANIES, ...TRUST_COMPANIES, ...TRUST_COMPANIES].map((name, i) => (
              <div
                key={i}
                className="px-5 py-2.5 rounded-full bg-muted font-mono text-xs text-muted-foreground tracking-wide border border-transparent whitespace-nowrap select-none"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — QUICK QUOTER ═══ */}
      <section className="py-20" style={{background: "linear-gradient(135deg, hsl(209 82% 94%) 0%, hsl(220 60% 97%) 100%)"}}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-heading text-[32px] text-foreground text-center mb-2">
            ¿Cuánto cuesta tu evento?
          </h2>
          <p className="font-body text-muted-foreground text-center text-sm mb-10">
            Obtén una estimación instantánea sin compromiso
          </p>
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* Event type */}
              <div>
                <label className="block font-body text-xs font-semibold text-foreground mb-2">¿Qué tipo de evento?</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                >
                  <option value="">Selecciona...</option>
                  {EVENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {/* People */}
              <div>
                <label className="block font-body text-xs font-semibold text-foreground mb-2">¿Cuántas personas?</label>
                <input
                  type="number"
                  min={10}
                  value={people}
                  onChange={(e) => setPeople(e.target.value ? Number(e.target.value) : "")}
                  placeholder="ej. 25"
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {/* Date */}
              <div>
                <label className="block font-body text-xs font-semibold text-foreground mb-2">¿Cuándo?</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border border-input bg-background font-body text-sm text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {date ? format(date, "d MMM yyyy", { locale: es }) : "Selecciona fecha"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < tomorrow}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <button
              onClick={handleQuickQuote}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 transition-all duration-200 inline-flex items-center justify-center gap-2"
            >
              Ver opciones y precios
              <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4 — MENU BY OCCASION ═══ */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-[36px] text-foreground text-center mb-2">¿Qué necesitas hoy?</h2>
          <p className="font-body text-muted-foreground text-center mb-12 text-base">Selecciona el tipo de momento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {OCCASIONS.map((o) => (
              <a
                key={o.id}
                href={`/menu?occasion=${o.id}`}
                className="group relative bg-card rounded-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20"
              >
                {/* top accent line */}
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* image / emoji area */}
                {o.image ? (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={o.image}
                      alt={o.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* dark scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* emoji badge */}
                    <span className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-2xl shadow">
                      {o.emoji}
                    </span>
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-5xl shadow-inner transition-transform duration-300 group-hover:scale-110">
                      {o.emoji}
                    </div>
                  </div>
                )}

                {/* content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-body font-semibold text-foreground text-base">{o.name}</h3>
                  <p className="font-body text-sm text-secondary mt-1 mb-4">desde ${o.price} por persona</p>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-primary/80 group-hover:text-primary transition-colors">
                      Ver opciones <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      desde ${o.price}/pp
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION — BERLIOZ LUNCH BOX ═══ */}
      <section className="relative w-full overflow-hidden">
        <div className="aspect-[1/1] md:aspect-[16/7] relative w-full overflow-hidden">
          <img 
            src={boxlunchImg} 
            alt="Berlioz Lunch Box Experience" 
            className="w-full h-full object-cover"
          />
          {/* subtle overlay to soften the image slightly */}
          <div className="absolute inset-0 bg-black/5" />
          
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full flex justify-center md:justify-start">
              <RevealOnScroll>
                <div className="bg-white p-8 md:p-14 rounded-[40px] shadow-2xl max-w-xl md:ml-12 backdrop-blur-sm bg-white/95">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-6">
                    Experiencia Signature
                  </span>
                  <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl mb-6 tracking-tight leading-[1.05] text-primary">
                    BERLIOZ <br className="hidden sm:block"/> LUNCH BOX
                  </h2>
                  <p className="font-body text-lg md:text-xl mb-10 leading-relaxed text-muted-foreground">
                    Para tus juntas y eventos, Berlioz ofrece una comida gourmet de tres tiempos, 
                    servida en una elegante caja práctica y sofisticada.
                  </p>
                  <p className="font-heading text-xl md:text-2xl italic text-secondary font-medium leading-tight">
                  &ldquo;Consiente a tus invitados con esta experiencia sensorial.&rdquo;
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — SOCIAL PROOF ═══ */}
      <section className="py-24 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
            <RevealOnScroll>
              <h2 className="font-heading text-4xl md:text-[64px] md:leading-[1.1] text-primary mb-4 min-h-[1.2em]">
                Opción <WordRotator 
                  words={["vegetariana", "sin glúten", "vegana", "keto", "sin lácteos"]} 
                  className="text-secondary italic" 
                  duration={3000}
                />
              </h2>
              <p className="font-body text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">Calidad y sabor que transforman tus reuniones corporativas sin dejar de lado lo saludable</p>
            </RevealOnScroll>
            
            {/* Stats bar with Animated Counters */}
            <div className="flex flex-wrap justify-center gap-12 md:gap-32 mt-16 mb-24 py-16 border-y border-border/40">
              {STATS.map((s, i) => (
                <RevealOnScroll key={s.label} delay={i * 200}>
                  <div className="text-center group">
                    <div className="flex justify-center mb-1">
                      <div className="text-[44px] md:text-[68px] font-heading font-black tracking-tighter text-primary">
                        <AnimatedCounter end={s.value} />
                      </div>
                    </div>
                    <p className="font-body text-[12px] text-muted-foreground uppercase tracking-[0.3em] font-bold group-hover:text-secondary transition-colors duration-300">
                      {s.label}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            {/* Premium Image with Reveal Animation */}
            {/* <RevealOnScroll delay={400}>
              <div className="relative max-w-[1000px] mx-auto rounded-[40px] overflow-hidden shadow-2xl group border border-border/10">
                <div className="aspect-[21/9] md:aspect-[3/1]">
                  <img 
                    src={veganoImg} 
                    alt="Berlioz gourmet catering" 
                    className="w-full h-full object-cover transform transition-transform duration-[12000ms] hover:scale-110 ease-out"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-12">
                  <span className="font-heading text-white text-2xl md:text-3xl drop-shadow-2xl px-6 text-center leading-tight">
                    Ingredientes seleccionados <br className="hidden md:block"/> para un paladar exigente
                  </span>
                </div>
               
                <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full hidden md:block">
                  <span className="text-white font-body text-xs font-semibold tracking-wider uppercase">100% Plant-Based</span>
                </div>
              </div>
            </RevealOnScroll> */}

            <RevealOnScroll delay={600}>
              <h3 className="font-heading text-4xl md:text-5xl text-foreground mb-16 mt-24 text-center">Lo que dicen nuestros clientes</h3>
            </RevealOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="flex flex-col h-full bg-card border border-border/60 shadow-sm rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex-1">
                  <div className="flex gap-0.5 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-body text-[17px] text-foreground leading-[1.6] mb-10 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                
                <div className="mt-auto">
                  <h4 className="font-body text-base font-bold text-foreground">{t.name}</h4>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-body text-sm">{t.company}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="font-body text-[13px]">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-16 border-t border-border/50">
            <p className="text-center font-body text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-12">
              EMPRESAS QUE HAN DISFRUTADO DE NUESTRO CATERING
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {TRUST_COMPANIES.map((name) => (
                <span key={name} className="font-heading text-lg font-bold text-foreground tracking-tight whitespace-nowrap">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — HOW IT WORKS ═══ */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading text-[36px] text-foreground mb-3">Así de fácil</h2>
          <p className="font-body text-muted-foreground text-sm mb-14">Desde tu pantalla hasta tu sala de juntas, en minutos</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* dot connectors between steps — desktop only */}
            <div className="hidden md:flex absolute items-center gap-1.5" style={{ top: "1.75rem", left: "33.33%", transform: "translate(-50%, -50%)" }}>
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/25" />)}
            </div>
            <div className="hidden md:flex absolute items-center gap-1.5" style={{ top: "1.75rem", left: "66.66%", transform: "translate(-50%, -50%)" }}>
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/25" />)}
            </div>
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                {/* icon circle */}
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_0_8px_hsl(var(--primary)/0.06)] transition-all duration-300 hover:bg-primary/15 hover:shadow-[0_0_0_10px_hsl(var(--primary)/0.08)]">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                {/* step badge */}
                <span className="inline-block font-mono text-[10px] font-semibold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full mb-3">
                  Paso {i + 1}
                </span>
                <h3 className="font-body font-semibold text-foreground text-base mb-2">{s.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </BaseLayout>
  );
};

export default HomePage;
