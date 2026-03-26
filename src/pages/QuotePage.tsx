import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, Loader2, Download, Share2, Bookmark, ShoppingBag } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import StepperProgress from "@/components/ui/StepperProgress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── types ── */
interface QuoteOption {
  name: string;
  tagline: string;
  items: string[];
  pricePerPerson: number;
  totalPrice: number;
  whyItFits: string;
}

/* ── constants ── */
const WIZARD_STEPS = [
  { label: "Tipo de evento" },
  { label: "Personas y fecha" },
  { label: "Restricciones" },
  { label: "Presupuesto" },
  { label: "Tu propuesta" },
];

const EVENT_TYPES = [
  { value: "junta", label: "Junta ejecutiva", icon: "💼" },
  { value: "desayuno", label: "Desayuno de trabajo", icon: "🍳" },
  { value: "coffee_am", label: "Coffee Break AM", icon: "☕" },
  { value: "coffee_pm", label: "Coffee Break PM", icon: "🍪" },
  { value: "comida", label: "Comida de equipo", icon: "🍱" },
  { value: "evento_especial", label: "Evento especial", icon: "🎉" },
];

const TIME_SLOTS = [
  { value: "7:30-9:00", label: "7:30–9:00" },
  { value: "10:00-11:30", label: "10:00–11:30" },
  { value: "12:00-13:30", label: "12:00–13:30" },
  { value: "15:00-17:00", label: "15:00–17:00" },
];

const DIETARY_OPTIONS = [
  { value: "vegano", label: "Vegano" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "sin_gluten", label: "Sin gluten" },
  { value: "sin_lactosa", label: "Sin lactosa" },
  { value: "halal", label: "Halal" },
  { value: "ninguna", label: "Ninguna" },
];

/* ── component ── */
const QuotePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState("");
  const [people, setPeople] = useState(10);
  const [date, setDate] = useState<Date | undefined>();
  const [timeSlot, setTimeSlot] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [budget, setBudget] = useState(300);
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tomorrow = addDays(new Date(), 1);

  // Read URL params on mount
  useEffect(() => {
    const ev = searchParams.get("event");
    const ppl = searchParams.get("people");
    const dt = searchParams.get("date");
    let startStep = 0;

    if (ev) { setEventType(ev); startStep = 1; }
    if (ppl) { setPeople(Math.max(10, Number(ppl))); }
    if (dt) {
      const parsed = new Date(dt + "T12:00:00");
      if (!isNaN(parsed.getTime())) setDate(parsed);
    }
    if (ev && ppl && dt) startStep = 2;
    else if (ev) startStep = 1;

    setStep(startStep);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step validation
  const canNext = useMemo(() => {
    switch (step) {
      case 0: return eventType !== "";
      case 1: return people >= 10 && !!date && timeSlot !== "";
      case 2: return dietary.length > 0;
      case 3: return budget >= 150;
      default: return false;
    }
  }, [step, eventType, people, date, timeSlot, dietary, budget]);

  const toggleDietary = (val: string) => {
    if (val === "ninguna") { setDietary(["ninguna"]); return; }
    setDietary((prev) => {
      const next = prev.filter((d) => d !== "ninguna");
      return next.includes(val) ? next.filter((d) => d !== val) : [...next, val];
    });
  };

  // Call AI edge function
  const generateQuote = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("get-quote", {
        body: {
          eventType,
          peopleCount: people,
          date: date ? format(date, "yyyy-MM-dd") : "",
          timeSlot,
          dietaryRestrictions: dietary.filter((d) => d !== "ninguna"),
          budgetPerPerson: budget,
        },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      const parsed = Array.isArray(data) ? data : JSON.parse(data);
      setOptions(parsed);
    } catch (e: any) {
      console.error("Quote error:", e);
      setError(e?.message ?? "Error generando propuesta");
    } finally {
      setLoading(false);
    }
  }, [eventType, people, date, timeSlot, dietary, budget]);

  const goNext = () => {
    if (step < 4) {
      const next = step + 1;
      setStep(next);
      if (next === 4) generateQuote();
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
  };

  const handleConfirmOrder = () => {
    if (selectedIdx === null) return;
    const opt = options[selectedIdx];
    opt.items.forEach((itemName, i) => {
      addItem({
        id: `quote-${eventType}-${i}`,
        name: itemName,
        price: opt.pricePerPerson / opt.items.length,
        quantity: people,
      });
    });
    navigate("/checkout");
  };

  const handleShareWhatsApp = () => {
    if (selectedIdx === null) return;
    const opt = options[selectedIdx];
    const text = `🍱 Cotización Berlioz\n\n${opt.name}\n${opt.items.join("\n")}\n\n${people} personas\nTotal: $${opt.totalPrice.toLocaleString()} MXN\n\nCotiza en berlioz.mx/cotizar`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSaveQuote = async () => {
    if (!user) { toast.info("Inicia sesión para guardar tu cotización"); navigate("/login?returnUrl=/cotizar"); return; }
    toast.success("Cotización guardada (funcionalidad próximamente)");
  };

  return (
    <BaseLayout hideFooter>
      <StepperProgress steps={WIZARD_STEPS} currentStep={step} />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* ═══ STEP 0 — EVENT TYPE ═══ */}
        {step === 0 && (
          <div className="animate-slide-up">
            <h2 className="font-heading text-2xl text-foreground mb-6">¿Qué tipo de evento es?</h2>
            <div className="grid grid-cols-2 gap-4">
              {EVENT_TYPES.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEventType(e.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-5 rounded-lg border-2 transition-all text-center",
                    eventType === e.value
                      ? "border-primary bg-blue-light ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className="text-3xl">{e.icon}</span>
                  <span className="font-body font-semibold text-sm text-foreground">{e.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 1 — PEOPLE + DATE ═══ */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6">
            <h2 className="font-heading text-2xl text-foreground mb-2">¿Cuántas personas y cuándo?</h2>

            {/* People */}
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">Número de personas</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeople((p) => Math.max(10, p - 5))}
                  className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={people}
                  onChange={(e) => setPeople(Math.max(10, Number(e.target.value) || 10))}
                  className="w-24 h-10 text-center rounded-lg border border-input bg-card font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setPeople((p) => p + 5)}
                  className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-1">Mínimo 10 personas</p>
            </div>

            {/* Date */}
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">Fecha del evento</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full h-12 px-4 rounded-lg border border-input bg-card font-body text-sm text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    {date ? format(date, "EEEE d 'de' MMMM yyyy", { locale: es }) : "Selecciona fecha"}
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

            {/* Time slot */}
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">Horario de entrega</label>
              <div className="grid grid-cols-2 gap-3">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTimeSlot(t.value)}
                    className={cn(
                      "py-3 rounded-lg border-2 font-body text-sm font-medium transition-all",
                      timeSlot === t.value
                        ? "border-primary bg-blue-light text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — DIETARY ═══ */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="font-heading text-2xl text-foreground mb-6">¿Hay restricciones alimenticias?</h2>
            <div className="flex flex-wrap gap-3">
              {DIETARY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => toggleDietary(d.value)}
                  className={cn(
                    "px-5 py-2.5 rounded-full border-2 font-body text-sm font-medium transition-all",
                    dietary.includes(d.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — BUDGET ═══ */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="font-heading text-2xl text-foreground mb-6">¿Cuál es tu presupuesto por persona?</h2>
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="text-center mb-6">
                <span className="font-mono text-4xl text-primary font-bold">${budget}</span>
                <span className="font-body text-muted-foreground text-sm ml-1">MXN / persona</span>
              </div>
              <input
                type="range"
                min={150}
                max={800}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between font-mono text-xs text-muted-foreground mt-2">
                <span>$150</span>
                <span>$800</span>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-blue-light text-center">
                <p className="font-body text-sm text-foreground">
                  Estimado para {people} personas: <strong className="text-primary">${(budget * people).toLocaleString()} MXN</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4 — RESULTS ═══ */}
        {step === 4 && (
          <div className="animate-slide-up">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-primary animate-pulse-soft"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    />
                  ))}
                </div>
                <p className="font-body text-muted-foreground">ANA está preparando tu propuesta...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="font-body text-destructive mb-4">{error}</p>
                <button onClick={generateQuote} className="font-body text-sm text-primary hover:underline">
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && options.length > 0 && (
              <>
                <h2 className="font-heading text-2xl text-foreground mb-6 text-center">Tu propuesta personalizada</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {options.map((opt, idx) => {
                    const isMiddle = idx === 1;
                    const isSelected = selectedIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "relative bg-card rounded-lg border-2 p-5 transition-all cursor-pointer",
                          isMiddle && !isSelected && "border-primary shadow-md",
                          isSelected && "border-primary bg-blue-light ring-2 ring-primary/20",
                          !isMiddle && !isSelected && "border-border hover:border-primary/40"
                        )}
                        onClick={() => handleSelect(idx)}
                      >
                        {isMiddle && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground font-body text-xs font-semibold">
                            Más popular
                          </span>
                        )}
                        <h3 className="font-body font-bold text-foreground text-base mb-1">{opt.name}</h3>
                        <p className="font-body text-xs text-muted-foreground italic mb-3">{opt.tagline}</p>
                        <ul className="space-y-1 mb-4">
                          {opt.items.map((item, i) => (
                            <li key={i} className="font-body text-sm text-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span> {item}
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-border pt-3">
                          <p className="font-mono text-xl text-primary font-bold">${opt.pricePerPerson}/persona</p>
                          <p className="font-body text-xs text-muted-foreground">Total: ${opt.totalPrice.toLocaleString()} MXN</p>
                        </div>
                        <p className="font-body text-xs text-muted-foreground mt-3 leading-relaxed">{opt.whyItFits}</p>
                        <button
                          className={cn(
                            "w-full mt-4 py-2.5 rounded-lg font-body text-sm font-semibold transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-primary/10"
                          )}
                        >
                          {isSelected ? "✓ Seleccionado" : "Este me gusta"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Post-selection actions */}
                {selectedIdx !== null && (
                  <div className="mt-8 flex flex-wrap gap-3 justify-center animate-slide-up">
                    <button
                      onClick={handleConfirmOrder}
                      className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" /> Confirmar y hacer pedido
                    </button>
                    <button
                      onClick={handleSaveQuote}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border bg-card text-foreground font-body text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Bookmark className="w-4 h-4" /> Guardar cotización
                    </button>
                    <button
                      onClick={() => toast.info("Exportar PDF próximamente")}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border bg-card text-foreground font-body text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                    <button
                      onClick={handleShareWhatsApp}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border bg-card text-foreground font-body text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> WhatsApp
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ Navigation ═══ */}
        {step < 4 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={goBack}
                className="px-5 py-3 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors"
              >
                ← Volver
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canNext}
              className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Generar propuesta →" : "Continuar →"}
            </button>
          </div>
        )}

        {step === 4 && !loading && options.length > 0 && (
          <div className="mt-6 text-center">
            <button onClick={() => setStep(0)} className="font-body text-sm text-primary hover:underline">
              ← Empezar nueva cotización
            </button>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default QuotePage;
