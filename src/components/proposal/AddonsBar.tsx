import { ADDONS, type Addon } from "@/domain/entities/Addon";
import { formatMXN } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";

interface AddonsBarProps {
  selected: string[];
  onToggle: (id: string) => void;
  personas: number;
}

const AddonsBar = ({ selected, onToggle, personas }: AddonsBarProps) => (
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
        const addonTotal = addon.pricePerPerson ? addon.pricePerPerson * personas : null;

        return (
          <button
            key={addon.id}
            type="button"
            onClick={() => onToggle(addon.id)}
            className={cn(
              "text-left p-4 rounded-lg border-2 transition-all",
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
        );
      })}
    </div>
  </div>
);

export default AddonsBar;
