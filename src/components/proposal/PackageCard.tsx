import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Package } from "@/domain/entities/Proposal";
import { formatMXN } from "@/domain/value-objects/Money";
import { PRICE_DISCLAIMER, EARLY_DELIVERY_SURCHARGE } from "@/domain/shared/BusinessRules";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PackageCardProps {
  pkg: Package;
  isRecommended: boolean;
  onSelect: () => void;
  earlyDeliverySurcharge?: boolean;
  volumeSurcharge?: boolean;
}

const PackageCard = ({ pkg, isRecommended, onSelect, earlyDeliverySurcharge, volumeSurcharge }: PackageCardProps) => {
  const [open, setOpen] = useState(false);

  // Find the main food item (highest subtotal) to show per-person price
  const mainItem = [...pkg.items].sort((a, b) => b.subtotal - a.subtotal)[0];
  const perPersonPrice = mainItem ? mainItem.unitPrice : pkg.pricePerPerson;

  return (
    <div
      className={cn(
        "proposal-card rounded-xl border bg-card p-6 flex flex-col transition-all relative",
        isRecommended
          ? "border-t-4 border-t-primary border-primary/30 shadow-lg scale-[1.02] z-10"
          : "border-border shadow-sm",
      )}
    >
      {isRecommended && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
          ⭐ Más popular
        </span>
      )}

      <h3 className="font-heading text-xl font-semibold text-foreground mt-2">{pkg.displayName}</h3>
      <p className="text-sm text-accent font-medium mb-3">{pkg.tagline}</p>

      {/* Prominent per-person price */}
      <div className="mb-4">
        <span className="font-mono text-3xl font-bold text-foreground">{formatMXN(perPersonPrice)}</span>
        <span className="text-sm text-muted-foreground ml-1">/ persona</span>
      </div>

      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{pkg.narrative}</p>

      <ul className="space-y-1.5 mb-4">
        {pkg.highlights.map((h, i) => (
          <li key={i} className="text-sm text-foreground flex items-start gap-2">
            <span className="text-success mt-0.5">✓</span>
            {h}
          </li>
        ))}
      </ul>

      {/* Collapsible breakdown */}
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
          {earlyDeliverySurcharge && (
            <div className="flex justify-between text-xs py-1">
              <span className="text-amber-600">Cargo entrega temprana</span>
              <span className="font-mono text-amber-600">{formatMXN(EARLY_DELIVERY_SURCHARGE)}</span>
            </div>
          )}
          {volumeSurcharge && (
            <div className="flex justify-between text-xs py-1">
              <span className="text-amber-600">Cargo logístico 80+ pzas</span>
              <span className="font-mono text-muted-foreground">Por confirmar</span>
            </div>
          )}
          <div className="border-t border-border mt-2 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatMXN(pkg.subtotalBeforeIVA)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">IVA (16%)</span>
              <span className="font-mono">{formatMXN(pkg.iva)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold mt-1">
              <span>Total</span>
              <span className="font-mono">{formatMXN(pkg.total)}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Price disclaimer */}
      <p className="mt-3 text-[11px] italic leading-snug" style={{ color: '#888880' }}>
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
  );
};

export default PackageCard;
