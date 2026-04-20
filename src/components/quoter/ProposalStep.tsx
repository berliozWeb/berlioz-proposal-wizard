import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Minus, Plus, Trash2, ArrowUpDown, Search, X, Download, Mail, Share2, ShoppingBag, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Star, Check, Sparkles, Info } from "lucide-react";
import { useRef } from "react";
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
import type { SmartQuoteResponse, ProposalPackage } from "@/domain/entities/SmartQuote";
import { ProductCollage } from "@/components/ProductCollage";
import { buildProductImageUrl } from "@/lib/imageUtils";
import { useCatalogoCotizador, getCategoryFallback, QUOTER_SIDEBAR_CATEGORIES } from "@/hooks/useCatalogoCotizador";
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
  recommendationReason?: string;
  imageUrl?: string | null;
  imageSource?: string;
  sourceType?: 'supabase' | 'deterministic-fallback';
  productId?: string;
  imagen?: string | null;
  imagen_url?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
}

interface PackageState {
  items: ProposalItem[];
  recommendationReason?: string;
  isRecommended?: boolean;
  highlights?: string[];
  narrativa?: string;
  tagline?: string;
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
  smartQuoteData?: SmartQuoteResponse | null;
  smartQuoteLoading?: boolean;
  onSubmitFeedback?: (feedback: {
    proposalId: string;
    selectedTier?: string;
    accepted?: boolean;
    productsAdded?: string[];
    productsRemoved?: string[];
  }) => void;
  /** Notify parent when user picks a tier (used by multi-delivery to advance tabs and build summary). */
  onSelectTier?: (info: { tier: PackageTier; tierLabel: string; total: number; subtotal: number }) => void;
  /** Hide the bottom sticky confirm bar (multi-delivery uses its own global summary). */
  hideConfirmBar?: boolean;
}

type TierInfo = { id: PackageTier; title: string; subtitle: string; tip?: string; bullets: string[]; isPopular: boolean; ctaStyle: 'outline' | 'primary' };

const TIERS: TierInfo[] = [
  {
    id: "equilibrado", title: "Equilibrado", subtitle: "La experiencia que tu equipo merece",
    bullets: ["Café/Té Berlioz + agua incluidos", "Variedad premium", "Presentación profesional"],
    isPopular: true, ctaStyle: "primary",
  },
  {
    id: "esencial", title: "Esencial", subtitle: "Lo necesario, bien ejecutado",
    tip: "💡 El 85% de nuestros clientes agrega bebidas a este pedido",
    bullets: ["Entrega puntual garantizada", "Precio base sin bebidas", "Ideal para eventos recurrentes"],
    isPopular: false, ctaStyle: "outline",
  },
  {
    id: "experiencia", title: "Experiencia Completa", subtitle: "Cada detalle cuenta",
    bullets: ["Café/Té + aguas premium", "Productos gourmet top-tier", "Surtidos y postres premium"],
    isPopular: false, ctaStyle: "outline",
  },
];

let _iid = 0;
function nextId() { return `pi-${++_iid}-${Date.now()}`; }

/** Build packages from smart quote backend data */
function buildFromSmartQuote(smartData: SmartQuoteResponse): Record<PackageTier, PackageState> {
  const result: Record<PackageTier, PackageState> = {
    esencial: { items: [] },
    equilibrado: { items: [] },
    experiencia: { items: [] },
  };

  for (const pkg of smartData.packages) {
    const tier = pkg.tier as PackageTier;
    if (!result[tier]) continue;

    result[tier] = {
      items: pkg.items.map(item => ({
        instanceId: nextId(),
        productName: item.productName,
        unitPrice: item.unitPrice,
        qty: item.quantity,
        isBestseller: (item.score || 0) >= 80,
        category: item.swapGroup || item.categoria || '',
        recommendationReason: item.recommendationReason,
        imageUrl: item.imageUrl,
        imageSource: item.imageSource,
        sourceType: item.sourceType,
        productId: item.productId,
        imagen_url: item.imageUrl,
        categoria: item.categoria,
      })),
      recommendationReason: pkg.recommendationReason,
      isRecommended: pkg.isRecommended,
      highlights: pkg.highlights,
      narrativa: pkg.narrativa,
      tagline: pkg.tagline,
    };
  }

  return result;
}

/** Fallback: build from hardcoded catalog */
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
      sourceType: 'deterministic-fallback',
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

/* ═══ TIER CAROUSEL (Zona B) — horizontal scroll with arrows + fade ═══ */
function TierCarousel({
  tier,
  pkg,
  updateItemQty,
  removeItem,
  openSwapSidebar,
  openSidebar,
}: {
  tier: TierInfo;
  pkg: PackageState;
  updateItemQty: (tierId: PackageTier, instanceId: string, delta: number) => void;
  removeItem: (tierId: PackageTier, instanceId: string) => void;
  openSwapSidebar: (tierId: PackageTier, instanceId: string) => void;
  openSidebar: (tierId: PackageTier) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, pkg.items.length]);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <div className="min-w-0 relative">
      <p className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-[#777] mb-2">
        Personaliza tu menú ›
      </p>
      <div className="relative">
        {/* Fade gradients */}
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 bottom-3 w-8 z-10 bg-gradient-to-r from-white to-transparent transition-opacity",
            canPrev ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 bottom-3 w-8 z-10 bg-gradient-to-l from-white to-transparent transition-opacity",
            canNext ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Arrows (desktop) */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Anterior"
          className={cn(
            "hidden lg:flex absolute left-1 top-[55%] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-[#CEC1B9]/40 items-center justify-center text-[#014D6F] hover:bg-[#014D6F] hover:text-white transition-all",
            canPrev ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Siguiente"
          className={cn(
            "hidden lg:flex absolute right-1 top-[55%] -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-[#CEC1B9]/40 items-center justify-center text-[#014D6F] hover:bg-[#014D6F] hover:text-white transition-all",
            canNext ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 tier-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#014D6F #EDE6E0",
          }}
        >
          {pkg.items.map((item) => {
            const desc = (item.descripcion && item.descripcion.trim()) || item.categoria || item.category || '';
            return (
              <div
                key={item.instanceId}
                className="snap-start shrink-0 w-[220px] min-h-[330px] flex flex-col bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-3"
              >
                <div className="w-full h-[176px] rounded-lg overflow-hidden mb-2 flex items-center justify-center" style={{ background: '#E8F2F6' }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        el.parentElement!.innerHTML = '<span style="font-size:32px">🍽️</span>';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 32 }}>🍽️</span>
                  )}
                </div>
                <p className="font-heading text-[13px] font-semibold uppercase text-[#014D6F] leading-tight line-clamp-2 mb-1">
                  {item.isBestseller && <Star className="w-3 h-3 inline text-amber-500 fill-current mr-1 mb-0.5" />}
                  {item.productName}
                </p>
                {desc && (
                  <p className="font-body text-[11px] italic text-[#777] line-clamp-2 mb-2">
                    {desc}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-2 mt-auto">
                  <button
                    onClick={() => updateItemQty(tier.id, item.instanceId, -1)}
                    className="w-6 h-6 rounded-full border border-[#014D6F] text-[#014D6F] flex items-center justify-center hover:bg-[#014D6F]/5 transition-colors"
                    aria-label="Disminuir"
                  >
                    <Minus className="w-3 h-3 stroke-[3]" />
                  </button>
                  <span className="font-heading text-sm font-bold text-[#014D6F] w-6 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateItemQty(tier.id, item.instanceId, 1)}
                    className="w-6 h-6 rounded-full border border-[#014D6F] text-[#014D6F] flex items-center justify-center hover:bg-[#014D6F]/5 transition-colors"
                    aria-label="Aumentar"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => removeItem(tier.id, item.instanceId)}
                    className="ml-auto text-[#CEC1B9] hover:text-destructive transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-[13px] font-bold text-[#014D6F]">
                    {formatMXN(item.unitPrice * item.qty)}
                  </span>
                  <button
                    onClick={() => openSwapSidebar(tier.id, item.instanceId)}
                    className="font-body text-[10px] text-[#8B7355] underline hover:text-[#014D6F] transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            );
          })}

          {/* + Agregar producto card */}
          <button
            onClick={() => openSidebar(tier.id)}
            className="snap-start shrink-0 w-[220px] min-h-[330px] flex flex-col items-center justify-center gap-2 bg-[#FDFAF7] border-2 border-dashed border-[#CEC1B9] rounded-xl text-[#777] hover:border-[#014D6F] hover:text-[#014D6F] transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="font-heading text-[11px] font-bold uppercase tracking-wider">Agregar producto</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ COMPONENT ═══ */
export default function ProposalStep(props: ProposalStepProps) {
  const { eventType, eventLabel, people, date, eventTime, deliveryTime, isEarlyDelivery, postalCode, clientName, empresa, duration, onBack, onRestart, smartQuoteData, smartQuoteLoading, onSubmitFeedback } = props;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();

  const [quoteId] = useState(() => generateQuoteId());
  const validUntil = useMemo(() => addDays(new Date(), QUOTE_VALIDITY_DAYS), []);

  const isSmartQuote = !!smartQuoteData && !smartQuoteData.fallbackUsed;

  // Package states — initialized from smart quote or fallback
  const [packages, setPackages] = useState<Record<PackageTier, PackageState>>(() => {
    if (smartQuoteData) {
      return buildFromSmartQuote(smartQuoteData);
    }
    return {
      esencial: buildDefaultPackage("esencial", eventType, people),
      equilibrado: buildDefaultPackage("equilibrado", eventType, people),
      experiencia: buildDefaultPackage("experiencia", eventType, people),
    };
  });

  // UI state
  const [openSections, setOpenSections] = useState<Record<PackageTier, boolean>>({ esencial: false, equilibrado: true, experiencia: false });
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTarget, setSidebarTarget] = useState<PackageTier>("esencial");
  const [sidebarCategory, setSidebarCategory] = useState<string>('Favoritos');
  const [swapTarget, setSwapTarget] = useState<{ tier: PackageTier; instanceId: string } | null>(null);
  const [selectedTier, setSelectedTier] = useState<PackageTier | null>(null);
  const [hasReceivedSmartData, setHasReceivedSmartData] = useState(!!smartQuoteData);

  // When smartQuoteData arrives after initial render, rebuild packages
  useEffect(() => {
    if (smartQuoteData && !hasReceivedSmartData) {
      setPackages(buildFromSmartQuote(smartQuoteData));
      setHasReceivedSmartData(true);
    }
  }, [smartQuoteData, hasReceivedSmartData]);

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

  // Sidebar products — fetched from Supabase (productos table) so images & descriptions match /menu
  const { items: dbCatalogItems } = useCatalogoCotizador();

  // Quick lookup by normalized product name → enriches proposal cards with image+desc
  const dbByName = useMemo(() => {
    const map = new Map<string, typeof dbCatalogItems[0]>();
    for (const it of dbCatalogItems) {
      map.set(it.name.trim().toLowerCase(), it);
    }
    return map;
  }, [dbCatalogItems]);

  const enrichItem = useCallback((it: ProposalItem): ProposalItem => {
    if (it.imageUrl && it.descripcion) return it;
    const dbItem = dbByName.get(it.productName.trim().toLowerCase());
    if (!dbItem) return it;
    return {
      ...it,
      imageUrl: it.imageUrl || dbItem.imagen_url || getCategoryFallback(dbItem.categoriaDB || dbItem.sidebarCategory),
      imagen_url: it.imagen_url || dbItem.imagen_url,
      descripcion: it.descripcion || dbItem.description || dbItem.descripcion || undefined,
      categoria: it.categoria || dbItem.categoriaDB,
    };
  }, [dbByName]);

  const addProductToTier = useCallback((tier: PackageTier, product: CatalogProduct & { imagen_url?: string | null; descripcion?: string | null; categoriaDB?: string | null }) => {
    const newItem: ProposalItem = {
      instanceId: nextId(),
      productName: product.name,
      unitPrice: product.price,
      qty: product.isPerPerson ? people : 1,
      isBestseller: product.isBestseller,
      category: product.sidebarCategory,
      imageUrl: product.imagen_url || getCategoryFallback(product.categoriaDB || product.sidebarCategory),
      imagen_url: product.imagen_url,
      descripcion: (product as any).descripcion || product.description,
      categoria: product.categoriaDB,
    };
    setPackages(prev => ({
      ...prev,
      [tier]: { items: [...prev[tier].items, newItem] },
    }));
    toast.success(`✓ ${product.name} agregado`);
  }, [people]);

  const swapItem = useCallback((tier: PackageTier, instanceId: string, product: CatalogProduct & { imagen_url?: string | null; descripcion?: string | null; categoriaDB?: string | null }) => {
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
            imageUrl: product.imagen_url || getCategoryFallback(product.categoriaDB || product.sidebarCategory),
            imagen_url: product.imagen_url,
            descripcion: (product as any).descripcion || product.description,
            categoria: product.categoriaDB,
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

  const sidebarProducts = useMemo(() => {
    if (sidebarCategory === 'Favoritos') {
      return dbCatalogItems.filter(p => p.isBestseller).slice(0, 60);
    }
    if (sidebarCategory === 'Todos') {
      return dbCatalogItems;
    }
    return dbCatalogItems.filter(p => p.sidebarCategory === sidebarCategory);
  }, [dbCatalogItems, sidebarCategory]);


  // Actions
  const handleSelectTier = (tier: PackageTier) => {
    setSelectedTier(tier);
    // Send feedback: user selected this tier
    const proposalId = smartQuoteData?.proposalId;
    if (proposalId && onSubmitFeedback) {
      onSubmitFeedback({ proposalId, selectedTier: tier });
    }
  };

  const handleConfirmOrder = () => {
    if (!selectedTier) return;
    // Send feedback: user accepted this proposal
    const proposalId = smartQuoteData?.proposalId;
    if (proposalId && onSubmitFeedback) {
      onSubmitFeedback({ proposalId, selectedTier, accepted: true });
    }
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

  const handleExportPDF = async () => {
    try {
      const tier = selectedTier || "equilibrado";
      const t = tierTotals[tier];
      const items = packages[tier].items;
      const tierInfo = TIERS.find(ti => ti.id === tier);
      const doc = new jsPDF();

      const primary: [number, number, number] = [1, 77, 111];
      const gold: [number, number, number] = [190, 155, 123];
      const gray: [number, number, number] = [100, 100, 100];
      const lightBg: [number, number, number] = [248, 246, 243];
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentW = pageW - margin * 2;

      // Helper to load image as base64
      const loadImageBase64 = (url: string): Promise<string | null> => {
        return new Promise(resolve => {
          if (!url) return resolve(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = 120;
              canvas.height = 120;
              const ctx = canvas.getContext('2d');
              if (!ctx) return resolve(null);
              // Cover-fit
              const s = Math.min(img.width, img.height);
              const sx = (img.width - s) / 2;
              const sy = (img.height - s) / 2;
              ctx.drawImage(img, sx, sy, s, s, 0, 0, 120, 120);
              resolve(canvas.toDataURL('image/jpeg', 0.75));
            } catch { resolve(null); }
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      // Pre-load all product images
      const imagePromises = items.map(item => {
        const url = buildProductImageUrl(item.imagen_url, item.imagen) || '';
        return loadImageBase64(url);
      });
      const loadedImages = await Promise.all(imagePromises);

      // ══════ HEADER ══════
      try {
        doc.addImage(logoImg, "PNG", margin, 12, 30, 8);
      } catch {
        doc.setFontSize(20); doc.setTextColor(...primary);
        doc.text("BERLIOZ", margin, 18);
      }

      doc.setFontSize(9); doc.setTextColor(...gray);
      doc.text("L'art de recevoir — Cotización Gourmet", margin, 27);

      // Gold accent line
      doc.setDrawColor(...gold); doc.setLineWidth(0.8);
      doc.line(margin, 31, pageW - margin, 31);

      // ══════ CLIENT INFO (2-col) ══════
      let y = 40;
      doc.setFontSize(8); doc.setTextColor(...primary); doc.setFont("helvetica", "bold");
      doc.text("RECEPTOR", margin, y);
      doc.text("DETALLES LOGÍSTICOS", 110, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
      y += 5;
      doc.text(`Atención: ${clientName || "—"}`, margin, y);
      doc.text(`ID: ${quoteId}`, 110, y);
      y += 4.5;
      doc.text(`Empresa: ${empresa || "—"}`, margin, y);
      doc.text(`Fecha: ${date ? format(date, "d/MM/yyyy") : "—"}`, 110, y);
      y += 4.5;
      doc.text(`Evento: ${eventLabel}`, margin, y);
      doc.text(`Entrega: ${deliveryTime || "—"}`, 110, y);
      y += 4.5;
      doc.text(`CP: ${postalCode || "—"}`, margin, y);
      doc.text(`Personas: ${people} · Duración: ${duration || "—"}`, 110, y);

      // ══════ TIER BADGE ══════
      y += 10;
      doc.setFillColor(...primary);
      doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F');
      doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
      doc.text(`Paquete ${tierInfo?.title || tier}`, margin + 6, y + 8);
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(tierInfo?.subtitle || '', pageW - margin - 4, y + 8, { align: 'right' });

      // ══════ PRODUCT CARDS (with images) ══════
      y += 18;
      const cardH = 22;
      const imgSize = 16;
      const cardPad = 3;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lineTotal = item.unitPrice * item.qty;

        // Check page break
        if (y + cardH + 4 > 270) {
          doc.addPage();
          y = 20;
        }

        // Alternating row background
        if (i % 2 === 0) {
          doc.setFillColor(...lightBg);
          doc.roundedRect(margin, y - 1, contentW, cardH, 1.5, 1.5, 'F');
        }

        // Product thumbnail
        const imgData = loadedImages[i];
        const imgX = margin + cardPad;
        const imgY = y + (cardH - imgSize) / 2;
        if (imgData) {
          try {
            doc.addImage(imgData, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            // Draw placeholder
            doc.setFillColor(230, 230, 230);
            doc.roundedRect(imgX, imgY, imgSize, imgSize, 1, 1, 'F');
          }
        } else {
          doc.setFillColor(230, 230, 230);
          doc.roundedRect(imgX, imgY, imgSize, imgSize, 1, 1, 'F');
          doc.setFontSize(6); doc.setTextColor(180, 180, 180);
          doc.text('📷', imgX + 5, imgY + 9);
        }

        // Product name
        const textX = imgX + imgSize + 4;
        doc.setFontSize(9); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
        doc.text(item.productName, textX, y + 8);

        // Recommendation reason (small)
        if (item.recommendationReason) {
          doc.setFontSize(6); doc.setTextColor(...gray); doc.setFont("helvetica", "italic");
          const reason = item.recommendationReason.length > 60
            ? item.recommendationReason.slice(0, 57) + '...'
            : item.recommendationReason;
          doc.text(`💡 ${reason}`, textX, y + 13);
        }

        // Qty + price (right-aligned)
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...gray);
        doc.text(`${item.qty} × ${formatMXN(item.unitPrice)}`, pageW - margin - 40, y + 8);
        doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
        doc.text(formatMXN(lineTotal), pageW - margin - 2, y + 8, { align: 'right' });

        y += cardH + 2;
      }

      // ══════ TOTALS BOX ══════
      if (y + 50 > 270) { doc.addPage(); y = 20; }
      y += 4;
      doc.setDrawColor(...gold); doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      const totalsX = 140;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...gray);
      doc.text("Subtotal:", totalsX, y); doc.text(formatMXN(t.subtotal), pageW - margin, y, { align: 'right' });
      y += 5;
      doc.text("Logística y Envío:", totalsX, y); doc.text(formatMXN(t.shipping + t.early), pageW - margin, y, { align: 'right' });
      y += 5;
      doc.text("IVA (16%):", totalsX, y); doc.text(formatMXN(t.iva), pageW - margin, y, { align: 'right' });
      y += 7;

      // Grand total highlight
      doc.setFillColor(...primary);
      doc.roundedRect(totalsX - 4, y - 5, pageW - margin - totalsX + 8, 12, 2, 2, 'F');
      doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
      doc.text("TOTAL:", totalsX, y + 3);
      doc.text(formatMXN(t.total), pageW - margin, y + 3, { align: 'right' });

      // Per person
      y += 14;
      doc.setFontSize(8); doc.setTextColor(...gray); doc.setFont("helvetica", "normal");
      doc.text(`${formatMXN(Math.round(t.total / Math.max(1, people)))}/persona`, pageW - margin, y, { align: 'right' });

      // ══════ FOOTER NOTES ══════
      y += 8;
      if (y + 40 > 270) { doc.addPage(); y = 20; }
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...primary);
      doc.text("NOTAS IMPORTANTES", margin, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...gray);
      y += 4;
      QUOTE_FOOTER_NOTES.slice(0, 8).forEach(note => {
        doc.text(`• ${note}`, margin, y);
        y += 3.5;
      });

      // ══════ BRAND FOOTER ══════
      const footerY = doc.internal.pageSize.getHeight() - 12;
      doc.setDrawColor(...gold); doc.setLineWidth(0.5);
      doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
      doc.setFontSize(8); doc.setTextColor(...primary); doc.setFont("helvetica", "bold");
      doc.text("Anne Seguy | hola@berlioz.mx | 55 8237 5469", margin, footerY);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...gray);
      doc.text(`Válida hasta: ${format(validUntil, "dd/MM/yyyy")} | ID: ${quoteId}`, margin, footerY + 4);

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
    setSidebarCategory('Favoritos');
    setSidebarOpen(true);
  };

  const openSwapSidebar = (tier: PackageTier, instanceId: string) => {
    setSidebarTarget(tier);
    setSwapTarget({ tier, instanceId });
    setSidebarCategory('Favoritos');
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

        {/* Loading overlay while Claude AI composes */}
        {smartQuoteLoading && !hasReceivedSmartData && (
          <div className="mb-12 flex flex-col items-center justify-center gap-4 py-16">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
            </div>
            <p className="font-heading text-lg font-bold text-foreground">Componiendo tu propuesta con IA...</p>
            <p className="font-body text-sm text-muted-foreground italic">Claude AI está seleccionando los mejores productos del catálogo para tu evento</p>
          </div>
        )}

        {/* ═══ THREE PROPOSAL ROWS — HORIZONTAL LAYOUT ═══ */}
        <div className={cn("flex flex-col gap-6 mb-20 transition-opacity duration-500", smartQuoteLoading && !hasReceivedSmartData ? "opacity-40 pointer-events-none" : "opacity-100")}>
          {TIERS.map((tier) => {
            const pkg = packages[tier.id];
            const t = tierTotals[tier.id];
            const isSelected = selectedTier === tier.id;
            const isRecommended = tier.isPopular;

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative bg-white rounded-2xl p-6 transition-all duration-200",
                  isSelected
                    ? "border-2 border-[#014D6F] shadow-[0_8px_30px_rgba(1,77,111,0.18)] bg-[#014D6F]/[0.02]"
                    : isRecommended
                      ? "border-[1.5px] border-[#014D6F] shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                      : "border border-transparent shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
                )}
              >
                {isSelected && (
                  <span className="absolute -top-3 right-6 z-10 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#014D6F] text-[#EDD9C8] font-heading text-[10px] font-bold uppercase tracking-[0.12em] shadow-md">
                    ✓ Paquete seleccionado
                  </span>
                )}
                {/* ═══ ZONA A — Identificación (top bar horizontal) ═══ */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-5 border-b border-[#CEC1B9]/40">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                      <h3 className="font-heading text-xl font-bold uppercase text-[#014D6F] leading-tight">
                        {tier.title}
                      </h3>
                      <p className="font-body text-xs text-[#777] leading-snug">
                        {pkg.tagline || tier.subtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectTier(tier.id)}
                    className={cn(
                      "shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-full font-heading text-[11px] font-bold uppercase tracking-wider transition-all",
                      isSelected || isRecommended
                        ? "bg-[#014D6F] text-[#EDD9C8] hover:opacity-90"
                        : "bg-white border border-[#014D6F] text-[#014D6F] hover:bg-[#014D6F]/5",
                    )}
                  >
                    {isSelected ? "✓ Seleccionado" : "Elegir este →"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-stretch">
                  {/* ═══ ZONA B — Carrusel horizontal de cards ═══ */}
                  <TierCarousel
                    tier={tier}
                    pkg={{ ...pkg, items: pkg.items.map(enrichItem) }}
                    updateItemQty={updateItemQty}
                    removeItem={removeItem}
                    openSwapSidebar={openSwapSidebar}
                    openSidebar={openSidebar}
                  />

                  {/* ═══ ZONA C — Desglose de precios (integrado) ═══ */}
                  <div className="flex flex-col lg:border-l lg:border-[#CEC1B9]/40 lg:pl-6 pt-2 lg:pt-0">
                    <p className="font-heading text-[10px] font-bold uppercase tracking-[0.15em] text-[#777] mb-3">
                      Desglose
                    </p>
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-baseline gap-3">
                        <span className="font-body text-xs text-[#777]">Subtotal</span>
                        <span className="font-mono text-xs text-[#014D6F] whitespace-nowrap">{formatMXN(t.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-baseline gap-3">
                        <span className="font-body text-xs text-[#777]">Envío</span>
                        <span className="font-mono text-xs text-[#014D6F] whitespace-nowrap">{formatMXN(t.shipping + t.early)}</span>
                      </div>
                      <div className="flex justify-between items-baseline gap-3">
                        <span className="font-body text-xs text-[#777]">IVA 16%</span>
                        <span className="font-mono text-xs text-[#014D6F] whitespace-nowrap">{formatMXN(t.iva)}</span>
                      </div>
                    </div>
                    <hr className="my-3 border-[#CEC1B9]/40" />
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="font-heading text-xs font-bold uppercase text-[#014D6F]">Total</span>
                      <span className="font-heading text-lg font-bold text-[#014D6F] whitespace-nowrap">{formatMXN(t.total)}</span>
                    </div>
                    <p className="font-body text-[10px] text-[#777] text-right mt-1">
                      {formatMXN(t.total / Math.max(1, people))} / persona
                    </p>
                  </div>
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
          <div className="fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-card border-l border-border z-50 flex flex-col shadow-2xl animate-slide-up">
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
              {QUOTER_SIDEBAR_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSidebarCategory(cat)}
                  className={cn("px-3 py-1 rounded-full font-body text-xs font-medium whitespace-nowrap transition-all border",
                    sidebarCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                  )}>{cat === 'Favoritos' ? '★ Favoritos' : cat}</button>
              ))}
            </div>

            {/* Products */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sidebarProducts.map(product => (
                <SidebarProductCard
                  key={product.id}
                  product={product}
                  isSwap={!!swapTarget}
                  onSelect={() => {
                    if (swapTarget) {
                      swapItem(swapTarget.tier, swapTarget.instanceId, product);
                    } else {
                      addProductToTier(sidebarTarget, product);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══ Sidebar product row with image + description ═══
function SidebarProductCard({
  product,
  isSwap,
  onSelect,
}: {
  product: CatalogProduct & { imagen_url?: string | null; categoriaDB?: string | null };
  isSwap: boolean;
  onSelect: () => void;
}) {
  const fallback = getCategoryFallback(product.categoriaDB || product.sidebarCategory);
  const initial = product.imagen_url || fallback;

  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        <img
          src={initial}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== fallback) img.src = fallback;
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-foreground leading-snug flex items-start gap-1">
            {product.isBestseller && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />}
            <span className="line-clamp-2">{product.name}</span>
          </p>
          {product.description && (
            <p className="font-body text-xs text-muted-foreground leading-snug line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 gap-2">
          <p className="font-mono text-xs font-semibold text-[#014D6F]">{formatMXN(product.price)}</p>
          <Button size="sm" variant={isSwap ? "outline" : "default"} className="shrink-0 text-xs h-7 px-3" onClick={onSelect}>
            {isSwap ? "Cambiar" : "+ Agregar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
