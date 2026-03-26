import BaseLayout from "@/components/layout/BaseLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AccountPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <BaseLayout>
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="font-heading text-3xl text-foreground mb-6">Mi cuenta</h1>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          )}
          <div>
            <label className="font-body text-xs text-muted-foreground uppercase tracking-wide">Nombre</label>
            <p className="font-body text-foreground">{profile?.full_name ?? "—"}</p>
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground uppercase tracking-wide">Email</label>
            <p className="font-body text-foreground">{user?.email ?? "—"}</p>
          </div>
          {profile?.company_name && (
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wide">Empresa</label>
              <p className="font-body text-foreground">{profile.company_name}</p>
            </div>
          )}
          {profile?.profile_type && (
            <div>
              <label className="font-body text-xs text-muted-foreground uppercase tracking-wide">Tipo</label>
              <p className="font-body text-foreground capitalize">{profile.profile_type}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="h-10 px-6 rounded-lg border border-border font-body text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </BaseLayout>
  );
};

export default AccountPage;