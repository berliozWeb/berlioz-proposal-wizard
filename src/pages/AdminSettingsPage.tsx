import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings, useInvalidateSettings, type SiteSettings } from "@/hooks/useSiteSettings";

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block font-body text-sm font-medium text-foreground mb-1">{label}</span>
    {children}
    {hint && <span className="block font-body text-xs text-muted-foreground mt-1">{hint}</span>}
  </label>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-border bg-card p-5 space-y-4">
    <h2 className="font-heading text-lg text-foreground">{title}</h2>
    {children}
  </section>
);

const AdminSettingsPage = () => {
  const { settings, loading } = useSiteSettings();
  const invalidate = useInvalidateSettings();
  const { user } = useAuth();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading) setForm(settings); }, [loading, settings]);

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);
  const txt = (k: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value as never);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      { key: "general", value: form as never, updated_by: user?.id ?? null },
      { onConflict: "key" },
    );
    setSaving(false);
    if (error) { toast.error("No se pudo guardar"); return; }
    await invalidate();
    toast.success("Cambios guardados");
  };

  return (
    <AdminLayout title="Configuración del sitio">
      <div className="max-w-2xl space-y-5">
        <Section title="Contacto y WhatsApp">
          <Field label="Número de WhatsApp" hint="Con lada de país, sin espacios. Ej. 525582375469">
            <Input value={form.whatsapp_number} onChange={txt("whatsapp_number")} />
          </Field>
          <Field label="Mensaje precargado de WhatsApp"><Input value={form.whatsapp_message} onChange={txt("whatsapp_message")} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Teléfono de contacto"><Input value={form.contact_phone} onChange={txt("contact_phone")} /></Field>
            <Field label="Correo de contacto"><Input type="email" value={form.contact_email} onChange={txt("contact_email")} /></Field>
          </div>
        </Section>

        <Section title="Aviso en la parte superior">
          <div className="flex items-center gap-3">
            <Switch checked={form.announcement_enabled} onCheckedChange={(v) => set("announcement_enabled", v)} />
            <span className="font-body text-sm">{form.announcement_enabled ? "Visible" : "Oculto"}</span>
          </div>
          <Field label="Texto del aviso"><Input value={form.announcement_text} onChange={txt("announcement_text")} placeholder="Ej. Cerrado el 16 de septiembre" /></Field>
        </Section>

        <Section title="Pedidos">
          <Field label="Calendario donde se crean los pedidos confirmados" hint="Correo o ID del calendario de Google">
            <Input value={form.calendar_id} onChange={txt("calendar_id")} />
          </Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Mínimo sábado ($ + IVA)"><Input type="number" value={form.min_saturday} onChange={num("min_saturday")} /></Field>
            <Field label="Mínimo domingo ($ + IVA)"><Input type="number" value={form.min_sunday} onChange={num("min_sunday")} /></Field>
            <Field label="Mínimo festivo ($ + IVA)"><Input type="number" value={form.min_holiday} onChange={num("min_holiday")} /></Field>
          </div>
          <Field label="Hora de corte para pedidos del día siguiente" hint="Formato 24 h. 15 = 3:00 PM">
            <Input type="number" min={0} max={23} value={form.cutoff_hour} onChange={num("cutoff_hour")} className="w-28" />
          </Field>
        </Section>

        <Button onClick={save} disabled={saving || loading}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
