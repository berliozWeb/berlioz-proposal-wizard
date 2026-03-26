import BaseLayout from "@/components/layout/BaseLayout";
import { useAuth } from "@/contexts/AuthContext";

const AccountPage = () => {
  const { user, signOut } = useAuth();

  return (
    <BaseLayout>
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="font-heading text-3xl text-foreground mb-6">Mi cuenta</h1>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground uppercase tracking-wide">Email</label>
            <p className="font-body text-foreground">{user?.email ?? "—"}</p>
          </div>
          <button
            onClick={signOut}
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