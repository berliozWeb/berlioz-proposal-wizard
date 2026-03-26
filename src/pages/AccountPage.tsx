import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Trash2, MapPin, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Address { id: string; address_text: string; notes: string | null; is_default: boolean }

const AccountPage = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [profileType, setProfileType] = useState<string>("");
  const [orderFrequency, setOrderFrequency] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddr, setNewAddr] = useState("");
  const [newAddrNotes, setNewAddrNotes] = useState("");

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    order_confirmation: true,
    reminder_48h: true,
    status_updates: true,
    promotions: false,
    points_earned: true,
  });

  // Fiscal
  const [fiscalRfc, setFiscalRfc] = useState("");
  const [fiscalRazon, setFiscalRazon] = useState("");
  const [fiscalDireccion, setFiscalDireccion] = useState("");
  const [fiscalUsoCfdi, setFiscalUsoCfdi] = useState("G03");
  const [fiscalRegimen, setFiscalRegimen] = useState("");

  // Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setCompanyName(profile.company_name ?? "");
    setProfileType(profile.profile_type ?? "");
    setOrderFrequency(profile.order_frequency ?? "occasional");
    const np = (profile as any).notification_preferences;
    if (np && typeof np === "object") setNotifPrefs({ ...notifPrefs, ...np });
    setFiscalRfc((profile as any).fiscal_rfc ?? "");
    setFiscalRazon((profile as any).fiscal_razon_social ?? "");
    setFiscalDireccion((profile as any).fiscal_direccion ?? "");
    setFiscalUsoCfdi((profile as any).fiscal_uso_cfdi ?? "G03");
    setFiscalRegimen((profile as any).fiscal_regimen ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("delivery_addresses").select("*").eq("user_id", user.id)
      .then(({ data }) => setAddresses(data ?? []));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: fullName,
      company_name: companyName,
      profile_type: profileType as any,
      order_frequency: orderFrequency as any,
    }).eq("id", user.id);
    await refreshProfile();
    toast.success("Perfil actualizado");
    setSaving(false);
  };

  const saveNotifications = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ notification_preferences: notifPrefs as any }).eq("id", user.id);
    toast.success("Preferencias guardadas");
  };

  const saveFiscal = async () => {
    if (!user) return;
    await supabase.from("profiles").update({
      fiscal_rfc: fiscalRfc,
      fiscal_razon_social: fiscalRazon,
      fiscal_direccion: fiscalDireccion,
      fiscal_uso_cfdi: fiscalUsoCfdi,
      fiscal_regimen: fiscalRegimen,
    } as any).eq("id", user.id);
    toast.success("Datos fiscales guardados");
  };

  const addAddress = async () => {
    if (!user || !newAddr.trim()) return;
    const { data } = await supabase.from("delivery_addresses").insert({
      user_id: user.id,
      address_text: newAddr.trim(),
      notes: newAddrNotes.trim() || null,
      is_default: addresses.length === 0,
    }).select().single();
    if (data) {
      setAddresses((prev) => [...prev, data]);
      setNewAddr("");
      setNewAddrNotes("");
      toast.success("Dirección agregada");
    }
  };

  const deleteAddress = async (id: string) => {
    await supabase.from("delivery_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Dirección eliminada");
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    // Unset all, then set selected
    await supabase.from("delivery_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("delivery_addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    toast.success("Dirección predeterminada actualizada");
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Contraseña actualizada"); setNewPassword(""); }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== "ELIMINAR") { toast.error('Escribe "ELIMINAR" para confirmar'); return; }
    // TODO: Implement account deletion via edge function (needs service_role)
    toast.error("Contacta a soporte para eliminar tu cuenta: soporte@berlioz.mx");
  };

  const isSSO = user?.app_metadata?.providers?.some((p: string) => p !== "email") ?? false;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-2xl text-foreground mb-6">Configuración</h1>

        <Tabs defaultValue="profile">
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            <TabsTrigger value="addresses">Direcciones</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="billing">Facturación</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          {/* TAB 1: Profile */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading text-xl">
                  {fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U"}
                </div>
              )}
              {/* TODO: Avatar upload with Supabase Storage */}
              <button className="font-body text-sm text-secondary hover:underline">Cambiar foto</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium block mb-1">Nombre completo</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="font-body text-sm font-medium block mb-1">Email</label>
                <Input value={user?.email ?? ""} disabled className="bg-muted" />
              </div>
              <div>
                <label className="font-body text-sm font-medium block mb-1">Empresa</label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <label className="font-body text-sm font-medium block mb-1">¿Cómo usas Berlioz?</label>
                <RadioGroup value={profileType} onValueChange={setProfileType} className="flex gap-4">
                  {[
                    { value: "company", label: "Empresa" },
                    { value: "agency", label: "Agencia" },
                    { value: "personal", label: "Personal" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 font-body text-sm cursor-pointer">
                      <RadioGroupItem value={opt.value} />
                      {opt.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <label className="font-body text-sm font-medium block mb-1">Frecuencia de pedidos</label>
                <Select value={orderFrequency} onValueChange={setOrderFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="occasional">Ocasional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: Addresses */}
          <TabsContent value="addresses" className="space-y-6">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="font-body text-sm font-medium">{addr.address_text}</p>
                    {addr.notes && <p className="font-body text-xs text-muted-foreground mt-1">{addr.notes}</p>}
                    {addr.is_default && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-body font-medium">
                        Predeterminada
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!addr.is_default && (
                    <button onClick={() => setDefault(addr.id)} className="font-body text-xs text-secondary hover:underline">
                      Predeterminar
                    </button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
              <p className="font-body text-sm font-medium">+ Agregar nueva dirección</p>
              <Input value={newAddr} onChange={(e) => setNewAddr(e.target.value)} placeholder="Dirección completa..." />
              <Input value={newAddrNotes} onChange={(e) => setNewAddrNotes(e.target.value)} placeholder="Piso, oficina, indicaciones..." />
              <Button size="sm" onClick={addAddress} disabled={!newAddr.trim()}>Guardar dirección</Button>
            </div>
          </TabsContent>

          {/* TAB 3: Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            {[
              { key: "order_confirmation", label: "Confirmación de pedido" },
              { key: "reminder_48h", label: "Recordatorio 48h antes de entrega" },
              { key: "status_updates", label: "Actualización de estado en tiempo real" },
              { key: "promotions", label: "Novedades y promociones de Berlioz" },
              { key: "points_earned", label: "Puntos de recompensa acumulados" },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <span className="font-body text-sm">{pref.label}</span>
                <Switch
                  checked={(notifPrefs as any)[pref.key]}
                  onCheckedChange={(v) => setNotifPrefs((prev) => ({ ...prev, [pref.key]: v }))}
                />
              </div>
            ))}
            <Button onClick={saveNotifications} className="gap-2 mt-4">
              <Save className="w-4 h-4" /> Guardar preferencias
            </Button>
          </TabsContent>

          {/* TAB 4: Billing */}
          <TabsContent value="billing" className="space-y-4">
            <p className="font-body text-sm text-muted-foreground">Usaremos estos datos para generar tus facturas automáticamente.</p>
            <Input placeholder="RFC" value={fiscalRfc} onChange={(e) => setFiscalRfc(e.target.value.toUpperCase())} maxLength={13} />
            <Input placeholder="Razón social" value={fiscalRazon} onChange={(e) => setFiscalRazon(e.target.value)} />
            <Input placeholder="Dirección fiscal" value={fiscalDireccion} onChange={(e) => setFiscalDireccion(e.target.value)} />
            <Select value={fiscalUsoCfdi} onValueChange={setFiscalUsoCfdi}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="G03">G03 – Gastos en general</SelectItem>
                <SelectItem value="G01">G01 – Adquisición de mercancías</SelectItem>
                <SelectItem value="P01">P01 – Por definir</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fiscalRegimen} onValueChange={setFiscalRegimen}>
              <SelectTrigger><SelectValue placeholder="Régimen fiscal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="601">601 – General de Ley</SelectItem>
                <SelectItem value="603">603 – Personas Morales sin Fines de Lucro</SelectItem>
                <SelectItem value="612">612 – Personas Físicas con Actividades Empresariales</SelectItem>
                <SelectItem value="626">626 – Régimen Simplificado de Confianza</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={saveFiscal} className="gap-2">
              <Save className="w-4 h-4" /> Guardar datos fiscales
            </Button>
          </TabsContent>

          {/* TAB 5: Security */}
          <TabsContent value="security" className="space-y-8">
            {!isSSO && (
              <div className="space-y-3">
                <h3 className="font-heading text-base">Cambiar contraseña</h3>
                <Input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Button onClick={changePassword} disabled={newPassword.length < 6}>Actualizar contraseña</Button>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-heading text-base">Cuentas conectadas</h3>
              {user?.app_metadata?.providers?.map((p: string) => (
                <div key={p} className="flex items-center gap-2 font-body text-sm">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  {p === "google" ? "Google" : p === "linkedin_oidc" ? "LinkedIn" : p} conectado
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={async () => { await signOut(); navigate("/"); }}
                className="font-body text-sm text-secondary hover:underline"
              >
                Cerrar sesión en todos los dispositivos
              </button>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="font-heading text-base text-destructive">Zona de peligro</h3>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                Eliminar tu cuenta es irreversible. Se borrarán todos tus datos.
              </p>
              <Input
                placeholder='Escribe "ELIMINAR" para confirmar'
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
              />
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={confirmDelete !== "ELIMINAR"}>
                Eliminar mi cuenta
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountPage;
