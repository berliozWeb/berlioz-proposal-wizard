import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import berliozLogo from "@/assets/berlioz-logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else setSuccess("Revisa tu correo para confirmar tu cuenta.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={berliozLogo} alt="Berlioz" className="h-7 mx-auto mb-6" />
          <h1 className="font-heading text-2xl text-foreground">
            {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </h1>
        </div>

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
          <div>
            <label className="block font-body text-sm font-medium text-foreground mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-11 px-4 rounded-lg border border-border bg-card font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="font-body text-sm text-destructive">{error}</p>}
          {success && <p className="font-body text-sm text-success">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Cargando…" : isSignUp ? "Crear cuenta" : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-6 font-body text-sm text-muted-foreground">
          {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
            className="text-secondary font-medium hover:underline"
          >
            {isSignUp ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;