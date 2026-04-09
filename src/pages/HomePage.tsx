import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, CalendarIcon, Users, Utensils, ChevronRight, Clock, MapPin, Truck, CreditCard } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import HeroCarousel from "@/components/landing/HeroCarousel";
// Premium Images from src/assets/imagenes_menu
import breakfastImg from "@/assets/imagenes_menu/des_breakfast-in-roma.jpg";
import boxlunchImg from "@/assets/food-boxlunch.jpg";
import coffeeAmImg from "@/assets/imagenes_menu/cb_coffee-break-am-cafe.jpg";
import coffeePmImg from "@/assets/imagenes_menu/cb_coffee-break-pm.jpg";
import juntaImg from "@/assets/imagenes_menu/wl_comedor-berlioz.jpg";
import veganoImg from "@/assets/imagenes_menu/veg_pink-box-vegana.jpg";
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
      {/* ═══ SECTION 1 — HERO CAROUSEL ═══ */}
      <div style={{ marginTop: -68 }}>
        <HeroCarousel />
      </div>

      {/* ═══ SECTION 2 — TRUST BAR ═══ */}
      <section style={{ background: '#014D6F', padding: '24px 0' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Clock, title: "Pide antes de las 3pm", desc: "Para entrega al día siguiente" },
            { icon: CreditCard, title: "Paga en línea", desc: "Compra mínima $1,000 MXN" },
            { icon: MapPin, title: "Entrega en CDMX", desc: "Y Área Metropolitana" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center" style={{ gap: 8 }}>
              <Icon style={{ width: 28, height: 28, color: 'white' }} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: 'white', textTransform: 'uppercase' as const }}>{title}</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 3 — QUICK QUOTER ═══ */}
      <section className="py-20" style={{ background: '#E8F2F6' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 32, color: '#014D6F', textAlign: 'center', marginBottom: 8 }}>
            ¿Cuánto cuesta tu evento?
          </h2>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontSize: 14, color: '#888888', textAlign: 'center', marginBottom: 40 }}>
            Obtén una estimación instantánea sin compromiso
          </p>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2D3CA', padding: '24px 32px', boxShadow: '0 2px 12px rgba(1,77,111,0.06)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div>
                <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 600, color: '#014D6F', letterSpacing: '0.08em', marginBottom: 8 }}>¿Qué tipo de evento?</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 8, border: '1px solid #CEC1B9', color: '#014D6F', fontFamily: "'Montserrat', sans-serif", fontSize: 14, background: 'white', outline: 'none' }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#014D6F'; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#CEC1B9'; }}
                >
                  <option value="">Selecciona...</option>
                  {EVENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 600, color: '#014D6F', letterSpacing: '0.08em', marginBottom: 8 }}>¿Cuántas personas?</label>
                <input
                  type="number"
                  min={10}
                  value={people}
                  onChange={(e) => setPeople(e.target.value ? Number(e.target.value) : "")}
                  placeholder="ej. 25"
                  style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 8, border: '1px solid #CEC1B9', color: '#014D6F', fontFamily: "'Montserrat', sans-serif", fontSize: 14, background: 'white', outline: 'none' }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#014D6F'; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#CEC1B9'; }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 600, color: '#014D6F', letterSpacing: '0.08em', marginBottom: 8 }}>¿Cuándo?</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn("w-full flex items-center gap-2 text-left", !date && "text-muted-foreground")}
                      style={{ height: 48, padding: '0 16px', borderRadius: 8, border: '1px solid #CEC1B9', fontFamily: "'Montserrat', sans-serif", fontSize: 14, background: 'white' }}
                    >
                      <CalendarIcon style={{ width: 16, height: 16, color: '#888888' }} />
                      {date ? format(date, "d MMM yyyy", { locale: es }) : "Selecciona fecha"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < tomorrow} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <button
              onClick={handleQuickQuote}
              className="w-full inline-flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ height: 52, borderRadius: 8, background: '#014D6F', color: 'white', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }}
            >
              Ver opciones y precios
              <ChevronRight style={{ width: 16, height: 16 }} />
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
            <div className="hidden md:flex absolute items-center gap-1.5" style={{ top: "1.75rem", left: "33.33%", transform: "translate(-50%, -50%)" }}>
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/25" />)}
            </div>
            <div className="hidden md:flex absolute items-center gap-1.5" style={{ top: "1.75rem", left: "66.66%", transform: "translate(-50%, -50%)" }}>
              {[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/25" />)}
            </div>
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_0_8px_hsl(var(--primary)/0.06)] transition-all duration-300 hover:bg-primary/15 hover:shadow-[0_0_0_10px_hsl(var(--primary)/0.08)]">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
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
