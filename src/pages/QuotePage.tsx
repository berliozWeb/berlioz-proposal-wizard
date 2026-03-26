import { useState, useMemo, useCallback } from "react";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, MapPin, AlertTriangle, CheckCircle, Info, ChevronRight } from "lucide-react";
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
  tags: { label: string; color: string }[];
  filters: string[];
}

const EVENT_TYPES: EventTypeCard[] = [
  {
    value: "desayuno", label: "Desayuno", badge: "🍳 Perfecto para morning meetings", badgeStyle: "gold", badgePosition: "top",
    desc: "Desde 4 personas · 7am en adelante", price: "Desde $170/persona", icon: "🍳",
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Vegano", color: "bg-green-100 text-green-700" }, { label: "Sin gluten", color: "bg-amber-100 text-amber-700" }],
    filters: ["vegano", "gluten", "budget", "small"],
  },
  {
    value: "coffee-break", label: "Coffee Break", badge: "☕ Ideal para juntas", badgeStyle: "gold", badgePosition: "top",
    desc: "Desde 4 personas · mañana o tarde", price: "Desde $240/persona", icon: "☕",
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }],
    filters: ["vegano"],
  },
  {
    value: "working-lunch", label: "Working Lunch", badge: "⭐ El más pedido", badgeStyle: "dark", badgePosition: "top",
    desc: "El producto estrella de Berlioz", price: "Desde $150/persona", icon: "🍱",
    tags: [{ label: "Vegano", color: "bg-green-100 text-green-700" }, { label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Sin gluten", color: "bg-amber-100 text-amber-700" }, { label: "Keto", color: "bg-purple-100 text-purple-700" }],
    filters: ["vegano", "gluten", "budget"],
  },
  {
    value: "capacitacion", label: "Capacitación", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Servicio completo de día", price: "Paquete de día completo", icon: "📋",
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Vegano", color: "bg-green-100 text-green-700" }],
    filters: ["vegano"],
  },
  {
    value: "reunion-ejecutiva", label: "Reunión ejecutiva", badge: "", badgeStyle: "none", badgePosition: "top",
    desc: "Para grupos pequeños y VIP", price: "Experiencia premium", icon: "💼",
    tags: [{ label: "Vegetariano", color: "bg-emerald-100 text-emerald-700" }, { label: "Sin gluten", color: "bg-amber-100 text-amber-700" }, { label: "Keto", color: "bg-purple-100 text-purple-700" }],
    filters: ["gluten", "small"],
  },
  {
    value: "filmacion", label: "Filmación", badge: "💡 Económico y portable", badgeStyle: "gold", badgePosition: "bottom",
    desc: "Bags y opciones portables", price: "Opciones económicas portables", icon: "🎬",
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
  // Step
  const [step, setStep] = useState(0);

  // Step 1 state
  const [eventType, setEventType] = useState("");
  const [eventFilter, setEventFilter] = useState("todos");

  // Step 2 state
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

  const goNext = useCallback(() => {
    if (step === 0 && canNextStep1) setStep(1);
    else if (step === 1 && canNextStep2) setStep(2);
  }, [step, canNextStep1, canNextStep2]);

  const goBack = () => setStep(s => Math.max(0, s - 1));

  return (
    <BaseLayout hideFooter>
      <StepperProgress steps={WIZARD_STEPS} currentStep={step} />

      {/* ═══ STEP 1 — EVENT TYPE ═══ */}
      {step === 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-slide-up">
          <h2 className="font-heading text-2xl text-foreground mb-2">¿Qué tipo de evento es?</h2>
          <p className="font-body text-sm text-muted-foreground mb-4">Selecciona el tipo de momento</p>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTER_CHIPS.map(chip => (
              <button key={chip.value} onClick={() => setEventFilter(chip.value)}
                className={cn("px-4 py-1.5 rounded-full font-body text-xs font-medium transition-all border",
                  eventFilter === chip.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                )}>
                {chip.label}
              </button>
            ))}
          </div>

          {/* Event cards 2x3 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(e => {
              const selected = eventType === e.value;
              return (
                <button key={e.value} onClick={() => setEventType(e.value)}
                  className={cn(
                    "relative flex flex-col p-5 rounded-xl border-2 transition-all text-left min-h-[200px] overflow-hidden group",
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                  )}>
                  {/* Badge top */}
                  {e.badge && e.badgePosition === "top" && (
                    <span className={cn("absolute top-3 right-3 px-2 py-0.5 rounded-full font-body text-[10px] font-semibold",
                      e.badgeStyle === "dark" ? "bg-foreground text-background" : "bg-amber-100 text-amber-800"
                    )}>{e.badge}</span>
                  )}
                  {/* Checkmark */}
                  {selected && (
                    <span className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                  )}
                  <span className="text-3xl mb-3">{e.icon}</span>
                  <span className="font-heading text-base text-foreground mb-1">{e.label}</span>
                  <span className="font-body text-xs text-muted-foreground mb-2">{e.desc}</span>
                  <span className="font-body text-xs text-primary font-semibold">{e.price}</span>
                  {e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto pt-3">
                      {e.tags.map(tag => (
                        <span key={tag.label} className={cn("px-2 py-0.5 rounded-full text-[10px] font-body font-medium", tag.color)}>{tag.label}</span>
                      ))}
                    </div>
                  )}
                  {/* Badge bottom */}
                  {e.badge && e.badgePosition === "bottom" && (
                    <span className="mt-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-body text-[10px] font-semibold self-start">{e.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 mt-8">
            <Button onClick={goNext} disabled={!canNextStep1} className="flex-1">
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2 — EVENT DETAILS ═══ */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-slide-up space-y-6">
          <h2 className="font-heading text-2xl text-foreground">Detalles del evento</h2>

          {/* Duration */}
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-3">¿Cuánto dura tu evento?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DURATION_OPTIONS.map(d => (
                <button key={d.id} onClick={() => setDuration(d.id)}
                  className={cn("p-4 rounded-xl border-2 text-left transition-all",
                    duration === d.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                  )}>
                  <p className="font-heading text-sm font-bold text-foreground">{d.label}</p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">{d.subtitle}</p>
                  <p className="font-body text-xs text-primary font-semibold mt-1">{d.priceHint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* People count */}
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-2">¿Cuántas personas?</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setPeople(p => Math.max(1, (typeof p === "number" ? p : 10) - 1))}
                className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <input type="number" value={people}
                onChange={e => { const v = e.target.value; setPeople(v === "" ? "" : Math.max(1, Number(v))); }}
                placeholder="10"
                className="w-24 h-10 text-center rounded-lg border border-input bg-card font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button onClick={() => setPeople(p => (typeof p === "number" ? p : 10) + 1)}
                className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="font-body text-xs text-muted-foreground mt-1">Berlioz entrega desde 4 personas · pedido promedio: 10-15 personas</p>

            {isSmallGroup && (
              <div className="mt-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div className="font-body text-sm text-foreground">
                    <p>📍 Para grupos de 1-4 personas te recomendamos recoger en nuestra cocina — ¡sin costo de envío!</p>
                    <p className="text-xs text-muted-foreground mt-1">Lago Onega 285, Col. Modelo Pensil, CDMX</p>
                    <a href="https://maps.google.com/?q=Lago+Onega+285+Col+Modelo+Pensil+CDMX" target="_blank" rel="noopener"
                      className="text-xs text-secondary hover:underline">Ver cómo llegar →</a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Postal Code */}
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-2">Código postal de entrega</label>
            <Input value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="Ej. 11520" maxLength={5} className="max-w-[200px]" />
            {postalCode.length === 5 && (
              <p className={cn("font-body text-xs mt-1 flex items-center gap-1",
                isInZone ? "text-emerald-600" : "text-amber-600")}>
                {isInZone ? <><CheckCircle className="w-3 h-3" /> Entregamos en tu zona</> :
                  <><AlertTriangle className="w-3 h-3" /> ⚠️ Zona no habitual — el costo de envío puede variar</>}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-2">Fecha del evento</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "w-full h-12 px-4 rounded-lg border border-input bg-card font-body text-sm text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring",
                  !date && "text-muted-foreground"
                )}>
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  {date ? format(date, "EEEE d 'de' MMMM yyyy", { locale: es }) : "Selecciona fecha"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate}
                  disabled={d => isBefore(d, tomorrow)}
                  initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {cutoffBlocked && (
              <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="font-body text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  🚫 Ya no es posible cotizar para mañana — límite 3:00pm. Elige otra fecha o escríbenos: hola@berlioz.mx · 55 8237 5469
                </p>
              </div>
            )}
          </div>

          {/* Event time */}
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-2">Horario del evento</label>
            <select value={eventTime} onChange={e => setEventTime(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Selecciona horario</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {deliveryTime && (
              <div className="mt-2">
                <p className="font-body text-sm">
                  Hora de entrega — <span className="text-primary font-semibold">{deliveryTime}</span>
                </p>
                <p className="font-body text-xs text-muted-foreground">Recomendamos 90 min de anticipación para garantizar tu entrega</p>
                {isEarlyDelivery && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="font-body text-xs text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> ⚠️ Las entregas antes de las 7:30am tienen cargo adicional de $290
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-3">¿Tienes un presupuesto por persona en mente?</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setHasBudget(true)}
                className={cn("p-4 rounded-xl border-2 text-center transition-all",
                  hasBudget === true ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                <span className="font-heading text-base">Sí</span>
                <p className="font-body text-xs text-muted-foreground mt-1">Tengo un rango en mente</p>
              </button>
              <button onClick={() => setHasBudget(false)}
                className={cn("p-4 rounded-xl border-2 text-center transition-all",
                  hasBudget === false ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                <span className="font-heading text-base">No, sorpréndeme</span>
                <p className="font-body text-xs text-muted-foreground mt-1">Berlioz recomienda</p>
              </button>
            </div>
            {hasBudget && (
              <div className="mt-4 bg-card rounded-xl border border-border p-5">
                <div className="text-center mb-4">
                  <span className="font-mono text-3xl text-primary font-bold">${budget}</span>
                  <span className="font-body text-muted-foreground text-sm ml-1">MXN / persona</span>
                </div>
                <input type="range" min={150} max={800} step={10} value={budget}
                  onChange={e => setBudget(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between font-mono text-xs text-muted-foreground mt-1"><span>$150</span><span>$800</span></div>
              </div>
            )}
          </div>

          {/* Dietary */}
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-3">¿Alguien tiene restricciones alimenticias?</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button onClick={() => { setHasDietary(true); }}
                className={cn("p-3 rounded-xl border-2 text-center transition-all text-sm",
                  hasDietary === true ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>Sí</button>
              <button onClick={() => { setHasDietary(false); setDietary([]); }}
                className={cn("p-3 rounded-xl border-2 text-center transition-all text-sm",
                  hasDietary === false ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>No</button>
            </div>
            {hasDietary && (
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(d => (
                  <button key={d.value} onClick={() => toggleDietary(d.value)}
                    className={cn("px-4 py-2 rounded-full border-2 font-body text-sm font-medium transition-all",
                      dietary.includes(d.value) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40"
                    )}>{d.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Name + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">Tu nombre</label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ej. Ana García" />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">Empresa</label>
              <Input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Ej. Acme Corp" />
            </div>
          </div>

          {/* Receive confirmation */}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={receiveConfirm} onCheckedChange={(v) => setReceiveConfirm(v === true)} className="mt-0.5" />
            <span className="font-body text-sm text-foreground">
              ✓ Sí, confirmo que habrá alguien para recibir el pedido
            </span>
          </label>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={goBack}>← Volver</Button>
            <Button onClick={goNext} disabled={!canNextStep2} className="flex-1">
              Ver propuesta <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3 — PROPOSAL ═══ */}
      {step === 2 && (
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
          onRestart={() => { setStep(0); }}
        />
      )}
    </BaseLayout>
  );
};

export default QuotePage;
