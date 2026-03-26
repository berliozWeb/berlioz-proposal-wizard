import { useState, useMemo, useCallback } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Minus, Plus, Trash2, ArrowUpDown, Search, X, Download, Mail, Share2, ShoppingBag, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatMXN } from "@/domain/value-objects/Money";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  CATALOG, findProduct, SIDEBAR_CATEGORIES, getDefaultItems,
  QUOTE_ADDONS, BASE_SHIPPING_COST, EARLY_DELIVERY_SURCHARGE, IVA_RATE,
  QUOTE_FOOTER_NOTES, QUOTE_VALIDITY_DAYS, generateQuoteId,
  type PackageTier, type CatalogProduct,
} from "@/domain/entities/BerliozCatalog";

/* ═══ TYPES ═══ */
interface ProposalItem {
  instanceId: string;
  productName: string;
  unitPrice: number;
  qty: number;
  isBestseller?: boolean;
  category: string;
}

interface PackageState {
  items: ProposalItem[];
}

interface ProposalStepProps {
  eventType: string;
  eventLabel: string;
  people: number;
  date: Date | undefined;
  eventTime: string;
  deliveryTime: string;
  isEarlyDelivery: boolean;
  postalCode: string;
  clientName: string;
  empresa: string;
  duration: string;
  onBack: () => void;
  onRestart: () => void;
}

type TierInfo = { id: PackageTier; title: string; subtitle: string; tip?: string; bullets: string[]; isPopular: boolean; ctaStyle: 'outline' | 'primary' };

const TIERS: TierInfo[] = [
  {
    id: "esencial", title: "Esencial", subtitle: "Lo necesario, bien ejecutado",
    tip: "💡 El 85% de nuestros clientes agrega bebidas a este pedido",
    bullets: ["Entrega puntual garantizada", "Precio base sin bebidas", "Ideal para eventos recurrentes"],
    isPopular: false, ctaStyle: "outline",
  },
  {
    id: "equilibrado", title: "Equilibrado", subtitle: "La experiencia que tu equipo merece",
    bullets: ["Café/Té Berlioz + agua incluidos", "Variedad premium", "Presentación profesional"],
    isPopular: true, ctaStyle: "primary",
  },
  {
    id: "experiencia", title: "Experiencia Completa", subtitle: "Cada detalle cuenta",
    bullets: ["Café/Té + aguas premium", "Productos gourmet top-tier", "Surtidos y postres premium"],
    isPopular: false, ctaStyle: "outline",
  },
];

let _iid = 0;
function nextId() { return `pi-${++_iid}-${Date.now()}`; }

function buildDefaultPackage(tier: PackageTier, eventType: string, people: number): PackageState {
  const defaults = getDefaultItems(eventType)[tier];
  const items: ProposalItem[] = [];
  for (const d of defaults) {
    const product = findProduct(d.productName);
    if (!product) continue;
    items.push({
      instanceId: nextId(),
      productName: product.name,
      unitPrice: product.price,
      qty: d.qtyMultiplier === 'N' ? people : d.qtyMultiplier,
      isBestseller: product.isBestseller,
      category: product.sidebarCategory,
    });
  }
  return { items };
}

function calcTotals(items: ProposalItem[], isEarly: boolean) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const shipping = BASE_SHIPPING_COST;
  const early = isEarly ? EARLY_DELIVERY_SURCHARGE : 0;
  const base = subtotal + shipping + early;
  const iva = Math.round(base * IVA_RATE * 100) / 100;
  const total = Math.round((base + iva) * 100) / 100;
  return { subtotal, shipping, early, iva, total };
}

/* ═══ COMPONENT ═══ */
export default function ProposalStep(props: ProposalStepProps) {
  const { eventType, eventLabel, people, date, eventTime, deliveryTime, isEarlyDelivery, postalCode, clientName, empresa, duration, onBack, onRestart } = props;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();

  const [quoteId] = useState(() => generateQuoteId());
  const validUntil = useMemo(() => addDays(new Date(), QUOTE_VALIDITY_DAYS), []);

  // Package states
  const [packages, setPackages] = useState<Record<PackageTier, PackageState>>(() => ({
    esencial: buildDefaultPackage("esencial", eventType, people),
    equilibrado: buildDefaultPackage("equilibrado", eventType, people),
    experiencia: buildDefaultPackage("experiencia", eventType, people),
  }));

  // UI state
  const [openSections, setOpenSections] = useState<Record<PackageTier, boolean>>({ esencial: false, equilibrado: true, experiencia: false });
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTarget, setSidebarTarget] = useState<PackageTier>("esencial");
  const [sidebarCategory, setSidebarCategory] = useState(SIDEBAR_CATEGORIES[0]);
  const [swapTarget, setSwapTarget] = useState<{ tier: PackageTier; instanceId: string } | null>(null);
  const [selectedTier, setSelectedTier] = useState<PackageTier | null>(null);

  // Helpers
  const toggleSection = (tier: PackageTier) => setOpenSections(p => ({ ...p, [tier]: !p[tier] }));

  const updateItemQty = useCallback((tier: PackageTier, instanceId: string, delta: number) => {
    setPackages(prev => ({
      ...prev,
      [tier]: {
        items: prev[tier].items.map(i =>
          i.instanceId === instanceId ? { ...i, qty: Math.max(1, i.qty + delta) } : i
        ),
      },
    }));
  }, []);

  const removeItem = useCallback((tier: PackageTier, instanceId: string) => {
    setPackages(prev => ({
      ...prev,
      [tier]: { items: prev[tier].items.filter(i => i.instanceId !== instanceId) },
    }));
  }, []);

  const addProductToTier = useCallback((tier: PackageTier, product: CatalogProduct) => {
    const newItem: ProposalItem = {
      instanceId: nextId(),
      productName: product.name,
      unitPrice: product.price,
      qty: product.isPerPerson ? people : 1,
      isBestseller: product.isBestseller,
      category: product.sidebarCategory,
    };
    setPackages(prev => ({
      ...prev,
      [tier]: { items: [...prev[tier].items, newItem] },
    }));
    toast.success(`✓ ${product.name} agregado`);
  }, [people]);

  const swapItem = useCallback((tier: PackageTier, instanceId: string, product: CatalogProduct) => {
    setPackages(prev => ({
      ...prev,
      [tier]: {
        items: prev[tier].items.map(i =>
          i.instanceId === instanceId ? {
            ...i,
            productName: product.name,
            unitPrice: product.price,
            isBestseller: product.isBestseller,
            category: product.sidebarCategory,
          } : i
        ),
      },
    }));
    setSwapTarget(null);
    setSidebarOpen(false);
    toast.success(`Cambiado a ${product.name}`);
  }, []);

  // Compute totals
  const tierTotals = useMemo(() => {
    const result: Record<PackageTier, ReturnType<typeof calcTotals>> = {} as any;
    for (const tier of ["esencial", "equilibrado", "experiencia"] as PackageTier[]) {
      result[tier] = calcTotals(packages[tier].items, isEarlyDelivery);
    }
    return result;
  }, [packages, isEarlyDelivery]);

  // Comparison
  const diffEQ = tierTotals.equilibrado.total - tierTotals.esencial.total;
  const diffEX = tierTotals.experiencia.total - tierTotals.equilibrado.total;
  const pctEQ = tierTotals.esencial.total > 0 ? Math.round((diffEQ / tierTotals.esencial.total) * 100) : 0;
  const pctEX = tierTotals.equilibrado.total > 0 ? Math.round((diffEX / tierTotals.equilibrado.total) * 100) : 0;

  // Sidebar products
  const sidebarProducts = useMemo(() =>
    CATALOG.filter(p => p.sidebarCategory === sidebarCategory),
    [sidebarCategory]
  );

  // Actions
  const handleSelectTier = (tier: PackageTier) => setSelectedTier(tier);

  const handleConfirmOrder = () => {
    if (!selectedTier) return;
    clearCart();
    packages[selectedTier].items.forEach((item, i) => {
      addItem({ id: `quote-${selectedTier}-${i}`, name: item.productName, price: item.unitPrice, quantity: item.qty });
    });
    navigate("/checkout");
  };

  const handleSaveQuote = async () => {
    if (!user) { toast.info("Inicia sesión para guardar tu cotización"); navigate("/login?returnUrl=/cotizar"); return; }
    await supabase.from("quotes").insert({
      user_id: user.id,
      event_type: eventType,
      people_count: people,
      event_date: date ? format(date, "yyyy-MM-dd") : null,
      time_slot: eventTime,
      total_estimated: selectedTier ? tierTotals[selectedTier].total : tierTotals.equilibrado.total,
      status: "draft",
    });
    toast.success("Cotización guardada");
  };

  const handleExportPDF = () => {
    const tier = selectedTier || "equilibrado";
    const t = tierTotals[tier];
    const items = packages[tier].items;
    const doc = new jsPDF();

    doc.setFontSize(20); doc.setTextColor(0, 61, 91); doc.text("BERLIOZ", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text("Cotización de Catering Corporativo", 14, 27);
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    let y = 38;
    doc.text(`Atención: ${clientName || "—"}`, 14, y);
    doc.text(`Empresa: ${empresa || "—"}`, 14, y + 5);
    doc.text(`Evento: ${eventLabel}`, 14, y + 10);
    doc.text(`Fecha: ${date ? format(date, "d/MM/yyyy") : "—"}`, 14, y + 15);
    doc.text(`Personas: ${people}`, 14, y + 20);
    doc.text(`CP: ${postalCode || "—"}`, 14, y + 25);
    doc.text(`Hora de entrega: ${deliveryTime || "—"}`, 120, y);
    doc.text(`Duración: ${duration || "—"}`, 120, y + 5);
    doc.text(`Cotización: ${quoteId}`, 120, y + 10);
    doc.text(`Fecha cotización: ${format(new Date(), "d/MM/yyyy")}`, 120, y + 15);

    const tableData = items.map(i => [i.productName, formatMXN(i.unitPrice), `${i.qty}`, formatMXN(i.unitPrice * i.qty)]);
    (doc as any).autoTable({
      startY: y + 35, head: [["Descripción", "Precio Unitario", "Cantidad", "Subtotal"]],
      body: tableData, theme: "grid",
      headStyles: { fillColor: [0, 61, 91], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });

    const fy = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text(`Subtotal: ${formatMXN(t.subtotal)}`, 130, fy);
    doc.text(`Envío: ${formatMXN(t.shipping)}`, 130, fy + 5);
    if (t.early > 0) doc.text(`Recargo entrega temprana: ${formatMXN(t.early)}`, 130, fy + 10);
    const offset = t.early > 0 ? 15 : 10;
    doc.text(`IVA (16%): ${formatMXN(t.iva)}`, 130, fy + offset);
    doc.setFontSize(12); doc.setTextColor(0, 61, 91);
    doc.text(`Total: ${formatMXN(t.total)}`, 130, fy + offset + 7);

    doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    let ny = fy + offset + 20;
    QUOTE_FOOTER_NOTES.forEach(note => { doc.text(`* ${note}`, 14, ny); ny += 4; });
    ny += 4; doc.setFontSize(8); doc.setTextColor(0, 61, 91);
    doc.text("Anne Seguy | hola@berlioz.mx | 55 8237 5469", 14, ny);
    doc.text(`Válida hasta: ${format(validUntil, "dd/MM/yyyy")} | ID: ${quoteId}`, 14, ny + 5);

    doc.save(`Berlioz-Cotizacion-${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("PDF descargado");
  };

  const handleWhatsApp = () => {
    const tier = selectedTier || "equilibrado";
    const tierLabel = TIERS.find(t => t.id === tier)?.title ?? tier;
    const t = tierTotals[tier];
    const text = `Hola! Te comparto la cotización de Berlioz para nuestro evento: ${eventLabel} para ${people} personas el ${date ? format(date, "d/MM/yyyy") : ""}.\n\nPropuesta: ${tierLabel} — ${formatMXN(t.total / people)}/persona\nTotal: ${formatMXN(t.total)}\n\n¿Lo revisamos? berlioz.mx`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const openSidebar = (tier: PackageTier) => {
    setSidebarTarget(tier);
    setSwapTarget(null);
    setSidebarOpen(true);
  };

  const openSwapSidebar = (tier: PackageTier, instanceId: string) => {
    setSidebarTarget(tier);
    setSwapTarget({ tier, instanceId });
    setSidebarOpen(true);
  };

  // ═══ RENDER ═══
  return (
    <div className="relative">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-2xl text-foreground">Propuesta Berlioz</h1>
            <p className="font-body text-xs text-muted-foreground">Ciudad de México, {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}</p>
          </div>
          <button onClick={onRestart} className="font-body text-xs text-primary hover:underline">← Nueva cotización</button>
        </div>

        {/* Info table */}
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-body">
            <div><span className="text-muted-foreground">Atención</span><p className="font-medium text-foreground">{clientName || "—"}</p></div>
            <div><span className="text-muted-foreground">Empresa</span><p className="font-medium text-foreground">{empresa || "—"}</p></div>
            <div><span className="text-muted-foreground">Evento</span><p className="font-medium text-foreground">{eventLabel}</p></div>
            <div><span className="text-muted-foreground">Fecha</span><p className="font-medium text-foreground">{date ? format(date, "d/MM/yyyy") : "—"}</p></div>
            <div><span className="text-muted-foreground">Personas</span><p className="font-medium text-foreground">{people}</p></div>
            <div><span className="text-muted-foreground">CP</span><p className="font-medium text-foreground">{postalCode || "—"}</p></div>
            <div><span className="text-muted-foreground">Hora entrega</span><p className="font-medium text-primary">{deliveryTime || "—"}</p></div>
            <div><span className="text-muted-foreground">Duración</span><p className="font-medium text-foreground">{duration || "—"}</p></div>
          </div>
          <p className="font-body text-xs text-muted-foreground mt-3 italic">
            Estimado/a {clientName || "cliente"}, en Berlioz nos da mucho gusto preparar esta propuesta de {eventLabel.toLowerCase()} para {empresa || "su empresa"}. A continuación encontrará tres opciones diseñadas a la medida de su evento.
          </p>
        </div>

        {/* Small order note */}
        {people <= 4 && (
          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3 mb-4 font-body text-sm text-foreground">
            ¿Solo necesitas unas cuantas cajas? <a href="https://berlioz.mx" className="text-primary font-semibold hover:underline">Ve directo → berlioz.mx</a>
          </div>
        )}

        {/* IVA notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 font-body text-xs text-amber-800">
          ℹ️ Precios por persona del producto únicamente. Se agregan al total: IVA 16% · Envío ${BASE_SHIPPING_COST}/entrega{isEarlyDelivery ? ` · Recargo entrega temprana $${EARLY_DELIVERY_SURCHARGE}` : ""}.
        </div>
      </div>

      {/* ═══ THREE PROPOSAL CARDS ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {TIERS.map(tier => {
            const pkg = packages[tier.id];
            const t = tierTotals[tier.id];
            const isOpen = openSections[tier.id];
            const isSelected = selectedTier === tier.id;

            return (
              <div key={tier.id} className={cn(
                "relative bg-card rounded-xl border-2 transition-all flex flex-col",
                tier.isPopular && "lg:scale-[1.02] lg:z-10 shadow-lg",
                tier.isPopular && !isSelected && "border-primary",
                isSelected && "border-primary ring-2 ring-primary/20",
                !tier.isPopular && !isSelected && "border-border",
              )}>
                {/* Popular badge */}
                {tier.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-lg bg-primary text-primary-foreground font-body text-xs font-semibold z-10">
                    ⭐ Más popular
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  {/* Title */}
                  <h3 className="font-heading text-lg font-bold text-foreground">{tier.title}</h3>
                  <p className="font-body text-xs text-muted-foreground italic mb-3">{tier.subtitle}</p>

                  {/* Tip */}
                  {tier.tip && (
                    <div className="bg-primary/5 rounded-lg p-2 mb-3">
                      <p className="font-body text-xs text-primary">{tier.tip}</p>
                    </div>
                  )}

                  {/* Bullets */}
                  <ul className="space-y-1 mb-4">
                    {tier.bullets.map(b => (
                      <li key={b} className="font-body text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>{b}
                      </li>
                    ))}
                  </ul>

                  {/* Price */}
                  <div className="border-t border-border pt-3 mb-3">
                    <p className="font-mono text-2xl text-primary font-bold">{formatMXN(t.total)}</p>
                    <p className="font-body text-[11px] text-muted-foreground">
                      Total para {people} personas · {formatMXN(t.total / Math.max(1, people))}/persona
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground italic mt-0.5">Incluye I.V.A. y envío</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => toggleSection(tier.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-body font-medium text-foreground hover:bg-muted transition-colors">
                      ✏️ {isOpen ? "Ocultar" : "Modificar"} {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => openSidebar(tier.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-body font-medium text-foreground hover:bg-muted transition-colors">
                      <Search className="w-3 h-3" /> Agregar
                    </button>
                  </div>

                  {/* Mini-cards */}
                  {isOpen && (
                    <div className="grid grid-cols-1 gap-2 mb-3 animate-slide-up">
                      {pkg.items.map(item => (
                        <div key={item.instanceId} className="bg-muted/50 rounded-lg p-3 border border-border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-[13px] font-bold text-foreground truncate">
                                {item.isBestseller && <Star className="w-3 h-3 inline text-amber-500 mr-1" />}
                                {item.productName}
                              </p>
                              <p className="font-mono text-[11px] text-muted-foreground">{formatMXN(item.unitPrice)}/u</p>
                            </div>
                            <button onClick={() => removeItem(tier.id, item.instanceId)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateItemQty(tier.id, item.instanceId, -1)}
                                className="w-6 h-6 rounded border border-border bg-card flex items-center justify-center text-xs hover:bg-muted">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-sm w-8 text-center">{item.qty}</span>
                              <button onClick={() => updateItemQty(tier.id, item.instanceId, 1)}
                                className="w-6 h-6 rounded border border-border bg-card flex items-center justify-center text-xs hover:bg-muted">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-mono text-xs font-semibold text-foreground">{formatMXN(item.unitPrice * item.qty)}</span>
                          </div>
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => openSwapSidebar(tier.id, item.instanceId)}
                              className="font-body text-[10px] text-primary hover:underline flex items-center gap-0.5">
                              <ArrowUpDown className="w-3 h-3" /> Cambiar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="mt-auto border-t border-border pt-2 space-y-0.5 text-xs font-body">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatMXN(t.subtotal)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Envío</span><span className="font-mono">{formatMXN(t.shipping)}</span></div>
                    {t.early > 0 && <div className="flex justify-between text-amber-600"><span>Recargo temprano</span><span className="font-mono">{formatMXN(t.early)}</span></div>}
                    <div className="flex justify-between text-muted-foreground"><span>IVA (16%)</span><span className="font-mono">{formatMXN(t.iva)}</span></div>
                    <div className="flex justify-between font-semibold text-foreground pt-1"><span>Total</span><span className="font-mono">{formatMXN(t.total)}</span></div>
                  </div>

                  {/* CTA */}
                  <button onClick={() => handleSelectTier(tier.id)}
                    className={cn(
                      "mt-4 w-full py-3 rounded-lg font-body text-sm font-semibold transition-all",
                      isSelected ? "bg-primary text-primary-foreground" :
                        tier.ctaStyle === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/90" :
                          "border-2 border-border text-foreground hover:bg-muted"
                    )}>
                    {isSelected ? "✓ Seleccionado" : "Seleccionar este paquete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison bar */}
        <div className="bg-muted/50 rounded-lg p-3 mb-6 text-center font-body text-sm text-muted-foreground flex flex-wrap justify-center gap-4">
          <span>Esencial vs Equilibrado: <strong className="text-foreground">+{formatMXN(diffEQ)} (+{pctEQ}%)</strong></span>
          <span>|</span>
          <span>Equilibrado vs Experiencia: <strong className="text-foreground">+{formatMXN(diffEX)} (+{pctEX}%)</strong></span>
        </div>

        {/* Social proof */}
        <div className="text-center font-body text-sm text-muted-foreground mb-8">
          💡 8 de cada 10 clientes eligen el paquete Equilibrado. Incluye bebidas y la mejor relación calidad-precio.
        </div>

        {/* Add-ons */}
        <div className="mb-8">
          <h3 className="font-heading text-lg text-foreground mb-4">Personaliza tu pedido</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {QUOTE_ADDONS.map(addon => {
              const isActive = selectedAddons.includes(addon.id);
              return (
                <button key={addon.id} onClick={() => setSelectedAddons(prev => prev.includes(addon.id) ? prev.filter(a => a !== addon.id) : [...prev, addon.id])}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    isActive ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                  )}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{addon.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-foreground">{addon.name}</p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                      <p className="font-body text-xs text-primary font-semibold mt-1">{formatMXN(addon.price)}{addon.priceUnit}</p>
                    </div>
                    <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                      isActive ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}>
                      {isActive && <span className="text-xs">✓</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Upsell tip */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 font-body text-xs text-primary">
            💡 ¿Quieres agregar bebidas y snacks para antes o después de la comida? Complementa con Café/Té Berlioz ($540/caja), aguas frescas ($45/pza) o snack bags ($140/pza).
          </div>
        </div>

        {/* General Conditions */}
        <div className="mb-8">
          <h3 className="font-heading text-base text-foreground mb-3">Condiciones generales</h3>
          <ul className="space-y-1">
            {QUOTE_FOOTER_NOTES.map((note, i) => (
              <li key={i} className="font-body text-xs text-muted-foreground">• {note}</li>
            ))}
          </ul>
          <p className="font-body text-xs text-muted-foreground mt-3 border-t border-border pt-2">
            Válida hasta: {format(validUntil, "dd/MM/yyyy")} | ID: {quoteId}
          </p>
        </div>
      </div>

      {/* ═══ STICKY BOTTOM BAR ═══ */}
      <div className="sticky bottom-0 z-40 bg-card border-t border-border shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 font-body text-xs text-muted-foreground hidden sm:block">
            ✏️ Propuesta personalizada · Esencial {formatMXN(tierTotals.esencial.total)} · Equilibrado {formatMXN(tierTotals.equilibrado.total)} · Experiencia {formatMXN(tierTotals.experiencia.total)}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveQuote} className="gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Guardar
            </Button>
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </Button>
            <Button size="sm" onClick={handleConfirmOrder} disabled={!selectedTier} className="gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Confirmar pedido →
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ SIDEBAR PANEL ═══ */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => { setSidebarOpen(false); setSwapTarget(null); }} />
          <div className="fixed top-0 right-0 h-full w-[360px] max-w-[90vw] bg-card border-l border-border z-50 flex flex-col shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <p className="font-body text-sm font-semibold text-foreground">
                  {swapTarget ? "Cambiar producto" : `Agregando a: ${TIERS.find(t => t.id === sidebarTarget)?.title}`}
                </p>
              </div>
              <button onClick={() => { setSidebarOpen(false); setSwapTarget(null); }}
                className="p-1 hover:bg-muted rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-border">
              {SIDEBAR_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSidebarCategory(cat)}
                  className={cn("px-3 py-1 rounded-full font-body text-xs font-medium whitespace-nowrap transition-all border",
                    sidebarCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                  )}>{cat}</button>
              ))}
            </div>

            {/* Products */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sidebarProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">
                      {product.isBestseller && <Star className="w-3 h-3 inline text-amber-500 mr-1" />}
                      {product.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{formatMXN(product.price)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs"
                    onClick={() => {
                      if (swapTarget) {
                        swapItem(swapTarget.tier, swapTarget.instanceId, product);
                      } else {
                        addProductToTier(sidebarTarget, product);
                      }
                    }}>
                    {swapTarget ? "Cambiar" : "+ Agregar"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
