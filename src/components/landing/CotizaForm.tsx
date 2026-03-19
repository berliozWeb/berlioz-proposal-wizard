import type { IntakeForm } from "@/domain/entities/IntakeForm";
import { DELIVERY_HOURS } from "@/domain/value-objects/DeliveryTime";
import {
  getDateDisclaimer,
  getCutoffWarning,
  getDurationNote,
  isValidMexicanCP,
  PRICE_DISCLAIMER,
} from "@/domain/shared/BusinessRules";
import { cn } from "@/lib/utils";

interface CotizaFormProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

const CotizaForm = ({ form, onChange, canSubmit, onSubmit, onBack }: CotizaFormProps) => {
  const toggleHour = (h: string) => {
    const next = form.horasEntrega.includes(h)
      ? form.horasEntrega.filter((x) => x !== h)
      : [...form.horasEntrega, h];
    onChange({ ...form, horasEntrega: next });
  };

  const dateDisclaimer = getDateDisclaimer(form.fechaInicio);
  const cutoffWarning = getCutoffWarning(form.fechaInicio);
  const durationNote = getDurationNote(form.duracionEstimada);
  const cpValid = form.codigoPostal.length === 0 || isValidMexicanCP(form.codigoPostal);

  return (
    <div className="animate-slide-in space-y-6">
      {/* ═══ RULE 1: Required fields ═══ */}

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

      {/* Código postal */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Código postal de entrega
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={form.codigoPostal}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 5);
            onChange({ ...form, codigoPostal: val });
          }}
          placeholder="Ej. 11550"
          className={cn(
            "w-full h-12 px-4 rounded-lg border bg-card text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield]",
            !cpValid ? "border-destructive" : "border-input",
          )}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Lo usamos para calcular viabilidad y costo de envío
        </p>
        {!cpValid && (
          <p className="text-xs text-destructive mt-1">Ingresa un código postal válido de 5 dígitos</p>
        )}
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

        {/* Rule 6: Cutoff warnings */}
        {cutoffWarning?.type === 'red' && (
          <div className="mt-2 px-4 py-3 rounded-lg border-l-4 text-sm text-foreground"
            style={{ background: '#FEE2E2', borderColor: '#DC2626' }}>
            {cutoffWarning.message}
          </div>
        )}
        {cutoffWarning?.type === 'yellow' && (
          <div className="mt-2 px-4 py-3 rounded-lg border-l-4 text-sm text-foreground"
            style={{ background: '#FDF3E0', borderColor: '#C9973A', borderRadius: 8 }}>
            {cutoffWarning.message}
          </div>
        )}
      </div>

      {/* Horario del evento */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Horario del evento
        </label>
        <input
          type="time"
          value={form.horarioEvento}
          onChange={(e) => onChange({ ...form, horarioEvento: e.target.value })}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Duración estimada */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Duración estimada — <span className="font-mono text-accent">{form.duracionEstimada}{form.duracionEstimada >= 6 ? '+' : ''}h</span>
        </label>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange({ ...form, duracionEstimada: h })}
              className={cn(
                "flex-1 py-3 rounded-lg border text-sm font-mono font-medium transition-all",
                form.duracionEstimada === h
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {h}{h >= 6 ? '+' : ''}h
            </button>
          ))}
        </div>
        {durationNote && (
          <p className="text-xs text-accent mt-2 font-medium">💡 {durationNote}</p>
        )}
      </div>

      {/* Horarios de entrega */}
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

      {/* ═══ RULE 2: Budget question ═══ */}
      <div className="border-t border-border pt-6">
        <label className="block text-sm font-medium text-foreground mb-3">
          ¿Tienes un presupuesto por persona en mente?
        </label>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => onChange({ ...form, tienePresupuesto: true })}
            className={cn(
              "flex-1 py-3 rounded-lg border text-sm font-medium transition-all",
              form.tienePresupuesto
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...form, tienePresupuesto: false, presupuestoPorPersona: 0 })}
            className={cn(
              "flex-1 py-3 rounded-lg border text-sm font-medium transition-all",
              !form.tienePresupuesto
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            No, sorpréndeme
          </button>
        </div>
        {form.tienePresupuesto && (
          <div className="animate-slide-in">
            <label className="block text-xs text-muted-foreground mb-1.5">¿Cuánto por persona? (MXN)</label>
            <input
              type="number"
              value={form.presupuestoPorPersona || ''}
              onChange={(e) => onChange({ ...form, presupuestoPorPersona: Number(e.target.value) || 0 })}
              placeholder="Ej. 200"
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        )}
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
