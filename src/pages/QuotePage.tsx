import { useState, useMemo, useCallback, useEffect } from "react";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, MapPin, AlertTriangle, CheckCircle, Info, ChevronRight, X } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import StepperProgress from "@/components/ui/StepperProgress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TOP_DELIVERY_ZONES, DURATION_OPTIONS } from "@/domain/entities/BerliozCatalog";
import ProposalStep from "@/components/quoter/ProposalStep";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { useSmartQuote } from "@/hooks/useSmartQuote";
import type { SmartQuoteResponse } from "@/domain/entities/SmartQuote";

// Images
// Premium Images from src/assets/imagenes_menu
import breakfastImg from "@/assets/imagenes_menu/des_breakfast-in-roma.jpg";
import boxlunchImg from "@/assets/imagenes_menu/wl_pink-box.jpg";
import coffeeImg from "@/assets/imagenes_menu/cb_coffee-break-pm.jpg";
import juntaImg from "@/assets/imagenes_menu/wl_comedor-berlioz.jpg";
import veganoImg from "@/assets/imagenes_menu/veg_pink-box-vegana.jpg";
const heroImg = new URL("@/assets/heroCoti.JPG", import.meta.url).href;

/* ── constants ── */
const WIZARD_STEPS = [
  { label: "Tipo de evento" },
  { label: "Detalles" },
  { label: "Tu propuesta" },
];

interface EventTypeCard {
  value: string;
  label: string;
  badge: string;
  badgeStyle: 'gold' | 'dark' | 'none';
  badgePosition: 'top' | 'bottom';
  desc: string;
  price: string;
  icon: string;
  image: string;
  tags: { label: string; color: string }[];
  filters: string[];
}

const EVENT_TYPES: EventTypeCard[] = [
  {
    value: "desayuno", label: "Desayuno", badge: "🍳 Perfecto para morning meetings", badgeStyle: "gold", badgePosition: "top",
    desc: "Desde 4 personas · 7am en adelante", price: "Desde $170/persona", icon: "🍳", image: breakfastImg,
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Vegano", color: "bg-green-100 text-green-700" }, { label: "Sin gluten", color: "bg-amber-100 text-amber-700" }],
    filters: ["vegano", "gluten", "budget", "small"],
  },
  {
    value: "coffee-break", label: "Coffee Break", badge: "☕ Ideal para juntas", badgeStyle: "gold", badgePosition: "top",
    desc: "Desde 4 personas · mañana o tarde", price: "Desde $240/persona", icon: "☕", image: coffeeImg,
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }],
    filters: ["vegano"],
  },
  {
    value: "working-lunch", label: "Working Lunch", badge: "⭐ El más pedido", badgeStyle: "dark", badgePosition: "top",
    desc: "El producto estrella de Berlioz", price: "Desde $150/persona", icon: "🍱", image: boxlunchImg,
    tags: [{ label: "Vegano", color: "bg-green-100 text-green-700" }, { label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Sin gluten", color: "bg-amber-100 text-amber-700" }, { label: "Keto", color: "bg-purple-100 text-purple-700" }],
    filters: ["vegano", "gluten", "budget"],
  },
  {
    value: "capacitacion", label: "Capacitación", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Servicio completo de día", price: "Paquete de día completo", icon: "📋", image: juntaImg,
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Vegano", color: "bg-green-100 text-green-700" }],
    filters: ["vegano"],
  },
  {
    value: "reunion-ejecutiva", label: "Reunión ejecutiva", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Para grupos pequeños y VIP", price: "Experiencia premium", icon: "💼", image: heroImg,
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Sin gluten", color: "bg-amber-100 text-amber-700" }, { label: "Keto", color: "bg-purple-100 text-purple-700" }],
    filters: ["gluten", "small"],
  },
  {
    value: "filmacion", label: "Filmación", badge: "💡 Económico y portable", badgeStyle: "gold", badgePosition: "bottom",
    desc: "Bags y opciones portables", price: "Opciones económicas portables", icon: "🎬", image: veganoImg,
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }],
    filters: ["budget", "small", "vegano"],
  },
];

const FILTER_CHIPS = [
  { value: "todos", label: "Todos" },
  { value: "vegano", label: "Con opciones veganas" },
  { value: "gluten", label: "Sin gluten" },
  { value: "budget", label: "Menos de $200/persona" },
  { value: "small", label: "Grupos pequeños (<10)" },
];

const DIETARY_OPTIONS = [
  { value: "vegano", label: "🌱 Vegano" },
  { value: "vegetariano", label: "🌿 Vegetariano" },
  { value: "sin_gluten", label: "🚫🌾 Sin gluten" },
  { value: "sin_lactosa", label: "🥛 Sin lactosa" },
  { value: "keto", label: "🔥 Keto" },
];

const TIME_SLOTS = Array.from({ length: 31 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
});

function calcDeliveryTime(eventTime: string): string {
  const [h, m] = eventTime.split(":").map(Number);
  let total = h * 60 + m - 90;
  if (total < 0) total = 0;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function isCutoff(selectedDate: Date | undefined): boolean {
  if (!selectedDate) return false;
  const now = new Date();
  const tomorrow = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  const sel = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  return sel.getTime() === tomorrow.getTime() && now.getHours() >= 15;
}

/* ── component ── */
const QuotePage = () => {
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState("");
  const [eventFilter, setEventFilter] = useState("todos");
  const [duration, setDuration] = useState("");
  const [people, setPeople] = useState<number | "">(10);
  const [postalCode, setPostalCode] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState("");
  const [hasBudget, setHasBudget] = useState<boolean | null>(null);
  const [budget, setBudget] = useState(300);
  const [hasDietary, setHasDietary] = useState<boolean | null>(null);
  const [dietary, setDietary] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [receiveConfirm, setReceiveConfirm] = useState(false);

  // Smart Quote
  const { loading: smartLoading, generateQuote } = useSmartQuote();
  const [smartData, setSmartData] = useState<SmartQuoteResponse | null>(null);

  const tomorrow = addDays(new Date(), 1);
  const deliveryTime = eventTime ? calcDeliveryTime(eventTime) : "";
  const isEarlyDelivery = deliveryTime !== "" && (parseInt(deliveryTime.split(":")[0]) < 7 || (deliveryTime.startsWith("07:") && parseInt(deliveryTime.split(":")[1]) < 30));
  const cutoffBlocked = isCutoff(date);
  const isInZone = postalCode.length === 5 && TOP_DELIVERY_ZONES.some(z => postalCode === z || postalCode.startsWith(z.slice(0, 3)));
  const isSmallGroup = typeof people === "number" && people >= 1 && people <= 3;
  const numPeople = typeof people === "number" ? people : 0;

  const filteredEvents = useMemo(() => {
    if (eventFilter === "todos") return EVENT_TYPES;
    return EVENT_TYPES.filter(e => e.filters.includes(eventFilter));
  }, [eventFilter]);

  const canNextStep1 = eventType !== "";
  const canNextStep2 = numPeople >= 1 && !!date && eventTime !== "" && !cutoffBlocked && receiveConfirm;

  const toggleDietary = (val: string) => {
    setDietary(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]);
  };

  const durationHours = useMemo(() => {
    if (duration === '1h') return 1;
    if (duration === '2-3h') return 2.5;
    if (duration === '3-5h') return 4;
    if (duration === '5h+') return 6;
    return 3;
  }, [duration]);

  const goNext = useCallback(() => {
    if (step === 0 && canNextStep1) setStep(1);
    else if (step === 1 && canNextStep2) {
      setStep(2);
      generateQuote({
        eventType,
        peopleCount: numPeople,
        eventDate: date ? format(date, 'yyyy-MM-dd') : undefined,
        eventTime,
        deliveryTime,
        zipCode: postalCode,
        durationHours,
        budgetEnabled: hasBudget === true,
        budgetPerPerson: hasBudget === true ? budget : undefined,
        dietaryRestrictions: dietary,
        contactName: clientName,
        companyName: empresa,
      }).then(data => {
        if (data) setSmartData(data);
      });
    }
  }, [step, canNextStep1, canNextStep2, eventType, numPeople, date, eventTime, deliveryTime, postalCode, durationHours, hasBudget, budget, dietary, clientName, empresa, generateQuote]);

  const goBack = () => setStep(s => Math.max(0, s - 1));

  return (
    <BaseLayout hideFooter>
      <div className="bg-background min-h-screen pb-20">
        {/* PREMIUM HERO SECTION (only step 0) */}
        {step === 0 && (
          <div className="relative h-[60vh] min-h-[500px] mb-12 overflow-hidden bg-primary">
            <img src={heroImg} alt="Catering Berlioz" className="absolute inset-0 w-full h-full object-cover opacity-80 scale-105" />
            {/* Simple bottom gradient for text contrast only */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 py-24 px-6 text-center">
              <RevealOnScroll delay={100}>
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-[0.3em] uppercase mb-6 border border-white/20">
                  L'ART DE RECEVOIR
                </span>
                <h1 className="font-heading text-5xl md:text-7xl text-white mb-6 tracking-tight drop-shadow-2xl">
                  Cotizador <span className="italic">Gourmet</span>
                </h1>
                <p className="max-w-xl mx-auto font-body text-lg text-white/80 leading-relaxed shadow-sm">
                  Crea una experiencia gastronómica a la medida de tu evento empresarial, con el sello distintivo de Berlioz.
                </p>
              </RevealOnScroll>
            </div>
          </div>
        )}

        <div className={cn("py-8 border-b border-border shadow-sm sticky top-0 bg-white/80 backdrop-blur-xl z-50 transition-all", step > 0 ? "mb-12 py-6" : "mb-12")}>
          <div className="max-w-4xl mx-auto px-6">
            <StepperProgress steps={WIZARD_STEPS} currentStep={step} />
          </div>
        </div>

      {/* ═══ STEP 1 — EVENT TYPE ═══ */}
      {step === 0 && (
        <div className="max-w-6xl mx-auto px-6 py-4 animate-slide-up">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl md:text-5xl text-primary mb-4 tracking-tight">¿Qué tipo de evento es?</h2>
              <p className="font-body text-lg text-muted-foreground">Selecciona el tipo de momento para tu cotización</p>
            </div>
          </RevealOnScroll>

          {/* Filter chips */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {FILTER_CHIPS.map(chip => (
              <button key={chip.value} onClick={() => setEventFilter(chip.value)}
                className={cn("px-6 py-2.5 rounded-full font-body text-sm font-semibold transition-all border shadow-sm",
                  eventFilter === chip.value ? "bg-primary text-primary-foreground border-primary shadow-primary/20" : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/50"
                )}>
                {chip.label}
              </button>
            ))}
          </div>

          {/* Event cards 2x3 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((e, idx) => {
              const selected = eventType === e.value;
              return (
                <RevealOnScroll key={e.value} delay={idx * 50} className="h-full">
                  <button onClick={() => setEventType(e.value)}
                    className={cn(
                      "group relative flex flex-col rounded-[32px] border-2 transition-all text-left overflow-hidden bg-card h-full w-full",
                      selected ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary/20" : "border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
                    )}>
                    
                    {/* Image Area */}
                    <div className="relative h-48 overflow-hidden">
                      <img src={e.image} alt={e.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Icon overlay */}
                      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg border border-white/30">
                        {e.icon}
                      </div>

                      {/* Badge top */}
                      {e.badge && e.badgePosition === "top" && (
                        <span className={cn("absolute top-4 right-4 px-3 py-1 rounded-full font-body text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border",
                          e.badgeStyle === "dark" ? "bg-black/60 text-white border-white/20" : "bg-white/80 text-amber-800 border-amber-200"
                        )}>{e.badge.replace(/^[^ ]+ /, '')}</span>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      {/* Checkmark indicator */}
                      <div className={cn("absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        selected ? "bg-primary text-primary-foreground scale-100 opacity-100" : "bg-white/20 scale-50 opacity-0"
                      )}>
                        <CheckCircle className="w-5 h-5 fill-current" />
                      </div>

                      <h3 className="font-heading text-xl text-foreground mb-2 group-hover:text-primary transition-colors">{e.label}</h3>
                      <p className="font-body text-sm text-muted-foreground mb-4 leading-relaxed">{e.desc}</p>
                      
                      <div className="mt-auto">
                        <p className="font-body text-sm text-primary font-bold mb-4">{e.price}</p>
                        
                        {e.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/60">
                            {e.tags.map(tag => (
                              <span key={tag.label} className={cn("px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase", tag.color)}>{tag.label}</span>
                            ))}
                          </div>
                        )}
                        
                        {/* Badge bottom */}
                        {e.badge && e.badgePosition === "bottom" && (
                          <span className="mt-3 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-body text-[10px] font-bold tracking-wider uppercase border border-amber-200 self-start">{e.badge.replace(/^[^ ]+ /, '')}</span>
                        )}
                      </div>
                    </div>
                  </button>
                </RevealOnScroll>
              );
            })}
          </div>

          <RevealOnScroll delay={300}>
            <div className="mt-16 flex justify-center">
              <Button onClick={goNext} disabled={!canNextStep1} size="lg" className="h-14 px-12 rounded-full text-base font-bold shadow-lg shadow-primary/20 group">
                Siguiente paso
                <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      )}

      {/* ═══ STEP 2 — EVENT DETAILS ═══ */}
      {step === 1 && (
        <div className="max-w-4xl mx-auto px-6 py-4 animate-slide-up">
           <RevealOnScroll>
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl md:text-5xl text-primary mb-4 tracking-tight">Detalles del evento</h2>
              <p className="font-body text-lg text-muted-foreground">Ayúdanos a personalizar tu propuesta gourmet</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column — Core Info */}
            <div className="lg:col-span-12 space-y-8">
              
              {/* People & Date & Time Card */}
              <div className="bg-card rounded-[40px] border border-border p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* People count */}
                  <div>
                    <label className="block font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">¿Para cuántos?</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setPeople(p => Math.max(1, (typeof p === "number" ? p : 10) - 1))}
                        className="w-12 h-12 rounded-2xl border border-border bg-background flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all shadow-sm">
                        <Minus className="w-5 h-5" />
                      </button>
                      <input type="number" value={people}
                        onChange={e => { const v = e.target.value; setPeople(v === "" ? "" : Math.max(1, Number(v))); }}
                        placeholder="10"
                        className="w-20 h-12 text-center rounded-2xl border border-primary/30 bg-background font-mono text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => setPeople(p => (typeof p === "number" ? p : 10) + 1)}
                        className="w-12 h-12 rounded-2xl border border-border bg-background flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all shadow-sm">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="font-body text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary/60" /> Mínimo 4 personas para entrega
                    </p>

                    {isSmallGroup && (
                      <div className="mt-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/10 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex gap-3">
                          <MapPin className="w-5 h-5 text-secondary shrink-0" />
                          <div className="font-body text-xs text-foreground">
                            <p className="font-bold mb-1">Pick up disponible</p>
                            <p className="text-muted-foreground leading-relaxed">Para grupos pequeños recolecta en nuestra cocina sin costo de envío.</p>
                            <a href="https://maps.google.com/?q=Lago+Onega+285+Col+Modelo+Pensil+CDMX" target="_blank" rel="noopener"
                              className="text-secondary hover:underline font-bold mt-2 inline-block">Ver mapa →</a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">¿Qué día?</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(
                          "w-full h-14 px-5 rounded-2xl border-2 transition-all flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-primary/10",
                          date ? "border-primary/30 bg-primary/5 font-semibold" : "border-border bg-background text-muted-foreground"
                        )}>
                          <CalendarIcon className={cn("w-5 h-5", date ? "text-primary" : "text-muted-foreground")} />
                          <span className="font-body text-sm">
                            {date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : "Selecciona fecha"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={setDate}
                          disabled={d => isBefore(d, tomorrow)}
                          initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    {cutoffBlocked && (
                      <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                        <p className="font-body text-[11px] text-destructive flex items-center gap-2 font-bold uppercase tracking-tight">
                          <AlertTriangle className="w-4 h-4" />
                          Límite de horario excedido para mañana
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Time Selector */}
                  <div>
                    <label className="block font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">¿A qué hora?</label>
                    <select value={eventTime} onChange={e => setEventTime(e.target.value)}
                      className={cn("w-full h-14 px-5 rounded-2xl border-2 transition-all font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none bg-no-repeat bg-[right_1.25rem_center] bg-[length:1em_1em]",
                        eventTime ? "border-primary/30 bg-primary/5 font-semibold text-primary" : "border-border bg-background text-muted-foreground"
                      )}
                      style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")'}}>
                      <option value="">Selecciona horario</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t} className="text-foreground">{t}</option>)}
                    </select>
                    {deliveryTime && (
                      <div className="mt-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                        <p className="font-body text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Entrega estimada</p>
                        <p className="font-mono text-lg text-primary font-bold">{deliveryTime}</p>
                        {isEarlyDelivery && (
                          <div className="mt-2 text-[10px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-amber-200 uppercase tracking-tighter">
                            <AlertTriangle className="w-3 h-3" /> Recargo temprano (+$290)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Duration Card */}
              <div className="bg-card rounded-[40px] border border-border p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-secondary/20" />
                <label className="block font-heading text-sm font-bold text-foreground mb-6 uppercase tracking-wider">¿Cuál es la duración del evento?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DURATION_OPTIONS.map(d => (
                    <button key={d.id} onClick={() => setDuration(d.id)}
                      className={cn("p-6 rounded-3xl border-2 text-left transition-all relative group flex flex-col h-full",
                        duration === d.id ? "border-secondary bg-secondary/5 ring-4 ring-secondary/5 shadow-md shadow-secondary/5" : "border-border bg-background hover:border-secondary/30 shadow-sm"
                      )}>
                      <div className="flex-1">
                        <p className={cn("font-heading text-base font-bold transition-colors", duration === d.id ? "text-secondary" : "text-foreground")}>{d.label}</p>
                        <p className="font-body text-[11px] text-muted-foreground mt-1 mb-4 leading-snug">{d.subtitle}</p>
                      </div>
                      <p className="font-body text-xs text-secondary font-bold pt-3 border-t border-secondary/10 mt-auto">{d.priceHint}</p>
                      {duration === d.id && <div className="absolute top-4 right-4 text-secondary"><CheckCircle className="w-5 h-5 fill-current" /></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Budget Selection */}
                <div className="bg-card rounded-[40px] border border-border p-8 md:p-10 shadow-sm">
                  <label className="block font-heading text-sm font-bold text-foreground mb-6 uppercase tracking-wider">¿Presupuesto por persona?</label>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button onClick={() => setHasBudget(true)}
                      className={cn("p-6 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                        hasBudget === true ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40")}>
                      <span className="font-heading text-lg font-bold">Sí</span>
                      <p className="font-body text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Tengo un rango</p>
                    </button>
                    <button onClick={() => setHasBudget(false)}
                      className={cn("p-6 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                        hasBudget === false ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40")}>
                      <span className="font-heading text-lg font-bold text-muted-foreground">No</span>
                      <p className="font-body text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Sorpréndeme</p>
                    </button>
                  </div>
                  {hasBudget && (
                    <div className="p-6 bg-muted/30 rounded-[32px] border border-border/50 animate-in zoom-in-95 duration-300">
                      <div className="text-center mb-6">
                        <span className="font-mono text-4xl text-primary font-black tracking-tighter">${budget}</span>
                        <span className="font-body text-muted-foreground text-xs uppercase font-bold tracking-widest block mt-1">MXN / PERSONA</span>
                      </div>
                      <input type="range" min={150} max={800} step={10} value={budget}
                        onChange={e => setBudget(Number(e.target.value))} className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer accent-primary" />
                      <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-3 font-bold"><span>$150</span><span>$800</span></div>
                    </div>
                  )}
                </div>

                {/* Dietary Selection */}
                <div className="bg-card rounded-[40px] border border-border p-8 md:p-10 shadow-sm">
                  <label className="block font-heading text-sm font-bold text-foreground mb-6 uppercase tracking-wider">¿Restricciones dietéticas?</label>
                  <div className="flex flex-wrap gap-2.5">
                    {DIETARY_OPTIONS.map(d => {
                      const active = dietary.includes(d.value);
                      return (
                        <button key={d.value} onClick={() => toggleDietary(d.value)}
                          className={cn("px-5 py-3 rounded-2xl border-2 font-body text-sm font-bold transition-all flex items-center gap-2",
                            active ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "border-border bg-background text-foreground hover:border-primary/30"
                          )}>
                          {d.label}
                          {active && <X className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                    {dietary.length === 0 && (
                      <div className="w-full py-8 text-center text-muted-foreground font-body text-sm border-2 border-dashed border-border rounded-2xl">
                        Ninguna restricción seleccionada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Final Contact Details */}
              <div className="bg-primary/5 rounded-[40px] border border-primary/10 p-8 md:p-10 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className="block font-heading text-xs font-bold text-primary mb-3 uppercase tracking-[0.2em]">Tu nombre</label>
                    <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej. Ana García" 
                      className="h-14 rounded-2xl border-2 border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/5 text-lg" />
                  </div>
                  <div>
                    <label className="block font-heading text-xs font-bold text-primary mb-3 uppercase tracking-[0.2em]">Empresa</label>
                    <Input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Ej. Acme Corp" 
                      className="h-14 rounded-2xl border-2 border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/5 text-lg" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-primary/10">
                  <label className="flex items-start gap-4 cursor-pointer group max-w-lg">
                    <div className={cn("mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", 
                      receiveConfirm ? "bg-primary border-primary text-white" : "border-primary/30 group-hover:border-primary"
                    )}>
                      {receiveConfirm && <CheckCircle className="w-4 h-4 fill-current" />}
                    </div>
                    <Checkbox checked={receiveConfirm} onCheckedChange={(v) => setReceiveConfirm(v === true)} className="hidden" />
                    <span className="font-body text-sm text-foreground leading-snug">
                       Confirmo que habrá alguien responsable para recibir el pedido en el horario acordado
                    </span>
                  </label>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={goBack} className="h-14 px-8 rounded-full font-bold border-2 hover:bg-muted transition-all">
                      Volver
                    </Button>
                    <Button onClick={goNext} disabled={!canNextStep2} className="h-14 px-12 rounded-full font-bold shadow-xl shadow-primary/20 group">
                      Ver propuesta <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 3 — PROPOSAL ═══ */}
      {step === 2 && (
        <div className="bg-white rounded-[40px] border border-border shadow-2xl mx-4 sm:mx-6 overflow-hidden">
          <ProposalStep
            eventType={eventType}
            eventLabel={EVENT_TYPES.find(e => e.value === eventType)?.label ?? eventType}
            people={numPeople}
            date={date}
            eventTime={eventTime}
            deliveryTime={deliveryTime}
            isEarlyDelivery={!!isEarlyDelivery}
            postalCode={postalCode}
            clientName={clientName}
            empresa={empresa}
            duration={duration}
            onBack={goBack}
            onRestart={() => { setStep(0); setSmartData(null); }}
            smartQuoteData={smartData}
            smartQuoteLoading={smartLoading}
          />
        </div>
      )}
    </div>
  </BaseLayout>
);
};

export default QuotePage;
