import { useState } from "react";
import { addDays, nextDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: any[];
}

const FREQUENCIES = [
  { value: "weekly", label: "Cada semana" },
  { value: "biweekly", label: "Cada 2 semanas" },
  { value: "monthly", label: "Cada mes" },
  { value: "once", label: "Solo próxima vez" },
];

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
];

const SLOTS = ["7:30-9:00", "10:00-11:30", "12:00-13:30", "15:00-17:00"];

const ScheduleOrderModal = ({ open, onOpenChange, items = [] }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [frequency, setFrequency] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [timeSlot, setTimeSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextDeliveryDate = dayOfWeek !== null
    ? format(nextDay(new Date(), dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6), "EEEE d 'de' MMMM", { locale: es })
    : null;

  const handleSubmit = async () => {
    if (!user || dayOfWeek === null) return;
    setSubmitting(true);
    try {
      await supabase.from("scheduled_orders").insert({
        user_id: user.id,
        items: items as any,
        frequency,
        day_of_week: dayOfWeek,
        time_slot: timeSlot,
        next_delivery_date: format(nextDay(new Date(), dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6), "yyyy-MM-dd"),
        is_active: true,
      });
      toast.success("¡Pedido recurrente activado!");
      onOpenChange(false);
    } catch {
      toast.error("Error al programar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">¿Cada cuándo necesitas tu pedido?</DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-3">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                onClick={() => { setFrequency(f.value); setStep(1); }}
                className={cn(
                  "w-full p-4 rounded-xl border text-left font-body text-sm font-medium transition-all",
                  frequency === f.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="font-body text-sm font-medium mb-3">Día de la semana</p>
              <div className="flex gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDayOfWeek(d.value)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border font-body text-sm font-medium transition-all",
                      dayOfWeek === d.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-body text-sm font-medium mb-3">Horario</p>
              <div className="grid grid-cols-2 gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTimeSlot(s)}
                    className={cn(
                      "py-3 rounded-xl border font-body text-sm transition-all",
                      timeSlot === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {nextDeliveryDate && (
              <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Tu próxima entrega sería el {nextDeliveryDate}
              </p>
            )}
            <Button onClick={() => setStep(2)} disabled={!dayOfWeek || !timeSlot} className="w-full">
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-success" />
            </div>
            <p className="font-body text-sm">
              Berlioz te entregará <strong>{FREQUENCIES.find((f) => f.value === frequency)?.label.toLowerCase()}</strong> los{" "}
              <strong>{DAYS.find((d) => d.value === dayOfWeek)?.label}</strong> a las <strong>{timeSlot}</strong>
            </p>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Activando..." : "Activar pedido habitual"}
            </Button>
            <p className="font-body text-xs text-muted-foreground">Puedes cancelarlo en cualquier momento desde tu panel</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleOrderModal;
