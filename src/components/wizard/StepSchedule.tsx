import type { IntakeForm } from "@/types";
import { cn } from "@/lib/utils";

interface StepScheduleProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const HOURS = ['7:00am', '9:00am', '1:00pm', '7:00pm'];

const StepSchedule = ({ form, onChange }: StepScheduleProps) => {
  const toggleHour = (h: string) => {
    const next = form.horasEntrega.includes(h)
      ? form.horasEntrega.filter((x) => x !== h)
      : [...form.horasEntrega, h];
    onChange({ ...form, horasEntrega: next });
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

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Horarios de entrega
        </label>
        <div className="flex flex-wrap gap-3">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => toggleHour(h)}
              className={cn(
                "px-5 py-3 rounded-lg border text-sm font-mono font-medium transition-all",
                form.horasEntrega.includes(h)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

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

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Restricciones o preferencias alimenticias <span className="text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          value={form.notasDieteticas || ''}
          onChange={(e) => onChange({ ...form, notasDieteticas: e.target.value })}
          rows={3}
          placeholder="Ej: 5 personas vegetarianas, sin nueces…"
          className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground font-body placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
};

export default StepSchedule;
