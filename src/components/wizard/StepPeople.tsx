import type { IntakeForm } from "@/types";
import { cn } from "@/lib/utils";

interface StepPeopleProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const MEXICAN_HOLIDAYS = [
  '01-01', // Año Nuevo
  '02-03', // Constitución
  '03-17', // Natalicio de Benito Juárez
  '05-01', // Día del Trabajo
  '09-16', // Independencia
  '11-17', // Revolución
  '12-25', // Navidad
];

function getDateDisclaimer(dateStr: string): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay(); // 0=Sun, 6=Sat
  const mmdd = dateStr.slice(5); // "MM-DD"

  if (day === 0 || MEXICAN_HOLIDAYS.includes(mmdd)) {
    return '📌 Domingos y días festivos el pedido mínimo es $5,000 + IVA';
  }
  if (day === 6) {
    return '📌 Los sábados el pedido mínimo es $3,000 + IVA';
  }
  return null;
}

const StepPeople = ({ form, onChange }: StepPeopleProps) => {
  const deliveryOptions = [
    { value: 'manana' as const, label: 'Mañana' },
    { value: 'mediodia' as const, label: 'Mediodía' },
    { value: 'noche' as const, label: 'Noche' },
  ];

  const toggleDelivery = (val: 'manana' | 'mediodia' | 'noche') => {
    const current = form.entregasPorDia;
    const next = current.includes(val)
      ? current.filter((d) => d !== val)
      : [...current, val];
    onChange({ ...form, entregasPorDia: next });
  };

  const dateDisclaimer = getDateDisclaimer(form.fechaInicio);

  return (
    <div className="animate-slide-in space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
          Personas y fechas
        </h2>
        <p className="text-muted-foreground mb-6">
          Cuéntanos los detalles de tu evento
        </p>
      </div>

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
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          El monto mínimo para entrega a domicilio es $1,000 + IVA. Pedidos menores pueden recogerse en nuestra cocina en Col. Modelo Pensil sin costo de envío.
        </p>
      </div>

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

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange({ ...form, esMultiDia: !form.esMultiDia })}
          className={cn(
            "w-12 h-6 rounded-full transition-colors duration-200 relative",
            form.esMultiDia ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform",
              form.esMultiDia ? "translate-x-6" : "translate-x-0.5"
            )}
          />
        </button>
        <span className="text-sm text-foreground">¿Es un evento de varios días?</span>
      </div>

      {form.esMultiDia && (
        <div className="space-y-4 animate-slide-in">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fecha de fin
            </label>
            <input
              type="date"
              value={form.fechaFin || ''}
              onChange={(e) => onChange({ ...form, fechaFin: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ¿Cuántas entregas por día?
            </label>
            <div className="flex gap-3">
              {deliveryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleDelivery(opt.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                    form.entregasPorDia.includes(opt.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepPeople;
