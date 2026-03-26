import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import berliozLogo from "@/assets/berlioz-logo.png";

const NewPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [validRecovery, setValidRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery type in hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValidRecovery(true);
    }
    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 8) { setError("Mínimo 8 caracteres"); return; }

    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setDone(true);
    setLoading(false);
  };

  if (!validRecovery && !done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-body text-muted-foreground mb-4">Enlace inválido o expirado.</p>
          <Link to="/recuperar-contrasena" className="font-body text-sm text-secondary hover:underline">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link to="/"><img src={berliozLogo} alt="Berlioz" className="h-7 mx-auto mb-8" /></Link>
          <h1 className="font-heading text-3xl text-foreground">Nueva contraseña</h1>
        </div>

        {done ? (
          <div className="p-6 rounded-xl border border-success/20 bg-success/5 text-center">
            <p className="font-body text-sm text-foreground mb-4">✓ Contraseña actualizada</p>
            <button
              onClick={() => navigate("/login")}
              className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="font-body text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewPasswordPage;