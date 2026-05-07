import type { IntakeForm, DietaryRestriction } from "@/domain/entities/IntakeForm";
import { DIETARY_OPTIONS } from "@/domain/entities/IntakeForm";
import {
  getDateDisclaimer,
  getCutoffWarning,
  isValidMexicanCP,
  getCPCoverage,
  getTrafficAlert,
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

const CL = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

interface DurationOption {
  value: number;
  label: string;
  suggestion: string;
  priceHint: string;
  image: string;
}

const DURATION_CARDS: DurationOption[] = [
  {
    value: 1,
    label: '1 hora',
    suggestion: 'Solo bebidas — café + agua',
    priceHint: 'Desde $95/persona',
    image: `${CL}/bui-natural_k8kmdy`,
  },
  {
    value: 2,
    label: '2-3 horas',
    suggestion: 'Coffee Break — bebidas y snacks',
    priceHint: 'Desde $240/persona',
    image: `${CL}/coffeebreak_PM_qlk47d`,
  },
  {
    value: 4,
    label: '3-5 horas — Working Lunch',
    suggestion: 'Comida principal + bebidas',
    priceHint: 'Desde $280/persona',
    image: `${CL}/Surtido-Camille-Berlioz-bocadillos_paaynm`,
  },
  {
    value: 6,
    label: 'Día completo (5h+)',
    suggestion: 'Desayuno + comida + coffee break',
    priceHint: 'Desde $580/persona',
    image: `${CL}/cateringCorporativo12_a0kxxe`,
  },
];

const NO_ADDON_VALUE = 0;

const CotizaForm = ({ form, onChange, canSubmit, onSubmit, onBack }: CotizaFormProps) => {
  const dateWarning = getDateDisclaimer(form.fechaInicio);
  const cutoffWarning = getCutoffWarning(form.fechaInicio);
  const cpValid = form.codigoPostal.length === 0 || isValidMexicanCP(form.codigoPostal);
  const cpCoverage = isValidMexicanCP(form.codigoPostal) ? getCPCoverage(form.codigoPostal) : null;

  const suggestedDelivery = calcSuggestedDelivery(form.horarioEvento);
  const deliveryTime = form.horasEntrega[0] || suggestedDelivery;
  const trafficAlert = getTrafficAlert(deliveryTime, form.codigoPostal);

  const availableTimeSlots = form.horarioEvento
    ? TIME_SLOTS.filter((t) => t <= form.horarioEvento)
    : TIME_SLOTS;

  const deliveryWarnings = getTimeWarnings(deliveryTime, form.eventType, form.fechaInicio);
  const isBlocked = cutoffWarning?.blockSubmit === true;

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
    if (!current.includes(val)) {
      counts.push({ tipo: val, cantidad: 1 });
    }
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

  // Duration selection
  const selectedDuration = DURATION_CARDS.find(c => c.value === form.duracionEstimada);
  const isNoAddon = form.duracionEstimada === NO_ADDON_VALUE;

  // Show "sin complementos" only for short durations (1h)
  const showNoAddonOption = form.duracionEstimada === 1 || isNoAddon;

  return (
    <div className="animate-slide-in space-y-6">
      {/* ═══ DURATION FIRST ═══ */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          ¿Cuánto dura tu evento?
        </label>
        <div className="space-y-3">
          {DURATION_CARDS.map((card) => {
            const isSelected = selectedDuration?.value === card.value && !isNoAddon;
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => onChange({ ...form, duracionEstimada: card.value })}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <img
                  src={card.image}
                  alt={card.label}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-foreground text-sm">{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.suggestion}</p>
                  <p className="text-xs font-medium mt-1" style={{ color: 'hsl(var(--gold))' }}>{card.priceHint}</p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30",
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}

          {/* Sin complementos — only show when 1h is selected or already active */}
          {showNoAddonOption && (
            <button
              type="button"
              onClick={() => onChange({ ...form, duracionEstimada: NO_ADDON_VALUE })}
              className={cn(
                "w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all text-center",
                isNoAddon
                  ? "ring-1 ring-primary/20 bg-primary/5"
                  : "hover:border-primary/40",
              )}
              style={{
                border: isNoAddon
                  ? '2px solid hsl(var(--primary))'
                  : '2px dashed #D0CFC8',
                background: isNoAddon ? undefined : '#FAFAF8',
              }}
            >
              <div className="flex-1">
                <p className="font-body font-bold text-sm" style={{ color: '#888880' }}>
                  Sin complementos adicionales
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#888880' }}>
                  Solo lo esencial — sin bebidas extra ni snacks
                </p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                isNoAddon ? "border-primary bg-primary" : "border-muted-foreground/30",
              )}>
                {isNoAddon && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ═══ Personas ═══ */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          ¿Cuántas personas?
        </label>
        <input
          type="number"
          value={form.personas || ''}
          onChange={(e) => onChange({ ...form, personas: Number(e.target.value) || 0 })}
          placeholder="Ej. 15"
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {form.personas >= 1 && form.personas <= 4 && (
          <div
            className="mt-3 font-body"
            style={{
              background: '#E8F4FD',
              borderLeft: '3px solid #378ADD',
              borderRadius: 8,
              padding: 12,
              fontSize: 13,
              lineHeight: 1.6,
              color: 'hsl(var(--foreground))',
            }}
          >
            💡 Para grupos de 1-4 personas te recomendamos recoger tu pedido en nuestra cocina — ¡y sin costo de envío!
            <br />
            📍 Lago Onega 285, Col. Modelo Pensil, CDMX
            <br />
            <a
              href="https://maps.google.com/?q=Lago+Onega+285,+Col.+Modelo+Pensil,+CDMX"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: '#378ADD', fontSize: 12, marginTop: 4, display: 'inline-block' }}
            >
              Ver cómo llegar →
            </a>
          </div>
        )}
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
          <p className="text-xs mt-1.5 font-medium" style={{ color: '#16a34a' }}>{cpCoverage.message}</p>
        )}
        {cpCoverage?.type === 'outside' && (
          <div className="mt-2 px-3 py-2 rounded-md text-xs text-foreground leading-relaxed" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
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
        {dateWarning && (
          <div className="mt-2 px-4 py-3 rounded-lg border-l-4 text-sm text-foreground"
            style={{
              background: dateWarning.type === 'orange' ? '#FFF7ED' : '#FDF3E0',
              borderColor: dateWarning.type === 'orange' ? '#EA580C' : '#C9973A',
              borderRadius: 8,
            }}>
            {dateWarning.message}
          </div>
        )}
        {cutoffWarning?.type === 'red' && (
          <div className="mt-2 px-4 py-3 rounded-lg border-l-4 text-sm text-foreground"
            style={{ background: '#FEE2E2', borderColor: '#DC2626', borderRadius: 8 }}>
            {cutoffWarning.message}
          </div>
        )}
      </div>

      {/* ═══ Horario del evento ═══ */}
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
            Hora de entrega — <span className="font-mono text-accent">{deliveryTime}</span>
          </label>
          <select
            value={deliveryTime}
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
            Recomendamos 90 min de anticipación para garantizar tu entrega
          </p>
          {deliveryWarnings.map((w, i) => (
            <p key={i} className="text-xs mt-1 font-medium" style={{ color: '#d97706' }}>⚠️ {w}</p>
          ))}
          {trafficAlert && (
            <div className="mt-2 px-3 py-2 rounded-md text-xs text-foreground leading-relaxed" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8 }}>
              {trafficAlert}
            </div>
          )}
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.confirmaRecepcion}
              onChange={(e) => onChange({ ...form, confirmaRecepcion: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">Sí, confirmo que habrá alguien para recibir el pedido</span>
          </label>
        </div>
      )}

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
          disabled={!canSubmit || isBlocked}
          className="flex-1 px-6 py-3 rounded-lg bg-forest text-forest-foreground font-body font-semibold transition-all hover:bg-forest/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generar propuesta →
        </button>
      </div>
    </div>
  );
};

export default CotizaForm;
