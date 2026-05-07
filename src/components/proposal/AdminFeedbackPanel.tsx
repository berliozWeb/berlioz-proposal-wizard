import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  proposalId: string | null;
  packageTier: string;
  packageDisplayName: string;
  requestSnapshot: Record<string, unknown>;
}

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'reglas_negocio', label: 'Regla de negocio' },
  { value: 'presupuesto', label: 'Presupuesto / precio' },
  { value: 'balance_paquete', label: 'Balance del paquete' },
  { value: 'dietetico', label: 'Dietético / restricciones' },
  { value: 'upselling', label: 'Upselling / cross-sell' },
  { value: 'operaciones', label: 'Operaciones' },
];

const AdminFeedbackPanel = ({ proposalId, packageTier, packageDisplayName, requestSnapshot }: Props) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("balance_paquete");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data, error } = await supabase.rpc("is_admin", { _user_id: u.user.id });
      if (!cancelled && !error && data === true) setIsAdmin(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!isAdmin) return null;

  const submit = async () => {
    if (!rating) {
      toast.error("Indica 👍 o 👎");
      return;
    }
    if (comment.trim().length < 5 && rating === -1) {
      toast.error("Para 👎 necesitamos al menos un comentario corto");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("admin-insight-feedback", {
        body: { proposalId, packageTier, rating, comment: comment.trim(), category, requestSnapshot },
      });
      if (error) throw error;
      toast.success("Insight guardado — Claude lo usará en la próxima cotización");
      setComment("");
      setRating(null);
      setOpen(false);
    } catch (e: any) {
      toast.error(`No se pudo guardar: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 px-3 py-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 no-print">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          🛠 Admin · entrenar IA en "{packageDisplayName}"
        </span>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-[11px] text-primary hover:underline"
        >
          {open ? 'Cerrar' : 'Dejar feedback'}
        </button>
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRating(1)}
              className={`px-3 py-1 rounded text-xs font-medium border ${rating === 1 ? 'bg-success text-success-foreground border-success' : 'border-border bg-card'}`}
            >👍 Buena</button>
            <button
              type="button"
              onClick={() => setRating(-1)}
              className={`px-3 py-1 rounded text-xs font-medium border ${rating === -1 ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border bg-card'}`}
            >👎 Mala</button>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-2 py-1 rounded border border-border bg-card text-xs"
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 2000))}
            placeholder="¿Qué falta, sobra o cómo debería decidirlo Claude la próxima vez? (ej: 'para 50 personas con presupuesto $400 nunca incluir Camille')"
            rows={3}
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs resize-none"
          />
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="w-full px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar como regla aprendida →'}
          </button>
          <p className="text-[10px] text-muted-foreground">
            Se guarda en sales_insights y se inyecta en el prompt de Claude con prioridad alta si es 👎.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPanel;