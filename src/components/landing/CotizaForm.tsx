import type { IntakeForm } from "@/domain/entities/IntakeForm";
import { DELIVERY_HOURS } from "@/domain/value-objects/DeliveryTime";
import { getDateDisclaimer } from "@/domain/shared/BusinessRules";
import { cn } from "@/lib/utils";

interface CotizaFormProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const CotizaForm = ({ form, onChange, canSubmit, onSubmit, onBack }: CotizaFormProps) => {
  const toggleHour = (h: string) => {
    const next = form.horasEntrega.includes(h)
      ? form.horasEntrega.filter((x) => x !== h)
      : [...form.horasEntrega, h];
    onChange({ ...form, horasEntrega: next });
  };

  const dateDisclaimer = getDateDisclaimer(form.fechaInicio);

  return (
    <div className="animate-slide-in space-y-6">
      {/* Personas */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          ¿Cuántas personas?
        </label>
        <input
          type="number"
          value={form.personas || ''}
          onChange={(e) => onChange({ ...form, personas: Number(e.target.value) || 0 })}
          placeholder="Ej. 30"
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Fecha del evento
        </label>
        <input
          type="date"
          value={form.fechaInicio}
          onChange={(e) => onChange({ ...form, fechaInicio: e.target.value })}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {dateDisclaimer && (
          <div className="mt-2 px-3 py-2 rounded-md bg-accent/10 border border-accent/20 text-sm text-foreground">
            {dateDisclaimer}
          </div>
        )}
      </div>

      {/* Horarios */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Horarios de entrega
        </label>
        <div className="flex flex-wrap gap-3">
          {DELIVERY_HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => toggleHour(h)}
              className={cn(
                "px-5 py-3 rounded-lg border text-sm font-mono font-medium transition-all",
                form.horasEntrega.includes(h)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Notas <span className="text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          value={form.notasDieteticas || ''}
          onChange={(e) => onChange({ ...form, notasDieteticas: e.target.value })}
          rows={2}
          placeholder="Ej: 5 personas vegetarianas, sin nueces…"
          className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground font-body placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-lg border border-border text-foreground font-body text-sm font-medium hover:bg-muted transition-colors"
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 px-6 py-3 rounded-lg bg-forest text-forest-foreground font-body font-semibold transition-all hover:bg-forest/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generar propuesta →
        </button>
      </div>
    </div>
  );
};

export default CotizaForm;
