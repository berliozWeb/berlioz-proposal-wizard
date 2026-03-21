import type { IntakeForm, DietaryRestriction } from "@/domain/entities/IntakeForm";
import { DIETARY_OPTIONS } from "@/domain/entities/IntakeForm";
import {
  getDateDisclaimer,
  getCutoffWarning,
  getDurationNote,
  isValidMexicanCP,
  getCPCoverage,
  PRICE_DISCLAIMER,
  TIME_SLOTS,
  calcSuggestedDelivery,
  getTimeWarnings,
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
  const dateDisclaimer = getDateDisclaimer(form.fechaInicio);
  const cutoffWarning = getCutoffWarning(form.fechaInicio);
  const durationNote = getDurationNote(form.duracionEstimada);
  const cpValid = form.codigoPostal.length === 0 || isValidMexicanCP(form.codigoPostal);
  const cpCoverage = isValidMexicanCP(form.codigoPostal) ? getCPCoverage(form.codigoPostal) : null;

  const suggestedDelivery = calcSuggestedDelivery(form.horarioEvento);

  // Filter delivery time slots: only before or at event time
  const availableTimeSlots = form.horarioEvento
    ? TIME_SLOTS.filter((t) => t <= form.horarioEvento)
    : TIME_SLOTS;

  const deliveryWarnings = getTimeWarnings(
    form.horasEntrega[0] || suggestedDelivery,
    form.eventType,
    form.fechaInicio,
  );

  // Auto-set suggested delivery when event time changes
  const handleEventTimeChange = (time: string) => {
    const suggested = calcSuggestedDelivery(time);
    onChange({
      ...form,
      horarioEvento: time,
      horasEntrega: suggested ? [suggested] : form.horasEntrega,
    });
  };

  const toggleDietary = (val: DietaryRestriction) => {
    const current = form.restriccionesDieteticas;
    const next = current.includes(val)
      ? current.filter((d) => d !== val)
      : [...current, val];
    onChange({ ...form, restriccionesDieteticas: next });
  };

  return (
    <div className="animate-slide-in space-y-6">
      {/* ═══ Personas ═══ */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          ¿Cuántas personas?
        </label>
        <input
          type="number"
          value={form.personas || ''}
          onChange={(e) => onChange({ ...form, personas: Number(e.target.value) || 0 })}
          placeholder="Ej. 10"
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Berlioz entrega desde 4 personas · pedido promedio: 10-15 personas
        </p>
      </div>

      {/* ═══ Código postal ═══ */}
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
        {cpCoverage?.type === 'cdmx' && (
          <p className="text-xs text-emerald-600 mt-1.5 font-medium">{cpCoverage.message}</p>
        )}
        {cpCoverage?.type === 'outside' && (
          <div className="mt-2 px-3 py-2 rounded-md bg-blue-50 border border-blue-200 text-xs text-foreground leading-relaxed">
            {cpCoverage.message}
          </div>
        )}
      </div>

      {/* ═══ Fecha ═══ */}
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

      {/* ═══ Horario del evento (30-min time picker) ═══ */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Horario del evento
        </label>
        <select
          value={form.horarioEvento}
          onChange={(e) => handleEventTimeChange(e.target.value)}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecciona horario</option>
          {TIME_SLOTS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* ═══ Entrega sugerida ═══ */}
      {form.horarioEvento && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Hora de entrega — <span className="font-mono text-accent">{form.horasEntrega[0] || suggestedDelivery}</span>
          </label>
          <select
            value={form.horasEntrega[0] || suggestedDelivery}
            onChange={(e) => onChange({ ...form, horasEntrega: [e.target.value] })}
            className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {availableTimeSlots.map((t) => (
              <option key={t} value={t}>
                {t}{t === suggestedDelivery ? ' (recomendado)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1.5">
            Recomendamos 90 min de anticipación para garantizar tu entrega antes de que lleguen tus invitados
          </p>
          {deliveryWarnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600 mt-1 font-medium">⚠️ {w}</p>
          ))}

          {/* Reception checkbox */}
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.confirmaRecepcion}
              onChange={(e) => onChange({ ...form, confirmaRecepcion: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">Sí, confirmo que habrá alguien para recibir el pedido a esa hora</span>
          </label>
        </div>
      )}

      {/* ═══ Duración estimada ═══ */}
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

      {/* ═══ Budget question ═══ */}
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

      {/* ═══ Dietary restrictions ═══ */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          ¿Alguien tiene restricciones alimenticias?
        </label>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => onChange({ ...form, tieneRestricciones: true })}
            className={cn(
              "flex-1 py-3 rounded-lg border text-sm font-medium transition-all",
              form.tieneRestricciones
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...form, tieneRestricciones: false, restriccionesDieteticas: [] })}
            className={cn(
              "flex-1 py-3 rounded-lg border text-sm font-medium transition-all",
              !form.tieneRestricciones
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            No
          </button>
        </div>
        {form.tieneRestricciones && (
          <div className="animate-slide-in flex flex-wrap gap-3">
            {DIETARY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.restriccionesDieteticas.includes(opt.value)}
                  onChange={() => toggleDietary(opt.value)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                />
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Actions ═══ */}
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
