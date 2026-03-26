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

/* ── data ── */
const TRUST_COMPANIES = ["EY", "DHL", "INVEX", "Maersk", "MillerKnoll", "Thomson Reuters", "Biotechlives"];

const EVENT_OPTIONS = [
  { value: "junta", label: "Junta ejecutiva" },
  { value: "desayuno", label: "Desayuno de trabajo" },
  { value: "coffee_break", label: "Coffee break" },
  { value: "comida", label: "Comida de equipo" },
  { value: "evento_especial", label: "Evento especial" },
];

const OCCASIONS = [
  { id: "desayuno", name: "Desayuno de trabajo", price: 185, emoji: "🍳" },
  { id: "coffee_am", name: "Coffee Break AM", price: 145, emoji: "☕" },
  { id: "coffee_pm", name: "Coffee Break PM", price: 145, emoji: "🍪" },
  { id: "working_lunch", name: "Working Lunch", price: 280, emoji: "🍱" },
  { id: "junta", name: "Junta Ejecutiva", price: 350, emoji: "💼" },
  { id: "vegano", name: "Pedido Vegano", price: 240, emoji: "🌱" },
];

const TESTIMONIALS = [
  {
    quote: "Berlioz nos salvó la junta de directivos — llegó todo perfecto, presentación impecable y la comida estaba increíble.",
    name: "Rocío Ornelas",
    company: "EY México",
    initials: "RO",
    color: "bg-primary",
  },
  {
    quote: "Pedimos cada semana para nuestro equipo de 40 personas. La variedad del menú y la puntualidad son lo que más valoramos.",
    name: "Carlos Mendoza",
    company: "INVEX Grupo Financiero",
    initials: "CM",
    color: "bg-accent",
  },
  {
    quote: "Necesitábamos catering para un evento de última hora y Berlioz entregó en menos de 24 horas. Servicio excepcional.",
    name: "Ana Lucía Torres",
    company: "DHL Global Forwarding",
    initials: "AT",
    color: "bg-success",
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 max-w-[700px] mx-auto px-6 text-center">
          <h1 className="font-heading text-4xl md:text-[56px] md:leading-[1.1] text-card mb-6">
            Catering gourmet entregado en tu sala de juntas
          </h1>
          <p className="font-body text-lg text-card/75 mb-8 max-w-xl mx-auto">
            Desayunos · Coffee breaks · Working lunches para equipos de 10 a 500 personas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/menu"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-card text-primary font-body font-semibold text-sm hover:bg-card/90 transition-colors"
            >
              Ver menú completo
            </a>
            <a
              href="/cotizar"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg border-2 border-card text-card font-body font-semibold text-sm hover:bg-card/10 transition-colors"
            >
              Cotizar ahora
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-1.5 text-card/80">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="font-body text-sm ml-2">4.9/5 — Más de 5,000 pedidos entregados</span>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2 — TRUST BAR ═══ */}
      <section className="bg-card py-6">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-body text-xs text-muted-foreground text-center mb-4 uppercase tracking-wider">
            Empresas que confían en Berlioz
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TRUST_COMPANIES.map((name) => (
              <div
                key={name}
                className="px-5 py-2.5 rounded-sm bg-muted font-mono text-xs text-muted-foreground tracking-wide"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3 — QUICK QUOTER ═══ */}
      <section className="bg-blue-light py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-heading text-2xl md:text-[28px] text-foreground text-center mb-8">
            ¿Cuánto cuesta tu evento?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Event type */}
            <div>
              <label className="block font-body text-xs font-medium text-muted-foreground mb-1.5">¿Qué tipo de evento?</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecciona...</option>
                {EVENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {/* People */}
            <div>
              <label className="block font-body text-xs font-medium text-muted-foreground mb-1.5">¿Cuántas personas?</label>
              <input
                type="number"
                min={10}
                value={people}
                onChange={(e) => setPeople(e.target.value ? Number(e.target.value) : "")}
                placeholder="ej. 25"
                className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {/* Date */}
            <div>
              <label className="block font-body text-xs font-medium text-muted-foreground mb-1.5">¿Cuándo?</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full h-12 px-4 rounded-lg border border-input bg-card font-body text-sm text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring",
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
            className="w-full md:w-auto md:mx-auto md:flex h-12 px-8 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            Ver opciones y precios
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ═══ SECTION 4 — MENU BY OCCASION ═══ */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-[32px] text-foreground text-center mb-2">¿Qué necesitas hoy?</h2>
          <p className="font-body text-muted-foreground text-center mb-10">Selecciona el tipo de momento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {OCCASIONS.map((o) => (
              <a
                key={o.id}
                href={`/menu?occasion=${o.id}`}
                className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-muted flex items-center justify-center text-5xl">
                  {o.emoji}
                </div>
                <div className="p-5">
                  <h3 className="font-body font-semibold text-foreground text-base">{o.name}</h3>
                  <p className="font-body text-sm text-secondary mt-1">desde ${o.price} por persona</p>
                  <span className="inline-flex items-center gap-1 font-body text-xs font-medium text-primary mt-3 group-hover:underline">
                    Ver opciones <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — SOCIAL PROOF ═══ */}
      <section className="py-16 bg-card">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-[28px] text-foreground text-center mb-10">Lo que dicen nuestros clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-background rounded-lg border border-border p-6">
                <p className="font-body text-sm text-foreground leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-body font-semibold text-sm", t.color)}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="font-body text-xs text-muted-foreground">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — HOW IT WORKS ═══ */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading text-[32px] text-foreground mb-10">Así de fácil</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-blue-light flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-mono text-xs text-muted-foreground mb-1">Paso {i + 1}</span>
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
