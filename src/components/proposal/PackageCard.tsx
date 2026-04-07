import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ProductCollage } from "@/components/ProductCollage";
import type { Package, PackageItem } from "@/domain/entities/Proposal";
import { formatMXN } from "@/domain/value-objects/Money";
import { EARLY_DELIVERY_SURCHARGE } from "@/domain/shared/BusinessRules";
import { calculateIVA, roundCents } from "@/domain/value-objects/Money";
import { getProductImage } from "@/domain/entities/ProductImages";
import { toast } from "sonner";
import { SWAP_MAP, getCrossSells, ESENCIAL_BEVERAGE_NUDGE, type CrossSellChip } from "@/domain/entities/CrossSellData";
import { MENU_CATALOG } from "@/domain/entities/MenuCatalog";
import ProductBrowsePanel from "@/components/proposal/ProductBrowsePanel";

// Hero image mapping
const HERO_PRODUCT_CODES: Record<string, string[]> = {
  basico: ['desayuno_berlioz', 'cb_pm', 'mini_box', 'comedor', 'breakfast_bag', 'lunch_bag', 'box_eco_1'],
  recomendado: ['breakfast_roma', 'cb_am_cafe', 'golden_box', 'black_box', 'pink_box', 'lunch_bag'],
  premium: ['breakfast_montreal', 'salmon_box', 'pink_box', 'surtido_camille', 'orzo_pasta_salad_box', 'green_box'],
};

function getHeroImage(pkg: Package): string {
  const tierCodes = HERO_PRODUCT_CODES[pkg.id] || [];
  for (const code of tierCodes) {
    const item = pkg.items.find(i => i.code === code || i.code.includes(code));
    if (item) return getProductImage(item.code);
  }
  const main = [...pkg.items].sort((a, b) => b.subtotal - a.subtotal)[0];
  return main ? getProductImage(main.code) : getProductImage('fallback');
}

interface PackageCardProps {
  pkg: Package;
  isRecommended: boolean;
  onSelect: () => void;
  earlyDeliverySurcharge?: boolean;
  volumeSurcharge?: boolean;
  people: number;
  onItemsChange?: (pkgId: string, items: PackageItem[]) => void;
}

const PackageCard = ({ pkg, isRecommended, onSelect, earlyDeliverySurcharge, volumeSurcharge, people, onItemsChange }: PackageCardProps) => {
  const [localItems, setLocalItems] = useState<PackageItem[]>(pkg.items);
  const [isModified, setIsModified] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [swapOpenIdx, setSwapOpenIdx] = useState<number | null>(null);
  const [crossSellIdx, setCrossSellIdx] = useState<number | null>(null);
  const [priceAnimating, setPriceAnimating] = useState(false);

  // Recalculate totals
  const itemsSubtotal = localItems.reduce((s, i) => s + i.subtotal, 0);
  const totalSubtotal = itemsSubtotal + pkg.deliveryFee;
  const totalIVA = calculateIVA(totalSubtotal);
  const totalAmount = roundCents(totalSubtotal + totalIVA);
  const pricePerPerson = roundCents(totalAmount / Math.max(1, people));

  const heroImage = getHeroImage(pkg);

  // Notify parent of changes
  useEffect(() => {
    onItemsChange?.(pkg.id, localItems);
  }, [localItems]);

  const animatePrice = useCallback(() => {
    setPriceAnimating(true);
    setTimeout(() => setPriceAnimating(false), 300);
  }, []);

  const updateItems = useCallback((newItems: PackageItem[]) => {
    setLocalItems(newItems);
    setIsModified(true);
    animatePrice();
  }, [animatePrice]);

  const updateItemQty = (idx: number, delta: number) => {
    const updated = [...localItems];
    const item = { ...updated[idx] };
    const newQty = Math.max(1, item.totalQty + delta);
    item.totalQty = newQty;
    item.subtotal = item.unitPrice * newQty;
    updated[idx] = item;
    updateItems(updated);
  };

  const removeItem = (idx: number) => {
    if (localItems.length <= 1) return;
    const removedItem = localItems[idx];
    const updated = localItems.filter((_, i) => i !== idx);
    updateItems(updated);

    // Check if removing the only beverage
    const beverageCodes = ['cafe_te_berlioz', 'cafe_frio', 'jugo_naranja', 'agua_bui_natural', 'agua_bui_mineral', 'agua_jamaica', 'agua_limon'];
    if (beverageCodes.includes(removedItem.code)) {
      const hasBevLeft = updated.some(i => beverageCodes.includes(i.code));
      if (!hasBevLeft) {
        toast('Sin bebidas en este paquete — ¿agregar agua? +$45/pza', { duration: 5000 });
      }
    }
  };

  const handleSwap = (idx: number, newCode: string) => {
    const catalogItem = MENU_CATALOG.find(m => m.id === newCode);
    if (!catalogItem) return;
    const old = localItems[idx];
    const unitPrice = catalogItem.pricePerPerson || 0;
    const updated = [...localItems];
    updated[idx] = {
      code: catalogItem.id,
      name: catalogItem.name,
      unitPrice,
      qtyPerPerson: 1,
      totalQty: old.totalQty,
      subtotal: unitPrice * old.totalQty,
    };
    updateItems(updated);
    setSwapOpenIdx(null);
  };

  const addCrossSell = (chip: CrossSellChip) => {
    const qty = chip.isFixed ? 1 : people;
    const newItem: PackageItem = {
      code: chip.code,
      name: chip.name,
      unitPrice: chip.unitPrice,
      qtyPerPerson: chip.isFixed ? 0 : 1,
      totalQty: qty,
      subtotal: chip.unitPrice * qty,
    };
    updateItems([...localItems, newItem]);
    setCrossSellIdx(null);
    toast.success(`${chip.name} agregado`);
  };

  const addFromBrowse = (menuItem: typeof MENU_CATALOG[0]) => {
    // Check if already exists
    const existingIdx = localItems.findIndex(i => i.code === menuItem.id);
    if (existingIdx >= 0) {
      updateItemQty(existingIdx, 1);
      toast.success(`+1 ${menuItem.name}`);
      return;
    }
    const isPerPerson = menuItem.pricingModel === 'per_person';
    const qty = isPerPerson ? people : 1;
    const unitPrice = menuItem.pricePerPerson || 0;
    const newItem: PackageItem = {
      code: menuItem.id,
      name: menuItem.name,
      unitPrice,
      qtyPerPerson: isPerPerson ? 1 : 0,
      totalQty: qty,
      subtotal: unitPrice * qty,
    };
    updateItems([...localItems, newItem]);
    toast.success(`${menuItem.name} agregado`);
  };

  const resetToOriginal = () => {
    setLocalItems(pkg.items);
    setIsModified(false);
    animatePrice();
  };

  const existingCodes = localItems.map(i => i.code);

  return (
    <>
      <div
        className={cn(
          "proposal-card rounded-xl border bg-card flex flex-col transition-all relative overflow-hidden",
          isRecommended
            ? "border-t-4 border-t-primary border-primary/30 shadow-lg scale-[1.02] z-10"
            : "border-border shadow-sm",
        )}
      >
        {isRecommended && (
          <span className="absolute -top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-b-full z-20">
            ⭐ Más popular
          </span>
        )}

        {isModified && (
          <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] font-medium px-2 py-0.5 rounded-full z-20">
            ✏️ Modificado
          </span>
        )}

        {/* Product collage */}
        <ProductCollage
          imageUrls={localItems.slice(0, 3).map(item => getProductImage(item.code))}
          tier={pkg.id === 'basico' ? 'Esencial' : pkg.id === 'recomendado' ? 'Equilibrado' : 'Experiencia Completa'}
        />

        {/* Hero product image */}
        <div className="relative w-full overflow-hidden" style={{ height: 0 }}>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {/* Total price — GRAND total including IVA */}
          <div className="mb-1">
            <span className={cn(
              "font-mono text-3xl font-bold text-foreground transition-transform inline-block",
              priceAnimating && "scale-110",
            )}>
              {formatMXN(totalAmount)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Para <span className="font-semibold text-foreground">{people} personas</span>
            <span className="text-xs ml-1">· {formatMXN(pricePerPerson)}/persona</span>
          </p>
          <p className="text-[11px] text-muted-foreground mb-3">IVA y envío incluidos</p>

          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{pkg.narrative}</p>

          {/* Esencial nudge */}
          {pkg.id === 'basico' && !localItems.some(i => ['cafe_te_berlioz', 'cafe_frio', 'agua_bui_natural', 'agua_jamaica'].includes(i.code)) && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-xs text-foreground">
              💡 {ESENCIAL_BEVERAGE_NUDGE}
            </div>
          )}

          <ul className="space-y-1.5 mb-3">
            {pkg.highlights.map((h, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-success mt-0.5">✓</span>{h}
              </li>
            ))}
          </ul>

          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setEditOpen(!editOpen)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {editOpen ? '▲ Cerrar selección' : '✏️ Modificar selección'}
            </button>
            <button
              type="button"
              onClick={() => setBrowseOpen(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              🔍 Buscar en menú y agregar
            </button>
          </div>

          {/* Editable items — 2-column grid */}
          {editOpen && (
            <div className="border-t border-border pt-4 mt-auto space-y-3">
              {isModified && (
                <button
                  type="button"
                  onClick={resetToOriginal}
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                >
                  ↺ Restaurar propuesta original
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {localItems.map((item, idx) => {
                  const swapAlts = SWAP_MAP[item.code] || [];
                  const crossSells = getCrossSells(item, existingCodes);

                  return (
                    <div key={`${item.code}-${idx}`} className="rounded-xl border border-border bg-muted/20 overflow-hidden p-3">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {/* 48px thumbnail */}
                        <img
                          src={getProductImage(item.code)}
                          alt={item.name}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div style={{ flex: 1 }}>
                        {/* Name */}
                        <p className="text-sm font-medium text-foreground leading-tight mb-2">{item.name}</p>

                        {/* Qty + price + delete */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => updateItemQty(idx, -1)} className="w-7 h-7 rounded border border-border text-sm flex items-center justify-center hover:bg-muted">−</button>
                            <span className="text-sm font-mono w-8 text-center">{item.totalQty}</span>
                            <button type="button" onClick={() => updateItemQty(idx, 1)} className="w-7 h-7 rounded border border-border text-sm flex items-center justify-center hover:bg-muted">+</button>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatMXN(item.unitPrice)}/u</span>
                          {localItems.length > 1 && (
                            <button type="button" onClick={() => removeItem(idx)} className="text-destructive text-sm hover:bg-destructive/10 w-7 h-7 rounded flex items-center justify-center">🗑</button>
                          )}
                        </div>

                        {/* Swap + Cross-sell buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {swapAlts.length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setSwapOpenIdx(swapOpenIdx === idx ? null : idx)}
                                className="text-[11px] text-primary font-medium hover:underline"
                              >
                                ↕ Cambiar
                              </button>
                              {swapOpenIdx === idx && (
                                <div className="absolute top-6 left-0 z-30 bg-card border border-border rounded-lg shadow-lg p-1.5 min-w-[200px] max-h-[200px] overflow-y-auto">
                                  {swapAlts.map(altCode => {
                                    const cat = MENU_CATALOG.find(m => m.id === altCode);
                                    if (!cat) return null;
                                    return (
                                      <button
                                        key={altCode}
                                        onClick={() => handleSwap(idx, altCode)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                                      >
                                        <img src={getProductImage(altCode)} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
                                          <p className="text-[10px] text-muted-foreground">{cat.pricePerPerson > 0 ? formatMXN(cat.pricePerPerson) : 'Precio grupo'}</p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {crossSells.length > 0 && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setCrossSellIdx(crossSellIdx === idx ? null : idx)}
                                className="text-[11px] text-primary font-medium hover:underline"
                              >
                                📋 También llevan
                              </button>
                              {crossSellIdx === idx && (
                                <div className="absolute top-6 left-0 z-30 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[220px]">
                                  <div className="space-y-1">
                                    {crossSells.map(ch => (
                                      <button
                                        key={ch.code}
                                        onClick={() => addCrossSell(ch)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-xs"
                                      >
                                        <span>{ch.icon}</span>
                                        <span className="flex-1 font-medium text-foreground">{ch.name}</span>
                                        <span className="text-muted-foreground">{ch.price}</span>
                                        <span className="text-primary font-semibold">+</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals breakdown */}
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">Envío</span>
                  <span className="font-mono">{formatMXN(pkg.deliveryFee)}</span>
                </div>
                {earlyDeliverySurcharge && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600">Cargo entrega temprana</span>
                    <span className="font-mono text-amber-600">{formatMXN(EARLY_DELIVERY_SURCHARGE)}</span>
                  </div>
                )}
                {volumeSurcharge && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600">Cargo logístico 80+ pzas</span>
                    <span className="font-mono text-muted-foreground">Por confirmar</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatMXN(totalSubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span className="font-mono">{formatMXN(totalIVA)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span>Total</span>
                  <span className="font-mono">{formatMXN(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onSelect}
            className={cn(
              "mt-4 w-full py-3 rounded-lg font-body font-semibold text-sm transition-all",
              isRecommended
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-primary text-primary hover:bg-primary/5",
            )}
          >
            Seleccionar este paquete
          </button>
        </div>
      </div>

      {/* Browse panel */}
      {browseOpen && (
        <ProductBrowsePanel
          packageName={pkg.displayName}
          onClose={() => setBrowseOpen(false)}
          onAdd={addFromBrowse}
        />
      )}
    </>
  );
};

export default PackageCard;
