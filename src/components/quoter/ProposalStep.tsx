import { useState, useMemo, useCallback } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Minus, Plus, Trash2, ArrowUpDown, Search, X, Download, Mail, Share2, ShoppingBag, ChevronDown, ChevronUp, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatMXN } from "@/domain/value-objects/Money";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "@/assets/berlioz-logo.png";
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
    try {
      const tier = selectedTier || "equilibrado";
      const t = tierTotals[tier];
      const items = packages[tier].items;
      const doc = new jsPDF();
      
      const primaryColor: [number, number, number] = [1, 77, 111];
      const secondaryColor = [100, 100, 100];
      const accentColor = [190, 155, 123]; // gold/amber tone

      // === HEADER ===
      // Add logo
      try {
        doc.addImage(logoImg, "PNG", 14, 15, 30, 8);
      } catch (e) {
        // Log skip if image fails
        doc.setFontSize(22); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); 
        doc.text("BERLIOZ", 14, 20);
      }

      doc.setFontSize(10); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); 
      doc.text("L'art de recevoir — Cotización Gourmet", 14, 30);
      
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(14, 35, 196, 35);

      // === CLIENT INFO ===
      doc.setFontSize(9); doc.setTextColor(0, 0, 0);
      let y = 45;
      
      // Column 1
      doc.setFont("helvetica", "bold"); doc.text("RECEPTOR", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Atención: ${clientName || "—"}`, 14, y + 6);
      doc.text(`Empresa: ${empresa || "—"}`, 14, y + 12);
      doc.text(`Evento: ${eventLabel}`, 14, y + 18);
      doc.text(`Zona (CP): ${postalCode || "—"}`, 14, y + 24);

      // Column 2
      doc.setFont("helvetica", "bold"); doc.text("DETALLES LOGÍSTICOS", 110, y);
      doc.setFont("helvetica", "normal");
      doc.text(`ID Cotización: ${quoteId}`, 110, y + 6);
      doc.text(`Fecha del Evento: ${date ? format(date, "d/MM/yyyy") : "—"}`, 110, y + 12);
      doc.text(`Hora de Entrega: ${deliveryTime || "—"}`, 110, y + 18);
      doc.text(`Personas: ${people}`, 110, y + 24);
      doc.text(`Duración: ${duration || "—"}`, 110, y + 30);

      // === ITEMS TABLE ===
      const tableData = items.map(i => [
        i.productName, 
        formatMXN(i.unitPrice), 
        `${i.qty}`, 
        formatMXN(i.unitPrice * i.qty)
      ]);

      autoTable(doc, {
        startY: y + 40,
        head: [["Descripción", "Precio Unitario", "Cantidad", "Subtotal"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: 50 },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "right", cellWidth: 35 },
          2: { halign: "center", cellWidth: 25 },
          3: { halign: "right", cellWidth: 35 },
        },
      });

      // === TOTALS ===
      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const alignRight = 196;
      doc.text(`Subtotal:`, 140, lastY);
      doc.text(formatMXN(t.subtotal), alignRight, lastY, { align: "right" });
      
      doc.text(`Logística y Envío:`, 140, lastY + 6);
      doc.text(formatMXN(t.shipping + t.early), alignRight, lastY + 6, { align: "right" });
      
      doc.text(`IVA (16%):`, 140, lastY + 12);
      doc.text(formatMXN(t.iva), alignRight, lastY + 12, { align: "right" });
      
      doc.setFontSize(14); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL:`, 140, lastY + 22);
      doc.text(formatMXN(t.total), alignRight, lastY + 22, { align: "right" });

      // === FOOTER NOTES ===
      doc.setFontSize(8); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      let ny = Math.max(lastY + 40, 230);
      
      doc.setFont("helvetica", "bold");
      doc.text("NOTAS IMPORTANTES", 14, ny);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      
      ny += 5;
      QUOTE_FOOTER_NOTES.slice(0, 8).forEach(note => { 
        doc.text(`• ${note}`, 14, ny); 
        ny += 4; 
      });

      // === BRAND CONTACT ===
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.5);
      doc.line(14, 275, 196, 275);
      
      doc.setFontSize(8); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text("Anne Seguy | hola@berlioz.mx | 55 8237 5469", 14, 282);
      doc.setFont("helvetica", "normal"); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Válida hasta: ${format(validUntil, "dd/MM/yyyy")} | ID: ${quoteId}`, 14, 287);

      doc.save(`Berlioz-Cotizacion-${format(new Date(), "yyyyMMdd")}.pdf`);
      toast.success("Tu cotización en PDF se ha generado correctamente");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Ocurrió un error al generar el PDF. Verifica que la información esté completa.");
    }
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
    <div className="relative bg-white font-body selection:bg-primary/10">
      {/* Header — Premium and Clean */}
      <div className="bg-gradient-to-b from-primary/[0.03] to-white border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                Propuesta de Catering Gourmet
              </span>
              <h1 className="font-heading text-4xl md:text-5xl text-foreground tracking-tight">
                {empresa || "Tu Evento"} — <span className="text-primary">{eventLabel}</span>
              </h1>
              <p className="font-body text-sm text-muted-foreground mt-3 flex items-center gap-2">
                 Ciudad de México · {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={onRestart} className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-white font-heading text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-300">
                <span className="transition-transform group-hover:-translate-x-1">←</span> Nueva cotización
              </button>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">ID: {quoteId}</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 border-t border-border/60 pt-8 mt-4">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Atención</p>
              <p className="font-heading text-sm font-bold truncate">{clientName || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Fecha</p>
              <p className="font-heading text-sm font-bold">{date ? format(date, "d MMM yyyy", { locale: es }) : "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Personas</p>
              <p className="font-heading text-sm font-bold">{people}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Entrega</p>
              <p className="font-heading text-sm font-bold text-primary italic">{deliveryTime || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Duración</p>
              <p className="font-heading text-sm font-bold">{duration || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Zona (CP)</p>
              <p className="font-heading text-sm font-bold">{postalCode || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Intro Message */}
        <div className="max-w-3xl mb-16">
          <p className="font-body text-lg text-muted-foreground leading-relaxed">
            Estimado/a <span className="text-foreground font-bold">{clientName || "cliente"}</span>, en Berlioz nos entusiasma preparar esta propuesta gastronómica para <span className="text-foreground font-bold">{empresa || "su empresa"}</span>. 
            Hemos diseñado tres niveles de experiencia que combinan sabor, sofisticación y la puntualidad que nos caracteriza.
          </p>
        </div>

        {/* ═══ THREE PROPOSAL CARDS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {TIERS.map((tier, idx) => {
            const pkg = packages[tier.id];
            const t = tierTotals[tier.id];
            const isOpen = openSections[tier.id];
            const isSelected = selectedTier === tier.id;

              return (
                <div key={tier.id} className={cn(
                  "group relative flex flex-col rounded-[48px] border-2 transition-all duration-500 h-full",
                  tier.isPopular ? "border-primary shadow-2xl shadow-primary/10 ring-8 ring-primary/[0.02] lg:-translate-y-4" : "border-border/60 hover:border-primary/30 bg-card/50",
                  isSelected && "border-primary ring-8 ring-primary/5",
                )}>
                {/* Popular badge */}
                {tier.isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-primary text-primary-foreground font-heading text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/30 z-10 whitespace-nowrap">
                    ⭐ Nuestra Recomendación
                  </div>
                )}

                <div className="p-10 flex-1 flex flex-col">
                  {/* Tier Header */}
                  <div className="mb-8">
                    <h3 className="font-heading text-3xl font-bold text-foreground mb-2">{tier.title}</h3>
                    <p className="font-body text-sm text-muted-foreground italic leading-snug">{tier.subtitle}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-10 p-6 rounded-[32px] bg-white border border-border shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-black tracking-tighter text-primary">{formatMXN(t.total)}</span>
                      <span className="font-body text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total</span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                       {formatMXN(t.total / Math.max(1, people))} <span className="font-bold">por persona</span>
                    </p>
                    <p className="font-body text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                      IVA y envío incluidos
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-10 flex-1">
                    {tier.bullets.map(b => (
                      <li key={b} className="font-body text-sm text-foreground flex items-start gap-3">
                        <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary stroke-[3]" />
                        </div>
                        {b}
                      </li>
                    ))}
                    {tier.tip && (
                      <li className="p-4 rounded-2xl bg-primary/5 border border-primary/10 font-body text-xs text-primary leading-relaxed italic">
                        {tier.tip}
                      </li>
                    )}
                  </ul>

                  {/* Item Customization Header */}
                  <div className="flex items-center justify-between gap-2 mb-6 pt-6 border-t border-border/60">
                    <button onClick={() => toggleSection(tier.id)}
                      className="flex items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                      {isOpen ? "Ocultar detalles" : "Modificar menú"} 
                      {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => openSidebar(tier.id)}
                      className="flex items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-all">
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>

                  {/* Expandable Menu List */}
                  {isOpen && (
                    <div className="space-y-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      {pkg.items.map(item => (
                        <div key={item.instanceId} className="bg-white rounded-2xl p-4 border border-border/80 shadow-sm relative group/item">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 pr-6">
                              <p className="font-heading text-sm font-bold text-foreground">
                                {item.isBestseller && <Star className="w-3.5 h-3.5 inline text-amber-500 fill-current mr-1 mb-0.5" />}
                                {item.productName}
                              </p>
                              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{formatMXN(item.unitPrice)}/u</p>
                            </div>
                            <button onClick={() => removeItem(tier.id, item.instanceId)}
                              className="absolute top-4 right-4 text-muted-foreground/40 hover:text-destructive transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center bg-muted/50 rounded-xl p-1">
                              <button onClick={() => updateItemQty(tier.id, item.instanceId, -1)}
                                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary hover:bg-muted transition-colors">
                                <Minus className="w-3 h-3 stroke-[3]" />
                              </button>
                              <span className="font-mono text-sm font-black w-10 text-center">{item.qty}</span>
                              <button onClick={() => updateItemQty(tier.id, item.instanceId, 1)}
                                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary hover:bg-muted transition-colors">
                                <Plus className="w-3 h-3 stroke-[3]" />
                              </button>
                            </div>
                            <div className="text-right">
                              <span className="block font-heading text-sm font-bold text-primary">{formatMXN(item.unitPrice * item.qty)}</span>
                              <button onClick={() => openSwapSidebar(tier.id, item.instanceId)}
                                className="font-heading text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mt-1">
                                <ArrowUpDown className="w-3 h-3 inline mr-1" /> Cambiar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Breakdown — Clean Style */}
                  <div className="space-y-2 mb-10 pt-6 border-t border-border/60">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60"><span>Subtotal</span><span>{formatMXN(t.subtotal)}</span></div>
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60"><span>Logística</span><span>{formatMXN(t.shipping + t.early)}</span></div>
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60"><span>Impuestos</span><span>{formatMXN(t.iva)}</span></div>
                  </div>

                  {/* SELECT CTA */}
                  <button onClick={() => handleSelectTier(tier.id)}
                    className={cn(
                      "w-full py-5 rounded-[24px] font-heading text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl",
                      isSelected ? "bg-secondary text-white shadow-secondary/30 scale-[1.02]" :
                        tier.isPopular ? "bg-primary text-white shadow-primary/30 hover:scale-[1.02]" :
                          "bg-white border-2 border-primary text-primary hover:bg-primary/5 shadow-primary/5 hover:scale-[1.02]"
                    )}>
                    {isSelected ? "✓ Opción Seleccionada" : "Seleccionar opción"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* COMPARISON BAR — High Impact */}
        <div className="bg-primary/[0.03] backdrop-blur-sm rounded-[40px] border border-primary/10 p-10 mb-20">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20">
            <div className="text-center md:text-left">
              <h4 className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">Inversión Adicional</h4>
              <p className="font-body text-sm text-muted-foreground italic">Mejora la experiencia por muy poco</p>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
              <div className="text-center group">
                <span className="block font-heading text-2xl font-black text-primary group-hover:scale-110 transition-transform">+{formatMXN(diffEQ)}</span>
                <span className="font-body text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Esencial → Equilibrado</span>
              </div>
              <div className="text-center group">
                <span className="block font-heading text-2xl font-black text-primary group-hover:scale-110 transition-transform">+{formatMXN(diffEX)}</span>
                <span className="font-body text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Equilibrado → Experiencia</span>
              </div>
            </div>
          </div>
        </div>

        {/* PERSONALIZATION SECTION */}
        <div className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h3 className="font-heading text-3xl font-bold text-foreground mb-2">Personaliza la Experiencia</h3>
              <p className="font-body text-sm text-muted-foreground italic">Detalles que marcan la diferencia en tu evento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {QUOTE_ADDONS.map(addon => {
              const isActive = selectedAddons.includes(addon.id);
              return (
                <button key={addon.id} onClick={() => setSelectedAddons(prev => prev.includes(addon.id) ? prev.filter(a => a !== addon.id) : [...prev, addon.id])}
                  className={cn(
                    "relative p-8 rounded-[40px] border-2 text-left transition-all duration-300 group overflow-hidden",
                    isActive ? "border-primary bg-primary/[0.02] shadow-xl shadow-primary/5 ring-8 ring-primary/[0.01]" : "border-border/60 bg-white hover:border-primary/30"
                  )}>
                  {/* Selection dot */}
                  <div className={cn("absolute top-8 right-8 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    isActive ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20" : "border-border group-hover:border-primary/30"
                  )}>
                    {isActive && <Check className="w-5 h-5 stroke-[3]" />}
                  </div>

                  <div className="flex flex-col gap-4">
                    <span className="text-4xl filter group-hover:scale-110 transition-transform self-start">{addon.icon}</span>
                    <div>
                      <p className="font-heading text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{addon.name}</p>
                      <p className="font-body text-xs text-muted-foreground leading-relaxed mb-4">{addon.description}</p>
                      <p className="font-heading text-sm font-bold text-primary/80 bg-primary/5 px-3 py-1.5 rounded-full inline-block">{formatMXN(addon.price)}{addon.priceUnit}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="bg-secondary/[0.03] border-l-4 border-secondary rounded-r-[32px] p-8">
            <p className="font-body text-sm text-secondary leading-relaxed">
              <strong className="font-heading uppercase tracking-widest text-[11px] block mb-2">Berlioz Pro Tip:</strong>
              ¿Buscas algo aún más personalizado? <span className="font-bold underline decoration-secondary/30">Agrega estaciones de café</span>, surtidos de repostería temática o kits de bienvenida. Contáctanos para armar un paquete a tu medida.
            </p>
          </div>
        </div>

        {/* BOTTOM BRANDING & NOTES */}
        <div className="border-t border-border pt-20 pb-10 grid grid-cols-1 md:grid-cols-2 gap-20">
          <div>
            <h4 className="font-heading text-xl font-bold text-foreground mb-6 uppercase tracking-wider">Condiciones del Servicio</h4>
            <ul className="space-y-3">
              {QUOTE_FOOTER_NOTES.map((note, i) => (
                <li key={i} className="font-body text-xs text-muted-foreground flex items-start gap-3 leading-relaxed transition-colors hover:text-foreground">
                  <span className="text-primary font-bold mt-0.5">•</span> {note}
                </li>
              ))}
            </ul>
            <div className="mt-10 p-5 rounded-2xl bg-muted/30 border border-border/50">
              <p className="font-heading text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Validez de Propuesta</p>
              <p className="font-body text-xs font-bold mt-1 text-foreground">Hasta el {format(validUntil, "dd 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end justify-center text-center md:text-right">
             <div className="mb-8">
               <h2 className="font-heading text-4xl text-primary font-black tracking-tight mb-2 italic">BERLIOZ</h2>
               <p className="font-body text-xs text-muted-foreground tracking-[0.4em] uppercase font-bold">L'art de recevoir</p>
             </div>
             <p className="font-heading text-base font-bold text-foreground mb-2">Anne Seguy</p>
             <p className="font-body text-sm text-muted-foreground mb-1">Cofundadora & Directora</p>
             <a href="mailto:hola@berlioz.mx" className="font-mono text-xs text-primary hover:underline">hola@berlioz.mx</a>
             <p className="font-mono text-xs text-muted-foreground mt-1">+52 55 8237 5469</p>
          </div>
        </div>
      </div>

      {/* ═══ PREMIUM STICKY ACTION BAR ═══ */}
      <div className="sticky bottom-0 z-50 px-6 pb-6 pt-0 pointer-events-none">
        <div className="max-w-6xl mx-auto pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-2xl border border-primary/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-4 px-8 py-6">
              <div className="flex-1 hidden md:block">
                <p className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60 mb-1">Propuesta Seleccionada</p>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-lg font-bold text-foreground">{selectedTier ? TIERS.find(t => t.id === selectedTier)?.title : "Selecciona una opción"}</span>
                  {selectedTier && <span className="font-mono text-lg font-black text-primary">{formatMXN(tierTotals[selectedTier].total)}</span>}
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <Button variant="outline" onClick={handleExportPDF} className="h-14 px-6 rounded-2xl border-2 font-bold flex items-center gap-3 hover:bg-muted transition-all">
                  <Download className="w-5 h-5 text-primary" />
                  <span className="hidden sm:inline">Descargar PDF</span>
                </Button>
                <button onClick={handleWhatsApp} className="h-14 w-14 sm:w-auto sm:px-6 rounded-2xl border-2 border-green-500/20 bg-green-500/5 text-green-700 font-bold flex items-center justify-center gap-3 hover:bg-green-500/10 transition-all">
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Compartir WhatsApp</span>
                </button>
                <Button size="lg" onClick={handleConfirmOrder} disabled={!selectedTier} className={cn(
                  "h-14 px-10 rounded-2xl font-bold flex items-center gap-3 shadow-2xl transition-all",
                  selectedTier ? "shadow-primary/30" : "opacity-50"
                )}>
                  <ShoppingBag className="w-5 h-5" />
                  Continuar al Pedido
                </Button>
              </div>
            </div>
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
