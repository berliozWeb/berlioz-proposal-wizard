import { useState } from "react";
import { ADDONS, CARRITO_SNACKS_ADDON, type Addon } from "@/domain/entities/Addon";
import {
  LOGO_PRICE_PER_BOX, SNACK_CART_MIN_PIECES,
  STAFF_PRICE_SHORT, STAFF_PRICE_LONG, getStaffRate,
  PRICE_DISCLAIMER,
} from "@/domain/shared/BusinessRules";
import { formatMXN } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";

interface AddonsBarProps {
  selected: string[];
  onToggle: (id: string) => void;
  personas: number;
  /** Callback to report extra cost from interactive addons */
  onExtraCostChange?: (cost: number) => void;
}

const AddonsBar = ({ selected, onToggle, personas, onExtraCostChange }: AddonsBarProps) => {
  const [staffCount, setStaffCount] = useState(1);
  const [staffHours, setStaffHours] = useState<'short' | 'long'>('short');

  const showCarritoSnacks = personas >= SNACK_CART_MIN_PIECES;
  const allAddons: Addon[] = [
    ...ADDONS,
    ...(showCarritoSnacks ? [CARRITO_SNACKS_ADDON] : []),
  ];

  // Calculate interactive addon costs
  const logoSelected = selected.includes('logo_caja');
  const logoCost = logoSelected ? LOGO_PRICE_PER_BOX * personas : 0;

  const staffSelected = selected.includes('personal_servicio');
  const staffRate = staffHours === 'short' ? STAFF_PRICE_SHORT : STAFF_PRICE_LONG;
  const staffCost = staffSelected ? staffCount * staffRate : 0;

  const totalExtraCost = logoCost + staffCost;

  // Report cost changes
  if (onExtraCostChange) {
    // We call this during render — it's fine as long as parent memoizes
    onExtraCostChange(totalExtraCost);
  }

  return (
    <div className="border-t border-border pt-8 mt-8">
      <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
        Personaliza tu pedido
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Selecciona los extras que quieras agregar
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allAddons.map((addon) => {
          const isSelected = selected.includes(addon.id);
          const addonTotal = addon.pricePerPerson ? addon.pricePerPerson * personas : null;

          return (
            <div key={addon.id}>
              <button
                type="button"
                onClick={() => onToggle(addon.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-foreground text-sm">{addon.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{addon.subtitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-mono font-medium text-gold">{addon.priceLabel}</span>
                    {addonTotal !== null && addonTotal > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatMXN(addonTotal)} total
                      </p>
                    )}
                    <div className={cn(
                      "mt-1.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ml-auto",
                      isSelected ? "border-primary bg-primary" : "border-border",
                    )}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Rule 4C: Logo calculation */}
              {addon.id === 'logo_caja' && isSelected && (
                <div className="mt-2 px-4 py-2 bg-muted rounded-lg text-xs text-foreground font-mono">
                  Logo en caja: ${LOGO_PRICE_PER_BOX} × {personas} cajas = {formatMXN(logoCost)}
                </div>
              )}

              {/* Rule 5: Staff interactive section */}
              {addon.id === 'personal_servicio' && isSelected && (
                <div className="mt-2 px-4 py-3 bg-muted rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Duración del servicio
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStaffHours('short')}
                        className={cn(
                          "flex-1 py-2 rounded-md border text-xs font-medium transition-all",
                          staffHours === 'short'
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        1–4h · {formatMXN(STAFF_PRICE_SHORT)}/persona
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffHours('long')}
                        className={cn(
                          "flex-1 py-2 rounded-md border text-xs font-medium transition-all",
                          staffHours === 'long'
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        4–8h · {formatMXN(STAFF_PRICE_LONG)}/persona
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      ¿Cuántas personas de servicio?
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={staffCount}
                      onChange={(e) => setStaffCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 h-8 px-3 rounded-md border border-input bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {staffCount} persona{staffCount > 1 ? 's' : ''} × {formatMXN(staffRate)} = <span className="font-semibold">{formatMXN(staffCost)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Duration > 3h upsell card */}
      <div className="mt-6 px-4 py-3 rounded-lg border border-accent/30 bg-accent/5">
        <p className="text-sm text-foreground font-medium">
          💡 ¿Quieres agregar bebidas y snacks para antes o después de la comida?
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Complementa tu paquete principal con café, aguas frescas o snack bags.
        </p>
      </div>

      {/* Price disclaimer */}
      <p className="mt-4 text-xs text-muted-foreground italic">
        {PRICE_DISCLAIMER}
      </p>
    </div>
  );
};

export default AddonsBar;
