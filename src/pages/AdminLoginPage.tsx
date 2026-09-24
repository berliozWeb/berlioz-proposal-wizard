import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useIsAdmin } from "@/components/layout/AdminRoute";
import { useAuth } from "@/contexts/AuthContext";
import berliozLogo from "@/assets/berlioz-logo.png";

const ALLOWED = ["hola@berlioz.mx", "oscar@berlioz.mx"];

const AdminLoginPage = () => {
  const [params] = useSearchParams();
  const returnUrl = params.get("returnUrl") || "/admin/pedidos";
  const { isAdmin, user, loading } = useIsAdmin();
  const { signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setError(null); }, [email]);

  if (!loading && user && isAdmin) return <Navigate to={returnUrl} replace />;

  const google = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/admin/login`,
    });
    if (error) setError(error.message ?? "No se pudo iniciar con Google");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ALLOWED.includes(email.trim().toLowerCase())) {
      setError("Este correo no tiene acceso al panel.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError("Correo o contraseña incorrectos.");
    setBusy(false);
  };

  const denied = !loading && user && !isAdmin;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <img src={berliozLogo} alt="Berlioz" className="h-7 mx-auto mb-6" />
          <h1 className="font-heading text-2xl text-foreground">Panel de administrador</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">Acceso solo para el equipo Berlioz</p>
        </div>

        {denied ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="font-body text-sm text-destructive">
                {user?.email} no tiene acceso al panel. Entra con hola@berlioz.mx u oscar@berlioz.mx.
              </p>
            </div>
            <button onClick={signOut} className="w-full h-11 rounded-lg border border-border bg-card font-body text-sm">
              Cambiar de cuenta
            </button>
          </div>
        ) : (
          <>
            <button onClick={google} className="w-full h-11 rounded-lg border border-border bg-card font-body text-sm font-medium text-foreground hover:shadow-md transition-all mb-5">
              Continuar con Google
            </button>
            <form onSubmit={submit} className="space-y-3">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hola@berlioz.mx"
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña"
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              {error && <p className="font-body text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={busy} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm disabled:opacity-50">
                {busy ? "Entrando…" : "Entrar"}
              </button>
            </form>
            <p className="font-body text-xs text-muted-foreground text-center mt-4">
              ¿Sin contraseña? Usa Google o <a href="/recuperar-contrasena" className="underline">crea una aquí</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLoginPage;
