import { cn } from "@/lib/utils";
import { AVAILABLE_EXTRAS } from "@/domain/entities/ExtraAddon";

interface ExtrasModalProps {
  open: boolean;
  selectedExtras: string[];
  onToggle: (id: string) => void;
  onSkip: () => void;
  onContinue: () => void;
}

const ExtrasModal = ({ open, selectedExtras, onToggle, onSkip, onContinue }: ExtrasModalProps) => {
  if (!open) return null;

  const hasSelection = selectedExtras.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 p-6 animate-slide-in">
        <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
          ¿Quieres agregar algo especial?
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Personaliza la experiencia para tu equipo
        </p>

        <div className="space-y-3">
          {AVAILABLE_EXTRAS.map((extra) => {
            const selected = selectedExtras.includes(extra.id);
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => onToggle(extra.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-foreground text-sm">{extra.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{extra.subtitle}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">{extra.note}</p>
                    {extra.cta && (
                      <p className="text-xs text-primary font-medium mt-1.5">{extra.cta}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-mono font-medium text-accent">{extra.price}</span>
                    <div className={cn(
                      "mt-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      selected ? "border-primary bg-primary" : "border-border",
                    )}>
                      {selected && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors"
          >
            Continuar sin extras →
          </button>
          {hasSelection && (
            <button
              type="button"
              onClick={onContinue}
              className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Agregar y ver propuesta →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtrasModal;
