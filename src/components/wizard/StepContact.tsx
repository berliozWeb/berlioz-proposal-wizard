import type { IntakeForm } from "@/domain/entities/IntakeForm";

interface StepContactProps {
  form: IntakeForm;
  onChange: (form: IntakeForm) => void;
}

const inputClass = "w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground font-body placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";

const StepContact = ({ form, onChange }: StepContactProps) => {
  const update = (field: keyof IntakeForm['contacto'], value: string) => {
    onChange({ ...form, contacto: { ...form.contacto, [field]: value } });
  };

  return (
    <div className="animate-slide-in space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
          Datos de contacto
        </h2>
        <p className="text-muted-foreground mb-6">
          Para personalizar tu propuesta
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Nombre completo</label>
        <input
          type="text"
          value={form.contacto.nombre}
          onChange={(e) => update('nombre', e.target.value)}
          placeholder="Juan Pérez"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Empresa</label>
        <input
          type="text"
          value={form.contacto.empresa}
          onChange={(e) => update('empresa', e.target.value)}
          placeholder="Nombre de la empresa"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
        <input
          type="email"
          value={form.contacto.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="juan@empresa.com"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Teléfono <span className="text-muted-foreground">(opcional)</span>
        </label>
        <input
          type="tel"
          value={form.contacto.telefono || ''}
          onChange={(e) => update('telefono', e.target.value)}
          placeholder="55 1234 5678"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Persona de atención</label>
        <input
          type="text"
          value={form.contacto.atencion}
          onChange={(e) => update('atencion', e.target.value)}
          placeholder="Nombre de quien recibe la cotización"
          className={inputClass}
        />
      </div>
    </div>
  );
};

export default StepContact;
