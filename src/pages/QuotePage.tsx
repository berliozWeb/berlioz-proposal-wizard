import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, MapPin, AlertTriangle, CheckCircle, Info, ChevronRight, Truck } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import StepperProgress from "@/components/ui/StepperProgress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOP_DELIVERY_ZONES } from "@/domain/entities/BerliozCatalog";
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
    value: "desayuno", label: "Desayuno", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Perfecto para morning meetings", price: "Desde $170/persona", icon: "🍳", image: breakfastImg,
    tags: [], filters: [],
  },
  {
    value: "working-lunch", label: "Comida", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "El producto estrella de Berlioz", price: "Desde $150/persona", icon: "🍱", image: boxlunchImg,
    tags: [], filters: [],
  },
  {
    value: "coffee-break", label: "Coffee Break", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Ideal para juntas y pausas", price: "Desde $240/persona", icon: "☕", image: coffeeImg,
    tags: [], filters: [],
  },
  {
    value: "otro", label: "Otro", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Cuéntanos qué necesitas", price: "Cotización a la medida", icon: "✨", image: juntaImg,
    tags: [], filters: [],
  },
];

const DIETARY_RESTRICTIONS = [
  { value: "vegano", label: "Vegano", icon: "🌱" },
  { value: "vegetariano", label: "Vegetariano", icon: "🥗" },
  { value: "sin_gluten", label: "Sin gluten", icon: "🚫🌾" },
  { value: "sin_lactosa", label: "Sin lactosa", icon: "🥛" },
  { value: "keto", label: "Keto", icon: "🔥" },
];

const DURATION_PILLS = [
  { id: "1h", label: "1 hora" },
  { id: "2-3h", label: "2-3 horas" },
  { id: "3-5h", label: "3-5 horas" },
  { id: "5h+", label: "Día completo" },
  { id: "otro", label: "Otro" },
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
  // (filtros eliminados)
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
  const [dietaryDistribution, setDietaryDistribution] = useState<Record<string, number>>({
    vegano: 0, vegetariano: 0, sin_gluten: 0, sin_lactosa: 0, keto: 0,
  });

  // Ref para smooth scroll al formulario de detalles
  const detailsRef = useRef<HTMLDivElement>(null);

  // Smart Quote
  const { loading: smartLoading, generateQuote, submitFeedback } = useSmartQuote();
  const [smartData, setSmartData] = useState<SmartQuoteResponse | null>(null);

  const tomorrow = addDays(new Date(), 1);
  const deliveryTime = eventTime ? calcDeliveryTime(eventTime) : "";
  const isEarlyDelivery = deliveryTime !== "" && (parseInt(deliveryTime.split(":")[0]) < 7 || (deliveryTime.startsWith("07:") && parseInt(deliveryTime.split(":")[1]) < 30));
  const cutoffBlocked = isCutoff(date);
  const isInZone = postalCode.length === 5 && TOP_DELIVERY_ZONES.some(z => postalCode === z || postalCode.startsWith(z.slice(0, 3)));
  const isSmallGroup = typeof people === "number" && people >= 1 && people <= 3;
  const numPeople = typeof people === "number" ? people : 0;

  // Distribución de invitados por restricción
  const totalRestricted = useMemo(
    () => Object.values(dietaryDistribution).reduce((a, b) => a + b, 0),
    [dietaryDistribution],
  );
  const sinRestriccion = Math.max(0, numPeople - totalRestricted);

  const updateDietaryCount = (key: string, delta: number) => {
    setDietaryDistribution(prev => {
      const current = prev[key] || 0;
      const next = current + delta;
      if (next < 0) return prev;
      const newTotal = totalRestricted - current + next;
      if (newTotal > numPeople) return prev; // bloquear exceso
      return { ...prev, [key]: next };
    });
  };

  // Sincroniza distribución → array dietary que consume la API
  useEffect(() => {
    setDietary(Object.entries(dietaryDistribution).filter(([, v]) => v > 0).map(([k]) => k));
  }, [dietaryDistribution]);

  const canNextStep1 = eventType !== "";
  const canNextStep2 = numPeople >= 1 && !!date && eventTime !== "" && !cutoffBlocked;

  // Auto-advance al seleccionar tipo de evento + smooth scroll
  const handleSelectEventType = (value: string) => {
    setEventType(value);
    if (step === 0) setStep(1);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
        {/* COMPACT HERO 3:1 (only step 0) */}
        {step === 0 && (
          <div className="relative w-full aspect-[3/1] max-h-[260px] mb-8 overflow-hidden bg-primary">
            <img src={heroImg} alt="Catering Berlioz" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
              <h1 className="font-heading text-3xl md:text-5xl text-white tracking-tight drop-shadow-2xl">
                Cuéntanos sobre tu <span className="italic">evento</span>
              </h1>
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

          {/* (filtros eliminados) */}

          {/* 4 cards sin tags, con auto-advance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {EVENT_TYPES.map((e) => {
              const selected = eventType === e.value;
              return (
                <button
                  key={e.value}
                  onClick={() => handleSelectEventType(e.value)}
                  className={cn(
                    "group relative flex flex-col rounded-[28px] border-2 transition-all text-left overflow-hidden bg-card h-full w-full",
                    selected
                      ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
                  )}>
                  <div className="relative h-40 overflow-hidden">
                    <img src={e.image} alt={e.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 w-11 h-11 rounded-2xl bg-card/30 backdrop-blur-md flex items-center justify-center text-2xl shadow-lg border border-card/40">
                      {e.icon}
                    </div>
                    <div className={cn(
                      "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      selected ? "bg-primary text-primary-foreground scale-100 opacity-100" : "scale-50 opacity-0",
                    )}>
                      <CheckCircle className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-heading text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{e.label}</h3>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">{e.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
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

                  {/* Time Selector + disclaimer logística */}
                  <div>
                    <label className="block font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">¿A qué hora inicia tu evento?</label>
                    <select value={eventTime} onChange={e => setEventTime(e.target.value)}
                      className={cn("w-full h-14 px-5 rounded-2xl border-2 transition-all font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none bg-no-repeat bg-[right_1.25rem_center] bg-[length:1em_1em]",
                        eventTime ? "border-primary/30 bg-primary/5 font-semibold text-primary" : "border-border bg-background text-muted-foreground"
                      )}
                      style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")'}}>
                      <option value="">Selecciona horario</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t} className="text-foreground">{t}</option>)}
                    </select>
                    {/* Disclaimer logística — siempre visible */}
                    <div className="mt-3 bg-muted/40 border border-border/50 rounded-xl px-3 py-2.5 flex gap-2 items-start">
                      <Truck className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <p className="font-body text-[11px] text-muted-foreground leading-relaxed">
                        Esta ciudad puede ser impredecible — te recomendamos contemplar <span className="font-semibold text-foreground">90 minutos de margen</span> para la entrega.
                      </p>
                    </div>
                    {deliveryTime && isEarlyDelivery && (
                      <div className="mt-2 text-[10px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-amber-200 uppercase tracking-tighter">
                        <AlertTriangle className="w-3 h-3" /> Recargo temprano (+$290)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Duration — pills simples */}
              <div className="bg-card rounded-[40px] border border-border p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-secondary/20" />
                <label className="block font-heading text-sm font-bold text-foreground mb-6 uppercase tracking-wider">¿Cuál es la duración del evento?</label>
                <div className="flex flex-wrap gap-3">
                  {DURATION_PILLS.map(d => {
                    const active = duration === d.id;
                    return (
                      <button key={d.id} onClick={() => setDuration(d.id)}
                        className={cn(
                          "px-6 py-3 rounded-full border-2 font-body text-sm font-semibold transition-all",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/15"
                            : "border-border bg-background text-foreground hover:border-primary/40",
                        )}>
                        {d.label}
                      </button>
                    );
                  })}
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

                {/* Distribución de invitados con restricciones */}
                <div className="bg-card rounded-[40px] border border-border p-8 md:p-10 shadow-sm">
                  <label className="block font-heading text-sm font-bold text-foreground mb-2 uppercase tracking-wider">Distribución de invitados</label>
                  <p className="font-body text-xs text-muted-foreground mb-5">
                    Distribución para <span className="font-bold text-foreground">{numPeople}</span> personas
                  </p>
                  <div className="space-y-3">
                    {DIETARY_RESTRICTIONS.map(r => {
                      const count = dietaryDistribution[r.value] || 0;
                      const cantIncrease = totalRestricted >= numPeople;
                      return (
                        <div key={r.value} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base shrink-0">{r.icon}</span>
                            <span className="font-body text-sm text-foreground truncate">{r.label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => updateDietaryCount(r.value, -1)}
                              disabled={count === 0}
                              className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-sm font-bold text-foreground w-6 text-center">{count}</span>
                            <button
                              onClick={() => updateDietaryCount(r.value, 1)}
                              disabled={cantIncrease}
                              className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                    <span className="font-body text-sm text-muted-foreground">Sin restricción</span>
                    <span className="font-mono text-base font-bold text-primary">{sinRestriccion} personas</span>
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

                <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 pt-6 border-t border-primary/10">
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
            onSubmitFeedback={submitFeedback}
          />
        </div>
      )}
    </div>
  </BaseLayout>
);
};

export default QuotePage;
