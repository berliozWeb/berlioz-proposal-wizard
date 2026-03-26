import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import berliozLogo from "@/assets/berlioz-logo.png";

const PasswordRecoveryPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={berliozLogo} alt="Berlioz" className="h-7 mx-auto mb-8" />
          </Link>
          <h1 className="font-heading text-3xl text-foreground">Recuperar contraseña</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {sent ? (
          <div className="p-6 rounded-xl border border-success/20 bg-success/5 text-center">
            <p className="font-body text-sm text-foreground mb-2">📬 Enlace enviado</p>
            <p className="font-body text-xs text-muted-foreground">
              Revisa tu bandeja de entrada en <strong>{email}</strong>
            </p>
            <Link to="/login" className="inline-block mt-4 font-body text-sm text-secondary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="tu@empresa.com"
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
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>

            <Link to="/login" className="block text-center font-body text-sm text-secondary hover:underline">
              ← Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordRecoveryPage;