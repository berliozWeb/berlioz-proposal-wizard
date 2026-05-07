import type { IntakeForm, DietaryRestriction } from "@/domain/entities/IntakeForm";
import { DIETARY_OPTIONS } from "@/domain/entities/IntakeForm";
import {
  TIME_SLOTS,
  calcSuggestedDelivery,
  getTimeWarnings,
} from "@/domain/shared/BusinessRules";
import { cn } from "@/lib/utils";

interface StepScheduleProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const StepSchedule = ({ form, onChange }: StepScheduleProps) => {
  const suggestedDelivery = calcSuggestedDelivery(form.horarioEvento);

  const availableTimeSlots = form.horarioEvento
    ? TIME_SLOTS.filter((t) => t <= form.horarioEvento)
    : TIME_SLOTS;

  const deliveryWarnings = getTimeWarnings(
    form.horasEntrega[0] || suggestedDelivery,
    form.eventType,
    form.fechaInicio,
  );

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
    const counts = (form.dietaryCounts || []).filter(c => next.includes(c.tipo));
    if (!current.includes(val)) counts.push({ tipo: val, cantidad: 1 });
    onChange({ ...form, restriccionesDieteticas: next, dietaryCounts: counts });
  };

  const setDietaryCount = (val: DietaryRestriction, cantidad: number) => {
    const max = form.personas || 999;
    const safe = Math.max(0, Math.min(max, Math.floor(cantidad || 0)));
    const existing = form.dietaryCounts || [];
    const next = existing.some(c => c.tipo === val)
      ? existing.map(c => c.tipo === val ? { ...c, cantidad: safe } : c)
      : [...existing, { tipo: val, cantidad: safe }];
    onChange({ ...form, dietaryCounts: next });
  };

  return (
    <div className="animate-slide-in space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
          Horario y servicio
        </h2>
        <p className="text-muted-foreground mb-6">
          Define los tiempos de entrega
        </p>
      </div>

      {/* Event time (30-min picker) */}
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

      {/* Delivery time (auto-suggested) */}
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

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          ¿Cuántas horas dura el evento? — <span className="font-mono text-accent">{form.horasEvento}h</span>
        </label>
        <input
          type="range"
          min={1}
          max={12}
          value={form.horasEvento}
          onChange={(e) => onChange({ ...form, horasEvento: Number(e.target.value) })}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
          <span>1h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Dietary restrictions */}
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
          <div className="animate-slide-in space-y-2">
            <p className="text-xs text-muted-foreground">
              Indica cuántas personas tienen cada restricción. El resto se cotiza normal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map((opt) => {
                const checked = form.restriccionesDieteticas.includes(opt.value);
                const count = form.dietaryCounts?.find(c => c.tipo === opt.value)?.cantidad ?? 0;
                return (
                  <div key={opt.value} className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-card">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDietary(opt.value)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                    />
                    <span className="text-sm text-foreground flex-1">{opt.label}</span>
                    {checked && (
                      <input
                        type="number"
                        min={1}
                        max={form.personas || 999}
                        value={count || 1}
                        onChange={(e) => setDietaryCount(opt.value, Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded border border-border text-sm text-right"
                      />
                    )}
                    {checked && <span className="text-xs text-muted-foreground">pers.</span>}
                  </div>
                );
              })}
            </div>
            {(() => {
              const sum = (form.dietaryCounts || []).reduce((a, c) => a + (c.cantidad || 0), 0);
              if (sum > (form.personas || 0)) {
                return <p className="text-xs text-destructive">⚠️ La suma ({sum}) supera el total de personas ({form.personas}).</p>;
              }
              return null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepSchedule;
