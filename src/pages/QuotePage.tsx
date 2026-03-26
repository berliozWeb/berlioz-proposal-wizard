import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, addDays, isBefore, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, Loader2, Download, Share2, Bookmark, ShoppingBag, MapPin, AlertTriangle, CheckCircle, Info } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";
import StepperProgress from "@/components/ui/StepperProgress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TOP_DELIVERY_ZONES, QUOTE_FOOTER_NOTES, BASE_SHIPPING_COST } from "@/domain/entities/BerliozCatalog";
import { formatMXN } from "@/domain/value-objects/Money";
import jsPDF from "jspdf";
import "jspdf-autotable";

/* ── types ── */
interface QuoteItem {
  product: string;
  qty_per_person: number;
  unit_price: number;
  notes?: string;
}
interface QuoteOption {
  name: string;
  tagline: string;
  occasion_fit: string;
  items: QuoteItem[];
  price_per_person: number;
  total_price: number;
  includes_drink: boolean;
  dietary_tags: string[];
  is_recommended: boolean;
}

/* ── constants ── */
const WIZARD_STEPS = [
  { label: "Tipo de evento" },
  { label: "Detalles" },
  { label: "Presupuesto" },
  { label: "Tu propuesta" },
];

const EVENT_TYPES = [
  { value: "desayuno", label: "Desayuno", badge: "Perfecto para morning meetings", desc: "Desde 4 personas · 7am en adelante", price: "Desde $170/persona", icon: "🍳", tags: ["vegetariano", "vegano", "sin-gluten"] },
  { value: "coffee-break", label: "Coffee Break", badge: "Ideal para juntas", desc: "Desde 4 personas · mañana o tarde", price: "Desde $240/persona", icon: "☕", tags: ["vegetariano"] },
  { value: "working-lunch", label: "Working Lunch", badge: "⭐ El más pedido", desc: "El producto estrella de Berlioz", price: "Desde $150/persona", icon: "🍱", tags: ["vegano", "vegetariano", "sin-gluten", "keto"] },
  { value: "capacitacion", label: "Capacitación", badge: "", desc: "Servicio completo de día", price: "Paquete de día completo", icon: "📋", tags: ["vegetariano", "vegano"] },
  { value: "reunion-ejecutiva", label: "Reunión ejecutiva", badge: "", desc: "Para grupos pequeños y VIP", price: "Según selección", icon: "💼", tags: [] },
  { value: "filmacion", label: "Filmación", badge: "💡 Económico y portable", desc: "Bags y opciones portables", price: "Según selección", icon: "🎬", tags: [] },
];

const FILTER_CHIPS = [
  { value: "todos", label: "Todos" },
  { value: "vegano", label: "Con opciones veganas" },
  { value: "sin-gluten", label: "Sin gluten" },
  { value: "economico", label: "Menos de $200/persona" },
  { value: "pequeno", label: "Grupos pequeños (<10)" },
];

const DIETARY_OPTIONS = [
  { value: "vegano", label: "Vegano" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "sin_gluten", label: "Sin gluten" },
  { value: "sin_lactosa", label: "Sin lactosa" },
  { value: "halal", label: "Halal" },
  { value: "ninguna", label: "Ninguna" },
];

// Generate 30-min time slots from 05:00 to 21:00
const TIME_SLOTS_30MIN = Array.from({ length: 33 }, (_, i) => {
  const h = Math.floor(i / 2) + 5;
  const m = (i % 2) * 30;
  const label = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  return { value: label, label };
});

function calculateDeliveryTime(eventTime: string): string {
  const [h, m] = eventTime.split(":").map(Number);
  let totalMinutes = h * 60 + m - 90;
  if (totalMinutes < 0) totalMinutes = 0;
  const dh = Math.floor(totalMinutes / 60);
  const dm = totalMinutes % 60;
  return `${dh.toString().padStart(2, "0")}:${dm.toString().padStart(2, "0")}`;
}

function isCutoffBlocked(selectedDate: Date | undefined): boolean {
  if (!selectedDate) return false;
  const now = new Date();
  const tomorrow = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  const selDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  if (selDay.getTime() === tomorrow.getTime() && now.getHours() >= 15) return true;
  return false;
}

/* ── component ── */
const QuotePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState("");
  const [eventFilter, setEventFilter] = useState("todos");
  const [people, setPeople] = useState<number | "">(10);
  const [postalCode, setPostalCode] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [hasBudget, setHasBudget] = useState<boolean | null>(null);
  const [budget, setBudget] = useState(300);
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receiveConfirm, setReceiveConfirm] = useState(false);

  const tomorrow = addDays(new Date(), 1);
  const deliveryTime = eventTime ? calculateDeliveryTime(eventTime) : "";
  const isEarlyDelivery = deliveryTime && parseInt(deliveryTime.split(":")[0]) < 7 || (deliveryTime === "07:00" && parseInt(deliveryTime.split(":")[1]) < 30);
  const cutoffBlocked = isCutoffBlocked(date);
  const isInZone = postalCode.length === 5 && TOP_DELIVERY_ZONES.some((z) => postalCode.startsWith(z.slice(0, 3)));
  const isSmallGroup = typeof people === "number" && people >= 1 && people <= 3;
  const numPeople = typeof people === "number" ? people : 0;

  // URL params
  useEffect(() => {
    const ev = searchParams.get("event");
    const ppl = searchParams.get("people");
    const dt = searchParams.get("date");
    let startStep = 0;
    if (ev) { setEventType(ev); startStep = 1; }
    if (ppl) { setPeople(Math.max(1, Number(ppl))); }
    if (dt) { const parsed = new Date(dt + "T12:00:00"); if (!isNaN(parsed.getTime())) setDate(parsed); }
    if (ev && ppl && dt) startStep = 1;
    setStep(startStep);
  }, []); // eslint-disable-line

  const filteredEvents = useMemo(() => {
    if (eventFilter === "todos") return EVENT_TYPES;
    if (eventFilter === "economico") return EVENT_TYPES.filter((e) => ["working-lunch", "desayuno"].includes(e.value));
    if (eventFilter === "pequeno") return EVENT_TYPES.filter((e) => ["reunion-ejecutiva", "coffee-break"].includes(e.value));
    return EVENT_TYPES.filter((e) => e.tags.includes(eventFilter));
  }, [eventFilter]);

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return eventType !== "";
      case 1: return numPeople >= 1 && !!date && eventTime !== "" && !cutoffBlocked && receiveConfirm;
      case 2: return hasBudget !== null;
      default: return false;
    }
  }, [step, eventType, numPeople, date, eventTime, cutoffBlocked, receiveConfirm, hasBudget]);

  const toggleDietary = (val: string) => {
    if (val === "ninguna") { setDietary(["ninguna"]); return; }
    setDietary((prev) => {
      const next = prev.filter((d) => d !== "ninguna");
      return next.includes(val) ? next.filter((d) => d !== val) : [...next, val];
    });
  };

  const generateQuote = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("get-quote", {
        body: {
          eventType,
          peopleCount: numPeople,
          date: date ? format(date, "yyyy-MM-dd") : "",
          timeSlot: eventTime,
          eventTime,
          deliveryTime,
          dietaryRestrictions: dietary.filter((d) => d !== "ninguna"),
          budgetPerPerson: hasBudget ? budget : null,
          hasBudget,
          postalCode,
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
  }, [eventType, numPeople, date, eventTime, deliveryTime, dietary, budget, hasBudget, postalCode]);

  const goNext = () => {
    if (step < 3) {
      const next = step + 1;
      setStep(next);
      if (next === 3) generateQuote();
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleConfirmOrder = () => {
    if (selectedIdx === null) return;
    const opt = options[selectedIdx];
    opt.items.forEach((item, i) => {
      addItem({
        id: `quote-${eventType}-${i}`,
        name: item.product,
        price: item.unit_price,
        quantity: item.qty_per_person * numPeople,
      });
    });
    navigate("/checkout");
  };

  const handleShareWhatsApp = () => {
    if (selectedIdx === null) return;
    const opt = options[selectedIdx];
    const text = `Hola! Te comparto la cotización de Berlioz para nuestro evento: ${EVENT_TYPES.find((e) => e.value === eventType)?.label ?? eventType} para ${numPeople} personas el ${date ? format(date, "d/MM/yyyy") : ""}.\n\nPropuesta: ${opt.name} — ${formatMXN(opt.price_per_person)}/persona\nTotal: ${formatMXN(opt.total_price)}\n\n¿Lo revisamos? berlioz.mx`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSaveQuote = async () => {
    if (!user) { toast.info("Inicia sesión para guardar tu cotización"); navigate("/login?returnUrl=/cotizar"); return; }
    if (selectedIdx === null) return;
    const opt = options[selectedIdx];
    await supabase.from("quotes").insert({
      user_id: user.id,
      event_type: eventType,
      people_count: numPeople,
      event_date: date ? format(date, "yyyy-MM-dd") : null,
      time_slot: eventTime,
      dietary_restrictions: dietary,
      budget_per_person: hasBudget ? budget : null,
      ai_options: options as any,
      selected_option_index: selectedIdx,
      total_estimated: opt.total_price,
      status: "draft",
    });
    toast.success("Cotización guardada");
  };

  const handleExportPDF = () => {
    if (selectedIdx === null) return;
    const opt = options[selectedIdx];
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 61, 91); // #003D5B
    doc.text("BERLIOZ", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Cotización de Catering Corporativo", 14, 27);

    // Client info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let y = 40;
    doc.text(`Evento: ${EVENT_TYPES.find((e) => e.value === eventType)?.label ?? eventType}`, 14, y);
    doc.text(`Fecha: ${date ? format(date, "d/MM/yyyy") : "—"}`, 14, y + 6);
    doc.text(`Hora de entrega: ${deliveryTime || "—"}`, 14, y + 12);
    doc.text(`Personas: ${numPeople}`, 14, y + 18);
    doc.text(`Propuesta: ${opt.name}`, 120, y);
    doc.text(`Fecha de cotización: ${format(new Date(), "d/MM/yyyy")}`, 120, y + 6);

    // Product table
    const tableData = opt.items.map((item) => [
      item.product,
      formatMXN(item.unit_price),
      `${item.qty_per_person * numPeople}`,
      formatMXN(item.unit_price * item.qty_per_person * numPeople),
    ]);

    (doc as any).autoTable({
      startY: y + 28,
      head: [["Descripción", "Precio Unitario", "Cantidad", "Subtotal"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [0, 61, 91], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const subtotal = opt.total_price / 1.16;
    const iva = opt.total_price - subtotal;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${formatMXN(subtotal)}`, 130, finalY);
    doc.text(`IVA (16%): ${formatMXN(iva)}`, 130, finalY + 6);
    doc.text(`Envío: ${formatMXN(BASE_SHIPPING_COST)}`, 130, finalY + 12);
    doc.setFontSize(12);
    doc.setTextColor(0, 61, 91);
    doc.text(`Total: ${formatMXN(opt.total_price + BASE_SHIPPING_COST)}`, 130, finalY + 20);

    // Footer notes
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    let noteY = finalY + 35;
    QUOTE_FOOTER_NOTES.forEach((note) => {
      doc.text(`* ${note}`, 14, noteY);
      noteY += 4;
    });

    // Contact
    noteY += 4;
    doc.setFontSize(8);
    doc.setTextColor(0, 61, 91);
    doc.text("Anne Seguy | hola@berlioz.mx | 55 8237 5469", 14, noteY);

    doc.save(`Berlioz-Cotizacion-${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("PDF descargado");
  };

  return (
    <BaseLayout hideFooter>
      <StepperProgress steps={WIZARD_STEPS} currentStep={step} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* ═══ STEP 0 — EVENT TYPE ═══ */}
        {step === 0 && (
          <div className="animate-slide-up">
            <h2 className="font-heading text-2xl text-foreground mb-2">¿Qué tipo de evento es?</h2>
            <p className="font-body text-sm text-muted-foreground mb-4">Selecciona el tipo de momento</p>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setEventFilter(chip.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full font-body text-xs font-medium transition-all border",
                    eventFilter === chip.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Event cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEventType(e.value)}
                  className={cn(
                    "relative flex flex-col p-5 rounded-xl border-2 transition-all text-left min-h-[180px] overflow-hidden",
                    eventType === e.value
                      ? "border-primary bg-blue-light ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                  )}
                >
                  {e.badge && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body text-[10px] font-semibold">
                      {e.badge}
                    </span>
                  )}
                  <span className="text-3xl mb-3">{e.icon}</span>
                  <span className="font-heading text-base text-foreground mb-1">{e.label}</span>
                  <span className="font-body text-xs text-muted-foreground mb-2">{e.desc}</span>
                  <span className="font-body text-xs text-primary font-semibold">{e.price}</span>
                  {e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {e.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-body">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Dietary restrictions inline */}
            <div className="mt-8">
              <p className="font-body text-sm font-medium text-foreground mb-3">¿Restricciones alimenticias?</p>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => toggleDietary(d.value)}
                    className={cn(
                      "px-4 py-2 rounded-full border-2 font-body text-sm font-medium transition-all",
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
          </div>
        )}

        {/* ═══ STEP 1 — PEOPLE + DATE + TIME + CP ═══ */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6">
            <h2 className="font-heading text-2xl text-foreground">Detalles del evento</h2>

            {/* People count */}
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-2">¿Cuántas personas?</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setPeople((p) => Math.max(1, (typeof p === "number" ? p : 10) - 1))}
                  className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <input type="number" value={people}
                  onChange={(e) => { const v = e.target.value; setPeople(v === "" ? "" : Math.max(1, Number(v))); }}
                  placeholder="Ej. 15"
                  className="w-24 h-10 text-center rounded-lg border border-input bg-card font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button onClick={() => setPeople((p) => (typeof p === "number" ? p : 10) + 1)}
                  className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-1">Berlioz entrega desde 4 personas · pedido promedio: 10-15 personas</p>

              {/* Small group pickup recommendation */}
              {isSmallGroup && (
                <div className="mt-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div className="font-body text-sm text-foreground">
                      <p>Para grupos de 1-4 personas te recomendamos recoger tu pedido en nuestra cocina — ¡y sin costo de envío!</p>
                      <p className="text-xs text-muted-foreground mt-1">📍 Lago Onega 285, Col. Modelo Pensil, CDMX</p>
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
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="Ej. 11520" maxLength={5} className="max-w-[200px]" />
              {postalCode.length === 5 && (
                <p className={cn("font-body text-xs mt-1 flex items-center gap-1",
                  isInZone ? "text-success" : "text-muted-foreground")}>
                  {isInZone ? <><CheckCircle className="w-3 h-3" /> Entregamos en tu zona</> :
                    <><Info className="w-3 h-3" /> Verificaremos la cobertura para tu zona</>}
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
                    disabled={(d) => isBefore(d, tomorrow) || isWeekend(d)}
                    initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>

              {/* Cutoff warning */}
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
              <select value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-input bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecciona horario</option>
                {TIME_SLOTS_30MIN.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {/* Delivery time auto-calculated */}
              {deliveryTime && (
                <div className="mt-2">
                  <p className="font-body text-sm">
                    Hora de entrega — <span className="text-accent font-semibold">{deliveryTime}</span>
                  </p>
                  <p className="font-body text-xs text-muted-foreground">Recomendamos 90 min de anticipación para garantizar tu entrega</p>

                  {/* Early delivery surcharge */}
                  {isEarlyDelivery && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="font-body text-xs text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        ⚠️ Las entregas antes de las 7:30am tienen cargo adicional de $290
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Receive confirmation checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={receiveConfirm} onChange={(e) => setReceiveConfirm(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border accent-primary" />
              <span className="font-body text-sm text-foreground">
                ✓ Sí, confirmo que habrá alguien para recibir el pedido
              </span>
            </label>
          </div>
        )}

        {/* ═══ STEP 2 — BUDGET ═══ */}
        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <h2 className="font-heading text-2xl text-foreground">¿Tienes un presupuesto por persona en mente?</h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setHasBudget(true)}
                className={cn(
                  "p-6 rounded-xl border-2 text-center transition-all",
                  hasBudget === true ? "border-primary bg-blue-light" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="font-heading text-lg">Sí</span>
                <p className="font-body text-xs text-muted-foreground mt-1">Tengo un rango en mente</p>
              </button>
              <button
                onClick={() => setHasBudget(false)}
                className={cn(
                  "p-6 rounded-xl border-2 text-center transition-all",
                  hasBudget === false ? "border-primary bg-blue-light" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="font-heading text-lg">No, sorpréndeme</span>
                <p className="font-body text-xs text-muted-foreground mt-1">Berlioz recomienda</p>
              </button>
            </div>

            {hasBudget && (
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="text-center mb-6">
                  <span className="font-mono text-4xl text-primary font-bold">${budget}</span>
                  <span className="font-body text-muted-foreground text-sm ml-1">MXN / persona</span>
                </div>
                <input type="range" min={150} max={800} step={10} value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between font-mono text-xs text-muted-foreground mt-2">
                  <span>$150</span><span>$800</span>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-light text-center">
                  <p className="font-body text-sm text-foreground">
                    Estimado para {numPeople} personas: <strong className="text-primary">{formatMXN(budget * numPeople)}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3 — RESULTS ═══ */}
        {step === 3 && (
          <div className="animate-slide-up">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="font-body text-foreground font-medium">Preparando tu propuesta personalizada...</p>
                <p className="font-body text-sm text-muted-foreground">
                  Analizando el mejor menú para tu {EVENT_TYPES.find((e) => e.value === eventType)?.label ?? "evento"} de {numPeople} personas
                </p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="font-body text-destructive mb-4">{error}</p>
                <Button onClick={generateQuote} variant="outline">Reintentar</Button>
              </div>
            )}

            {!loading && !error && options.length > 0 && (
              <>
                <h2 className="font-heading text-2xl text-foreground mb-6 text-center">Tu propuesta personalizada</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {options.map((opt, idx) => {
                    const isRec = opt.is_recommended || idx === 1;
                    const isSel = selectedIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "relative bg-card rounded-xl border-2 p-5 transition-all cursor-pointer",
                          isRec && !isSel && "border-primary shadow-lg",
                          isSel && "border-primary bg-blue-light ring-2 ring-primary/20",
                          !isRec && !isSel && "border-border hover:border-primary/40"
                        )}
                        onClick={() => setSelectedIdx(idx)}
                      >
                        {isRec && (
                          <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground font-body text-xs font-semibold">
                            Recomendado
                          </span>
                        )}

                        <h3 className="font-heading text-base text-foreground mb-1">{opt.name}</h3>
                        <p className="font-body text-xs text-muted-foreground italic mb-2">{opt.tagline}</p>

                        {opt.occasion_fit && (
                          <p className="font-body text-xs text-secondary mb-3 leading-relaxed">
                            <strong>Por qué es ideal:</strong> {opt.occasion_fit}
                          </p>
                        )}

                        <ul className="space-y-1 mb-4">
                          {opt.items.map((item, i) => (
                            <li key={i} className="font-body text-sm text-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              {item.qty_per_person}× {item.product} — {formatMXN(item.unit_price)}
                            </li>
                          ))}
                        </ul>

                        {opt.dietary_tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {opt.dietary_tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-body">{tag}</span>
                            ))}
                          </div>
                        )}

                        <div className="border-t border-border pt-3">
                          <p className="font-mono text-xl text-primary font-bold">{formatMXN(opt.price_per_person)}/persona</p>
                          <p className="font-body text-xs text-muted-foreground">
                            Total para {numPeople} personas: {formatMXN(opt.total_price)}
                          </p>
                          <p className="font-body text-[10px] text-muted-foreground italic mt-1">+ I.V.A. · Precios no incluyen envío</p>
                        </div>

                        <button className={cn(
                          "w-full mt-4 py-2.5 rounded-lg font-body text-sm font-semibold transition-all",
                          isSel ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-primary/10"
                        )}>
                          {isSel ? "✓ Seleccionado" : "Elegir esta propuesta"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Post-selection actions */}
                {selectedIdx !== null && (
                  <div className="mt-8 flex flex-wrap gap-3 justify-center animate-slide-up">
                    <Button onClick={handleConfirmOrder} className="gap-2">
                      <ShoppingBag className="w-4 h-4" /> Confirmar y hacer pedido
                    </Button>
                    <Button variant="outline" onClick={handleSaveQuote} className="gap-2">
                      <Bookmark className="w-4 h-4" /> Guardar cotización
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                      <Download className="w-4 h-4" /> Exportar PDF
                    </Button>
                    <Button variant="outline" onClick={handleShareWhatsApp} className="gap-2">
                      <Share2 className="w-4 h-4" /> WhatsApp
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ Navigation ═══ */}
        {step < 3 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={goBack}>← Volver</Button>
            )}
            <Button onClick={goNext} disabled={!canNext} className="flex-1">
              {step === 2 ? "Generar propuesta →" : "Continuar →"}
            </Button>
          </div>
        )}

        {step === 3 && !loading && options.length > 0 && (
          <div className="mt-6 text-center">
            <button onClick={() => { setStep(0); setOptions([]); setSelectedIdx(null); }}
              className="font-body text-sm text-primary hover:underline">
              ← Empezar nueva cotización
            </button>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default QuotePage;
