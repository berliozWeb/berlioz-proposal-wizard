import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, MapPin, AlertTriangle, CheckCircle, Info, ChevronRight, Truck, Package, Phone, Target, CalendarDays, Coffee, UtensilsCrossed, Croissant, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { lookupCP, type ShippingResult } from "@/data/shippingZones";
import BaseLayout from "@/components/layout/BaseLayout";
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
import {
  buildSingleDeliveryGroup,
  buildDeliveryGroupSlots,
  type DeliveryGroup,
  type EventMode,
} from "@/domain/entities/DeliveryGroup";

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
  Icon: LucideIcon;
  image: string;
  tags: { label: string; color: string }[];
  filters: string[];
}

const EVENT_TYPES: EventTypeCard[] = [
  {
    value: "desayuno", label: "Desayuno", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Perfecto para morning meetings", price: "Desde $170/persona", icon: "🍳", Icon: Croissant, image: breakfastImg,
    tags: [], filters: [],
  },
  {
    value: "working-lunch", label: "Comida", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "El producto estrella de Berlioz", price: "Desde $150/persona", icon: "🍱", Icon: UtensilsCrossed, image: boxlunchImg,
    tags: [], filters: [],
  },
  {
    value: "coffee-break", label: "Coffee Break", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Ideal para juntas y pausas", price: "Desde $240/persona", icon: "☕", Icon: Coffee, image: coffeeImg,
    tags: [], filters: [],
  },
  {
    value: "otro", label: "Otro", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Cuéntanos qué necesitas", price: "Cotización a la medida", icon: "✨", Icon: Sparkles, image: juntaImg,
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
  // NEW: event mode pre-step (single vs multi delivery). null = not chosen yet.
  const [eventMode, setEventMode] = useState<EventMode | null>(null);
  const [multiDays, setMultiDays] = useState<number>(1);
  const [multiPerDay, setMultiPerDay] = useState<1 | 2 | 3 | 4>(1);
  const [deliveryGroups, setDeliveryGroups] = useState<DeliveryGroup[]>(
    () => buildSingleDeliveryGroup(),
  );
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
  const [streetAddress, setStreetAddress] = useState("");
  const [cpTouched, setCpTouched] = useState(false);
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

  // Pre-fill consecutive dates for multi-delivery slots based on main event date
  useEffect(() => {
    if (eventMode !== 'multi' || !date) return;
    setDeliveryGroups(prev => prev.map((g, idx) => {
      if (g.date) return g; // don't overwrite user-edited dates
      const dayOffset = (g.dayIndex ?? Math.floor(idx / multiPerDay) + 1) - 1;
      return { ...g, date: format(addDays(date, dayOffset), 'yyyy-MM-dd') };
    }));
  }, [date, eventMode, multiPerDay, multiDays]);

  const canNextStep1 = eventType !== "";

  // CP shipping lookup — only runs when 5 digits entered
  const shippingResult: ShippingResult | null = useMemo(() => {
    if (postalCode.length !== 5) return null;
    return lookupCP(postalCode);
  }, [postalCode]);
  const cpInvalidFormat = cpTouched && postalCode.length > 0 && postalCode.length !== 5;
  const isSpecialQuoteCP = shippingResult?.zone === 0;

  const canNextStep2 =
    numPeople >= 1 &&
    !!date &&
    eventTime !== "" &&
    !cutoffBlocked &&
    postalCode.length === 5 &&
    !isSpecialQuoteCP;

  // Auto-show form al seleccionar tipo de evento + smooth scroll
  const handleSelectEventType = (value: string) => {
    setEventType(value);
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
    if (canNextStep1 && canNextStep2) {
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
  }, [canNextStep1, canNextStep2, eventType, numPeople, date, eventTime, deliveryTime, postalCode, durationHours, hasBudget, budget, dietary, clientName, empresa, generateQuote]);

  const goBack = () => { setStep(0); setEventType(""); setEventMode(null); setDeliveryGroups(buildSingleDeliveryGroup()); };

  const showForm = eventType !== "" && eventMode === 'single';

  // ── Multi mode validation & submit ──
  const multiTotalGuests = useMemo(
    () => deliveryGroups.reduce((sum, g) => sum + (g.guests_count || 0), 0),
    [deliveryGroups],
  );
  const multiAllSlotsValid = deliveryGroups.length > 0 && deliveryGroups.every(
    g => !!g.date && !!g.time && (g.guests_count || 0) > 0,
  );
  const canSubmitMulti =
    eventMode === 'multi' &&
    eventType !== '' &&
    multiAllSlotsValid &&
    postalCode.length === 5 &&
    !isSpecialQuoteCP;

  const goNextMulti = useCallback(() => {
    if (!canSubmitMulti) return;
    const firstSlot = deliveryGroups[0];
    const firstDate = firstSlot?.date ? new Date(firstSlot.date + 'T00:00:00') : undefined;
    const firstTime = firstSlot?.time || '09:00';
    setStep(2);
    generateQuote({
      eventType,
      peopleCount: multiTotalGuests,
      eventDate: firstSlot?.date,
      eventTime: firstTime,
      deliveryTime: calcDeliveryTime(firstTime),
      zipCode: postalCode,
      durationHours: 3,
      budgetEnabled: false,
      dietaryRestrictions: [],
      contactName: clientName,
      companyName: empresa,
    }).then(data => { if (data) setSmartData(data); });
    if (firstDate) setDate(firstDate);
    if (firstTime) setEventTime(firstTime);
    setPeople(multiTotalGuests);
  }, [canSubmitMulti, deliveryGroups, eventType, multiTotalGuests, postalCode, isSpecialQuoteCP, clientName, empresa, generateQuote]);

  return (
    <BaseLayout hideFooter>
      <div className="bg-background min-h-screen pb-20">
        {/* COMPACT HERO 3:1 (only intake) */}
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

      {/* ═══ STEP 0 — SINGLE PAGE, CONTINUOUS SCROLL ═══ */}
      {step === 0 && (
        <div className="max-w-5xl mx-auto px-6 py-4 space-y-12">

          {/* ── Section A: Event mode (compact cards) ── */}
          <section className="animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="font-heading text-3xl md:text-4xl text-primary mb-2 tracking-tight">¿Cómo es tu evento?</h2>
              <p className="font-body text-sm text-muted-foreground">Cuéntanos cuántas entregas necesitas</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {([
                { mode: 'single' as const, Icon: Target, title: 'Una sola entrega', subtitle: 'Evento de un momento' },
                { mode: 'multi' as const, Icon: CalendarDays, title: 'Varias entregas', subtitle: 'Varios días o entregas' },
              ]).map(({ mode, Icon, title, subtitle }) => {
                const selected = eventMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      setEventMode(mode);
                      if (mode === 'single') setDeliveryGroups(buildSingleDeliveryGroup());
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left min-h-[88px]",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-sm font-bold text-foreground leading-tight">{title}</h3>
                      <p className="font-body text-xs text-muted-foreground leading-snug mt-0.5">{subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Section B: Multi delivery config (only if multi) ── */}
          {eventMode === 'multi' && (
            <section className="animate-slide-up max-w-3xl mx-auto w-full">
              <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <label className="block font-heading text-sm font-bold text-foreground mb-3 uppercase tracking-wider">¿Cuántos días dura el evento?</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMultiDays(d => Math.max(1, d - 1))} className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number" min={1} max={30} value={multiDays}
                      onChange={(e) => setMultiDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                      className="w-16 h-10 text-center rounded-xl border border-primary/30 bg-background font-mono text-lg font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={() => setMultiDays(d => Math.min(30, d + 1))} className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="font-body text-xs text-muted-foreground">días (máx. 30)</span>
                  </div>
                </div>

                <div>
                  <label className="block font-heading text-sm font-bold text-foreground mb-3 uppercase tracking-wider">¿Cuántas entregas por día?</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([1, 2, 3, 4] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setMultiPerDay(n);
                          setDeliveryGroups(buildDeliveryGroupSlots(multiDays, n));
                        }}
                        className={cn(
                          "h-12 rounded-xl border-2 font-heading text-base font-bold transition-all",
                          multiPerDay === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-primary/40",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <p className="font-body text-xs text-muted-foreground">
                    Se crearán <span className="font-bold text-foreground">{multiDays * multiPerDay}</span> entregas
                    <span> ({multiDays} día{multiDays > 1 ? 's' : ''} × {multiPerDay} entrega{multiPerDay > 1 ? 's' : ''}/día)</span>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Section C: Event type (compact cards, only if mode chosen) ── */}
          {eventMode !== null && (
            <section className="animate-slide-up">
              <div className="text-center mb-6">
                <h2 className="font-heading text-3xl md:text-4xl text-primary mb-2 tracking-tight">¿Qué tipo de evento es?</h2>
                <p className="font-body text-sm text-muted-foreground">Selecciona el tipo de momento para tu cotización</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {EVENT_TYPES.map((e) => {
                  const selected = eventType === e.value;
                  const Icon = e.Icon;
                  return (
                    <button
                      key={e.value}
                      onClick={() => handleSelectEventType(e.value)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left min-h-[88px]",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-sm font-bold text-foreground leading-tight">{e.label}</h3>
                        <p className="font-body text-xs text-muted-foreground leading-snug mt-0.5">{e.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Section D: Per-delivery configuration (only multi + event type chosen) ── */}
          {eventMode === 'multi' && eventType !== '' && deliveryGroups.length > 0 && (
            <section className="animate-slide-up max-w-4xl mx-auto w-full">
              <div className="text-center mb-6">
                <h2 className="font-heading text-3xl md:text-4xl text-primary mb-2 tracking-tight">Configura cada entrega</h2>
                <p className="font-body text-sm text-muted-foreground">Define la fecha, hora y menú por slot</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveryGroups.map((g, idx) => {
                  const isFirst = idx === 0;
                  const dateValue = g.date ? new Date(g.date + 'T00:00:00') : undefined;
                  const updateGroup = (patch: Partial<DeliveryGroup>) => {
                    setDeliveryGroups(prev => prev.map((x, i) => i === idx ? { ...x, ...patch } : x));
                  };
                  return (
                    <div key={g.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-base font-bold text-primary">{g.label ?? `Entrega ${idx + 1}`}</h3>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Slot {idx + 1}/{deliveryGroups.length}
                        </span>
                      </div>

                      {/* Fecha */}
                      <div>
                        <label className="block font-body text-xs font-semibold text-foreground mb-1.5">Fecha</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal h-10", !dateValue && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateValue ? format(dateValue, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateValue}
                              onSelect={(d) => updateGroup({ date: d ? format(d, 'yyyy-MM-dd') : '' })}
                              disabled={(d) => isBefore(d, new Date(new Date().setHours(0, 0, 0, 0)))}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Hora */}
                      <div>
                        <label className="block font-body text-xs font-semibold text-foreground mb-1.5">Hora</label>
                        <input
                          type="time"
                          value={g.time || '09:00'}
                          onChange={(e) => updateGroup({ time: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Personas en esta entrega */}
                      <div>
                        <label className="block font-body text-xs font-semibold text-foreground mb-1.5">¿Cuántas personas en esta entrega?</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateGroup({ guests_count: Math.max(0, (g.guests_count || 0) - 1) })}
                            className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center hover:border-primary/40"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={g.guests_count || 0}
                            onChange={(e) => updateGroup({ guests_count: Math.max(0, Number(e.target.value) || 0) })}
                            className="flex-1 h-9 px-3 text-center rounded-lg border border-input bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => updateGroup({ guests_count: (g.guests_count || 0) + 1 })}
                            className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center hover:border-primary/40"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Dirección global del evento (CP) */}
              <div className="mt-8 bg-card rounded-3xl border border-border p-6 md:p-8 shadow-sm">
                <label className="block font-heading text-sm font-bold text-foreground mb-3 uppercase tracking-wider">¿A qué dirección entregamos?</label>
                <p className="font-body text-xs text-muted-foreground mb-3">Aplica para todas las entregas del evento</p>
                <Input
                  value={postalCode}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setPostalCode(val);
                    if (val.length === 5) setCpTouched(true);
                  }}
                  onBlur={() => setCpTouched(true)}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="C.P. (5 dígitos)"
                  className="h-14 rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-base font-mono tracking-wider"
                />
                {cpInvalidFormat && (
                  <p className="mt-3 text-xs font-body text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> El código postal debe tener 5 dígitos
                  </p>
                )}
                {shippingResult && (
                  <div className={cn(
                    "mt-3 rounded-2xl border-2 px-3 py-2.5 flex items-start gap-2",
                    isSpecialQuoteCP ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-muted/40 border-border/60 text-foreground",
                  )}>
                    {isSpecialQuoteCP ? <Phone className="w-4 h-4 mt-0.5 shrink-0" /> : <Truck className="w-4 h-4 mt-0.5 shrink-0" />}
                    <p className="font-body text-xs font-semibold leading-snug">{shippingResult.message}</p>
                  </div>
                )}
              </div>

              {/* Datos de contacto opcionales */}
              <div className="mt-6 bg-primary/5 rounded-3xl border border-primary/10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-heading text-xs font-bold text-primary mb-3 uppercase tracking-[0.2em]">Tu nombre</label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder='Ej. "Anne Seguy"'
                    className="h-14 rounded-2xl border-2 border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/5" />
                </div>
                <div>
                  <label className="block font-heading text-xs font-bold text-primary mb-3 uppercase tracking-[0.2em]">Empresa</label>
                  <Input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder='Ej. "Berlioz"'
                    className="h-14 rounded-2xl border-2 border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/5" />
                </div>
              </div>

              {/* CTA Generar propuesta */}
              <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="font-body text-sm text-muted-foreground">
                  Total estimado: <span className="font-bold text-foreground">{multiTotalGuests}</span> personas en <span className="font-bold text-foreground">{deliveryGroups.length}</span> entregas
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="h-14 px-8 rounded-full font-bold border-2">
                    Volver
                  </Button>
                  {isSpecialQuoteCP ? (
                    <Button asChild className="h-14 px-12 rounded-full font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      <a href="https://wa.me/525582375469" target="_blank" rel="noopener">
                        <Phone className="w-5 h-5 mr-2" /> Contáctanos para cotizar
                      </a>
                    </Button>
                  ) : (
                    <Button onClick={goNextMulti} disabled={!canSubmitMulti} className="h-14 px-12 rounded-full font-bold shadow-xl shadow-primary/20 group">
                      Generar propuesta <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ═══ EVENT DETAILS (same page, revealed) ═══ */}
      {step === 0 && showForm && (
        <div
          ref={detailsRef}
          className={cn(
            "max-w-4xl mx-auto px-6 py-4 transition-all duration-500 ease-out",
            showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
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

                  {/* CP */}
                  <div>
                    <label className="block font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">¿A qué dirección entregamos?</label>
                    <Input
                      value={postalCode}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                        setPostalCode(val);
                        if (val.length === 5) setCpTouched(true);
                      }}
                      onBlur={() => setCpTouched(true)}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="C.P. (5 dígitos)"
                      aria-invalid={cpInvalidFormat || isSpecialQuoteCP}
                      className="h-14 rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-base font-mono tracking-wider"
                    />
                    {cpInvalidFormat && (
                      <p className="mt-3 text-xs font-body text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        El código postal debe tener 5 dígitos
                      </p>
                    )}
                    {shippingResult && (() => {
                      const z = shippingResult.zone;
                      let bg = "bg-muted/40 border-border/60 text-foreground";
                      let Icon = Package;
                      let iconClass = "text-muted-foreground";
                      if (z === 0) {
                        bg = "bg-destructive/10 border-destructive/30 text-destructive";
                        Icon = Phone;
                        iconClass = "text-destructive";
                      } else if (!shippingResult.found) {
                        bg = "bg-muted/40 border-border/60 text-foreground";
                        Icon = Package;
                        iconClass = "text-muted-foreground";
                      } else if (z === 1 || z === 2) {
                        bg = "bg-emerald-50 border-emerald-200 text-emerald-900";
                        Icon = Truck;
                        iconClass = "text-emerald-700";
                      } else if (z >= 3 && z <= 5) {
                        bg = "bg-sky-50 border-sky-200 text-sky-900";
                        Icon = Package;
                        iconClass = "text-sky-700";
                      } else if (z >= 6) {
                        bg = "bg-amber-50 border-amber-200 text-amber-900";
                        Icon = AlertTriangle;
                        iconClass = "text-amber-700";
                      }
                      const headline = z === 0
                        ? shippingResult.message
                        : (z === 1 || z === 2)
                          ? `Entrega disponible — ${shippingResult.message}`
                          : shippingResult.message;
                      return (
                        <div className="mt-3 space-y-2">
                          <div className={cn("rounded-2xl border-2 px-3 py-2.5 flex items-start gap-2", bg)}>
                            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", iconClass)} />
                            <p className="font-body text-xs font-semibold leading-snug">{headline}</p>
                          </div>
                          {shippingResult.showPickupSuggestion && z !== 0 && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-amber-700 shrink-0" />
                              <p className="font-body text-[11px] text-amber-900 leading-relaxed">
                                ¿Sabías que puedes recoger tu pedido en cocina? Escríbenos al{" "}
                                <a href="https://wa.me/525582375469" target="_blank" rel="noopener" className="font-bold underline">
                                  55 8237 5469
                                </a>.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Time card — separado para mejor distribución del disclaimer */}
              <div className="bg-card rounded-[40px] border border-border p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
                  <div>
                    <label className="block font-heading text-sm font-bold text-foreground mb-4 uppercase tracking-wider">¿A qué hora inicia tu evento?</label>
                    <div className="relative">
                      <select value={eventTime} onChange={e => setEventTime(e.target.value)}
                        className={cn("w-full h-14 pl-5 pr-12 rounded-2xl border-2 transition-all font-body text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer",
                          eventTime ? "border-primary/30 bg-primary/5 font-semibold text-primary" : "border-border bg-background text-muted-foreground"
                        )}>
                        <option value="">Selecciona horario</option>
                        {TIME_SLOTS.map(t => <option key={t} value={t} className="text-foreground">{t}</option>)}
                      </select>
                      <ChevronRight className={cn("absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rotate-90 pointer-events-none", eventTime ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    {deliveryTime && isEarlyDelivery && (
                      <div className="mt-3 text-[10px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-amber-200 uppercase tracking-tighter">
                        <AlertTriangle className="w-3 h-3" /> Recargo temprano (+$290)
                      </div>
                    )}
                  </div>
                  {/* Disclaimer logística — al lado, ocupa el espacio restante */}
                  <div className={cn(
                    "border rounded-2xl flex gap-3 items-start transition-all duration-300 px-4 py-4",
                    eventTime
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/40 border-border/50"
                  )}>
                    <Truck className={cn("mt-0.5 shrink-0 transition-all", eventTime ? "w-5 h-5 text-primary" : "w-4 h-4 text-muted-foreground")} />
                    <p className={cn(
                      "font-body leading-relaxed transition-all",
                      eventTime ? "text-sm text-foreground" : "text-xs text-muted-foreground"
                    )}>
                      Esta ciudad puede ser impredecible — te recomendamos contemplar <span className="font-bold text-primary">90 minutos de margen</span> para la entrega.
                    </p>
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
                    {/* Sin restricción primero */}
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-base shrink-0">✅</span>
                        <span className="font-body text-sm font-semibold text-foreground truncate">Sin restricción</span>
                      </div>
                      <span className="font-mono text-base font-bold text-primary shrink-0">{sinRestriccion}</span>
                    </div>
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
                </div>
              </div>

              {/* Final Contact Details */}
              <div className="bg-primary/5 rounded-[40px] border border-primary/10 p-8 md:p-10 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block font-heading text-xs font-bold text-primary mb-3 uppercase tracking-[0.2em]">Tu nombre</label>
                    <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder='Ej. "Anne Seguy"'
                      className="h-14 rounded-2xl border-2 border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/5 text-lg" />
                  </div>
                  <div>
                    <label className="block font-heading text-xs font-bold text-primary mb-3 uppercase tracking-[0.2em]">Empresa</label>
                    <Input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder='Ej. "Berlioz"'
                      className="h-14 rounded-2xl border-2 border-primary/20 bg-background/50 focus:border-primary focus:ring-4 focus:ring-primary/5 text-lg" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 pt-6 border-t border-primary/10">
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={goBack} className="h-14 px-8 rounded-full font-bold border-2 hover:bg-muted transition-all">
                      Volver
                    </Button>
                    {isSpecialQuoteCP ? (
                      <Button asChild className="h-14 px-12 rounded-full font-bold shadow-xl shadow-destructive/20 bg-destructive hover:bg-destructive/90 text-destructive-foreground group">
                        <a href="https://wa.me/525582375469" target="_blank" rel="noopener">
                          <Phone className="w-5 h-5 mr-2" /> Contáctanos para cotizar
                        </a>
                      </Button>
                    ) : (
                      <Button onClick={goNext} disabled={!canNextStep2} className="h-14 px-12 rounded-full font-bold shadow-xl shadow-primary/20 group">
                        Ver propuesta <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    )}
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
