import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Package, PackageItem } from "@/domain/entities/Proposal";
import { formatMXN } from "@/domain/value-objects/Money";
import { PRICE_DISCLAIMER, EARLY_DELIVERY_SURCHARGE } from "@/domain/shared/BusinessRules";
import { calculateIVA, roundCents } from "@/domain/value-objects/Money";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getProductImage } from "@/domain/entities/ProductImages";
import { toast } from "sonner";

// Hero image mapping: pick the most visual product per tier
const HERO_PRODUCT_CODES: Record<string, string[]> = {
  basico: ['desayuno_berlioz', 'cb_pm', 'mini_box', 'comedor', 'breakfast_bag', 'lunch_bag', 'box_eco_1'],
  recomendado: ['breakfast_roma', 'cb_am_cafe', 'golden_box', 'black_box', 'pink_box', 'lunch_bag'],
  premium: ['breakfast_montreal', 'salmon_box', 'pink_box', 'surtido_camille', 'orzo_pasta_salad_box', 'green_box'],
};

function getHeroImage(pkg: Package): string {
  // Try finding a hero product from the tier mapping
  const tierCodes = HERO_PRODUCT_CODES[pkg.id] || [];
  for (const code of tierCodes) {
    const item = pkg.items.find(i => i.code === code || i.code.includes(code));
    if (item) return getProductImage(item.code);
  }
  // Fallback: use the most expensive item
  const main = [...pkg.items].sort((a, b) => b.subtotal - a.subtotal)[0];
  return main ? getProductImage(main.code) : getProductImage('fallback');
}

interface PackageCardProps {
  pkg: Package;
  isRecommended: boolean;
  onSelect: () => void;
  earlyDeliverySurcharge?: boolean;
  volumeSurcharge?: boolean;
  editable?: boolean;
}

const PackageCard = ({ pkg, isRecommended, onSelect, earlyDeliverySurcharge, volumeSurcharge, editable = true }: PackageCardProps) => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [localItems, setLocalItems] = useState<PackageItem[]>(pkg.items);

  // Recalculate totals from local items
  const itemsSubtotal = localItems.reduce((s, i) => s + i.subtotal, 0);
  const totalSubtotal = itemsSubtotal + pkg.deliveryFee;
  const totalIVA = calculateIVA(totalSubtotal);
  const totalAmount = roundCents(totalSubtotal + totalIVA);
  const people = Math.max(1, localItems[0]?.totalQty || 1);
  const perPersonPrice = roundCents(totalAmount / people);

  const heroImage = getHeroImage(pkg);

  const updateItemQty = (idx: number, delta: number) => {
    setLocalItems(prev => {
      const updated = [...prev];
      const item = { ...updated[idx] };
      const newQty = Math.max(1, item.totalQty + delta);
      item.totalQty = newQty;
      item.subtotal = item.unitPrice * newQty;
      updated[idx] = item;

      // Toast for adding beverages to Esencial
      if (delta > 0 && pkg.id === 'basico' && (item.code.includes('agua') || item.code.includes('cafe'))) {
        toast.success('¡Buena elección! Las bebidas son lo más popular');
      }

      return updated;
    });
  };

  const removeItem = (idx: number) => {
    if (localItems.length <= 1) return;
    setLocalItems(prev => prev.filter((_, i) => i !== idx));
  };

  return (
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

      {/* Hero product image */}
      <div className="relative w-full overflow-hidden" style={{ height: 180 }}>
        <img
          src={heroImage}
          alt={pkg.displayName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-heading text-xl font-semibold text-white drop-shadow-lg">{pkg.displayName}</h3>
          <p className="text-xs text-white/80">{pkg.tagline}</p>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Prominent per-person price */}
        <div className="mb-3">
          <span className="font-mono text-3xl font-bold text-foreground">{formatMXN(perPersonPrice)}</span>
          <span className="text-sm text-muted-foreground ml-1">/ persona</span>
        </div>

        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{pkg.narrative}</p>

        <ul className="space-y-1.5 mb-3">
          {pkg.highlights.map((h, i) => (
            <li key={i} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-success mt-0.5">✓</span>
              {h}
            </li>
          ))}
        </ul>

        {/* Editable items section */}
        {editable && (
          <Collapsible open={editOpen} onOpenChange={setEditOpen} className="border-t border-border pt-3 mt-auto">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1">
              <span>✏️ Personalizar selección</span>
              <span className={cn("transition-transform", editOpen && "rotate-180")}>▾</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {localItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1.5">
                  <img
                    src={getProductImage(item.code)}
                    alt={item.name}
                    className="w-10 h-10 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatMXN(item.unitPrice)}/u</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateItemQty(idx, -1)}
                      className="w-6 h-6 rounded border border-border text-xs flex items-center justify-center hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="text-xs font-mono w-6 text-center">{item.totalQty}</span>
                    <button
                      type="button"
                      onClick={() => updateItemQty(idx, 1)}
                      className="w-6 h-6 rounded border border-border text-xs flex items-center justify-center hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-mono text-foreground w-16 text-right shrink-0">{formatMXN(item.subtotal)}</span>
                  {localItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-muted-foreground hover:text-destructive text-xs shrink-0"
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}

              {/* Totals */}
              <div className="border-t border-border pt-2 mt-2 space-y-1">
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
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Static breakdown (non-editable fallback) */}
        {!editable && (
          <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border pt-3 mt-auto">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
              <span>Ver desglose completo</span>
              <span className={cn("transition-transform", open && "rotate-180")}>▾</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wide">Desglose</p>
              {pkg.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className="text-foreground">{item.name} <span className="text-muted-foreground">×{item.totalQty}</span></span>
                  <span className="font-mono text-foreground">{formatMXN(item.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs py-1">
                <span className="text-foreground">Envío</span>
                <span className="font-mono text-foreground">{formatMXN(pkg.deliveryFee)}</span>
              </div>
              <div className="border-t border-border mt-2 pt-2">
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span>Total</span>
                  <span className="font-mono">{formatMXN(pkg.total)}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Price disclaimer */}
        <p className="mt-3 text-[11px] italic leading-snug text-muted-foreground">
          {PRICE_DISCLAIMER}
        </p>

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
  );
};

export default PackageCard;
