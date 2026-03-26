import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarHeart, UserRound, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import berliozLogo from "@/assets/berlioz-logo.png";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ProfileType = "company" | "agency" | "personal";
type OrderFreq = "daily" | "weekly" | "monthly" | "occasional";

const PROFILE_OPTIONS: { type: ProfileType; icon: typeof Building2; color: string; title: string; desc: string; tag: string }[] = [
  {
    type: "company",
    icon: Building2,
    color: "text-primary",
    title: "Compro para mi empresa",
    desc: "Organizo la comida de mi equipo — juntas, eventos, comidas del día",
    tag: "Chief of Staff · Coordinador · Asistente · Admin · cualquier rol",
  },
  {
    type: "agency",
    icon: CalendarHeart,
    color: "text-accent",
    title: "Soy de una agencia o eventos",
    desc: "Cotizo y organizo catering para diferentes clientes",
    tag: "Agencia de eventos · Organizador · Productor",
  },
  {
    type: "personal",
    icon: UserRound,
    color: "text-gold",
    title: "Compra personal",
    desc: "Organizo una junta, evento o comida puntual",
    tag: "Uso ocasional · Celebraciones · Reuniones",
  },
];

const FREQ_OPTIONS: { value: OrderFreq; label: string }[] = [
  { value: "daily", label: "A diario" },
  { value: "weekly", label: "Una o más veces por semana" },
  { value: "monthly", label: "Una o dos veces al mes" },
  { value: "occasional", label: "De vez en cuando" },
];

const OnboardingPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0 = profile type, 1-3 = info wizard
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || user?.user_metadata?.company || "");
  const [address, setAddress] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [frequency, setFrequency] = useState<OrderFreq>("occasional");
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName || null,
        profile_type: profileType,
        order_frequency: frequency,
        onboarding_complete: true,
      })
      .eq("id", user.id);

    if (profileError) {
      toast.error("Error al guardar tu perfil");
      setSaving(false);
      return;
    }

    // Save address if provided
    if (address.trim()) {
      await supabase.from("delivery_addresses").insert({
        user_id: user.id,
        address_text: address,
        notes: addressNotes || null,
        is_default: true,
      });
    }

    await refreshProfile();

    const name = fullName.split(" ")[0];
    const welcomeMsg = `¡Hola ${name}! Tu cuenta está lista.`;

    if (profileType === "company") {
      navigate("/dashboard");
      toast.success(welcomeMsg, { description: "Haz tu primer pedido →", action: { label: "Ver menú", onClick: () => navigate("/menu") } });
    } else if (profileType === "agency") {
      navigate("/cotizaciones");
      toast.success(welcomeMsg);
    } else {
      navigate("/menu");
      toast.success(welcomeMsg, { description: "Explora nuestro menú" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center pt-12 pb-8 px-6">
        <img src={berliozLogo} alt="Berlioz" className="h-7 mx-auto mb-8" />
        {step === 0 ? (
          <>
            <h1 className="font-heading text-3xl md:text-4xl text-foreground">Cuéntanos cómo usas Berlioz</h1>
            <p className="font-body text-base text-muted-foreground mt-3">Para darte la mejor experiencia posible</p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl text-foreground">
              {step === 1 ? "Datos básicos" : step === 2 ? "Dirección de entrega" : "Frecuencia de pedidos"}
            </h1>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    s <= step ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {/* Step 0: Profile type selection */}
        {step === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {PROFILE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = profileType === opt.type;
                return (
                  <button
                    key={opt.type}
                    onClick={() => setProfileType(opt.type)}
                    className={cn(
                      "relative p-6 rounded-xl border-2 text-left transition-all hover:shadow-md",
                      selected
                        ? "border-primary bg-blue-light scale-[1.02]"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <Icon className={cn("w-8 h-8 mb-4", opt.color)} />
                    <h3 className="font-body text-base font-semibold text-foreground mb-2">{opt.title}</h3>
                    <p className="font-body text-sm text-muted-foreground mb-3">{opt.desc}</p>
                    <p className="font-body text-[11px] text-muted-foreground/70">{opt.tag}</p>
                  </button>
                );
              })}
            </div>
            <div className="text-center">
              <button
                onClick={() => setStep(1)}
                disabled={!profileType}
                className="h-12 px-10 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {/* Step 1: Name & company */}
        {step === 1 && (
          <div className="max-w-md mx-auto space-y-5">
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                ¿Cómo te llamas?
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                {profileType === "agency" ? "Nombre de tu agencia" : "¿En qué empresa estás?"}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder={profileType === "agency" ? "Nombre de la agencia" : "Nombre de la empresa"}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(0)}
                className="h-11 px-6 rounded-lg border border-border font-body text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!fullName.trim()}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="max-w-md mx-auto space-y-5">
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                ¿Cuál es tu dirección de entrega principal?
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Av. Reforma 222, Col. Juárez, CDMX"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                Notas de entrega <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={addressNotes}
                onChange={(e) => setAddressNotes(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Piso 7, preguntar por Jacqueline"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="h-11 px-6 rounded-lg border border-border font-body text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Frequency */}
        {step === 3 && (
          <div className="max-w-md mx-auto space-y-5">
            <p className="font-body text-sm text-foreground font-medium">
              ¿Con qué frecuencia pides comida para el trabajo?
            </p>
            <div className="space-y-2">
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left font-body text-sm transition-all",
                    frequency === opt.value
                      ? "border-primary bg-blue-light font-medium"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setFrequency("occasional"); handleFinish(); }}
              className="font-body text-xs text-muted-foreground hover:underline"
            >
              Puedes saltar esto
            </button>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="h-11 px-6 rounded-lg border border-border font-body text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Completar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;