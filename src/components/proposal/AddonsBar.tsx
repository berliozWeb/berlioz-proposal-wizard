import { useState } from "react";
import { ADDONS, LOGO_TIERS, STAFF_TIERS, type Addon } from "@/domain/entities/Addon";
import { PRICE_DISCLAIMER } from "@/domain/shared/BusinessRules";
import { formatMXN } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";

interface AddonsBarProps {
  selected: string[];
  onToggle: (id: string) => void;
  personas: number;
  onExtraCostChange?: (cost: number) => void;
}

const AddonsBar = ({ selected, onToggle, personas, onExtraCostChange }: AddonsBarProps) => {
  const [staffCount, setStaffCount] = useState(1);
  const [staffTier, setStaffTier] = useState<string>('4h');
  const [logoTier, setLogoTier] = useState<string>('sticker');
  const [cafeCount, setCafeCount] = useState(1);
  const [snackCount, setSnackCount] = useState(1);

  const selectedLogo = LOGO_TIERS.find(t => t.id === logoTier) || LOGO_TIERS[0];
  const selectedStaff = STAFF_TIERS.find(t => t.id === staffTier) || STAFF_TIERS[1];

  const logoSelected = selected.includes('logo_caja');
  const logoCost = logoSelected ? selectedLogo.pricePerPiece * personas : 0;

  const staffSelected = selected.includes('personal_servicio');
  const staffCost = staffSelected ? staffCount * selectedStaff.price : 0;

  const cafeSelected = selected.includes('cafe_te_berlioz');
  const cafeCost = cafeSelected ? 540 * cafeCount : 0;

  const snackSelected = selected.includes('surtido_snacks');
  const snackCost = snackSelected ? 300 * snackCount : 0;

  const snackBagSelected = selected.includes('snack_bag');
  const snackBagCost = snackBagSelected ? 140 * personas : 0;

  const aguasSelected = selected.includes('aguas_frescas');
  const aguasCost = aguasSelected ? 45 * personas : 0;

  const stickerSelected = selected.includes('sticker');
  const stickerCost = stickerSelected ? 10 * personas : 0;

  const totalExtraCost = logoCost + staffCost + cafeCost + snackCost + snackBagCost + aguasCost + stickerCost;

  if (onExtraCostChange) {
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
        {ADDONS.map((addon) => {
          const isSelected = selected.includes(addon.id);

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

              {/* Café/Té interactive */}
              {addon.id === 'cafe_te_berlioz' && isSelected && (
                <div className="mt-2 px-4 py-3 bg-muted rounded-lg space-y-2">
                  <label className="block text-xs font-medium text-foreground">
                    ¿Cuántas cajas? (cada caja rinde 12 tazas)
                  </label>
                  <input
                    type="number" min={1} value={cafeCount}
                    onChange={(e) => setCafeCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 h-8 px-3 rounded-md border border-input bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="text-xs font-mono text-foreground">
                    {cafeCount} caja{cafeCount > 1 ? 's' : ''} × $540 = <span className="font-semibold">{formatMXN(cafeCost)}</span>
                  </div>
                </div>
              )}

              {/* Surtido Snacks interactive */}
              {addon.id === 'surtido_snacks' && isSelected && (
                <div className="mt-2 px-4 py-3 bg-muted rounded-lg space-y-2">
                  <label className="block text-xs font-medium text-foreground">
                    ¿Cuántos surtidos? (cada uno para 6-8 personas)
                  </label>
                  <input
                    type="number" min={1} value={snackCount}
                    onChange={(e) => setSnackCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 h-8 px-3 rounded-md border border-input bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="text-xs font-mono text-foreground">
                    {snackCount} surtido{snackCount > 1 ? 's' : ''} × $300 = <span className="font-semibold">{formatMXN(snackCost)}</span>
                  </div>
                </div>
              )}

              {/* Logo interactive */}
              {addon.id === 'logo_caja' && isSelected && (
                <div className="mt-2 px-4 py-3 bg-muted rounded-lg space-y-2">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Tipo de personalización
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {LOGO_TIERS.map((tier) => (
                      <button
                        key={tier.id} type="button"
                        onClick={() => setLogoTier(tier.id)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all",
                          logoTier === tier.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {tier.label} · ${tier.pricePerPiece}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {selectedLogo.label}: ${selectedLogo.pricePerPiece} × {personas} pzas = <span className="font-semibold">{formatMXN(logoCost)}</span>
                  </div>
                </div>
              )}

              {/* Staff interactive */}
              {addon.id === 'personal_servicio' && isSelected && (
                <div className="mt-2 px-4 py-3 bg-muted rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Duración del servicio
                    </label>
                    <div className="flex gap-2">
                      {STAFF_TIERS.map((tier) => (
                        <button
                          key={tier.id} type="button"
                          onClick={() => setStaffTier(tier.id)}
                          className={cn(
                            "flex-1 py-2 rounded-md border text-xs font-medium transition-all",
                            staffTier === tier.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground",
                          )}
                        >
                          {tier.label} · {formatMXN(tier.price)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      ¿Cuántas personas de servicio?
                    </label>
                    <input
                      type="number" min={1} value={staffCount}
                      onChange={(e) => setStaffCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 h-8 px-3 rounded-md border border-input bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {staffCount} persona{staffCount > 1 ? 's' : ''} × {formatMXN(selectedStaff.price)} = <span className="font-semibold">{formatMXN(staffCost)}</span>
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
          Complementa tu paquete principal con Café/Té Berlioz ($540/caja), aguas frescas ($45/pza) o snack bags ($140/pza).
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
