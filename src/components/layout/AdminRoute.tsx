import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (loading) return;
    if (!user) { setIsAdmin(false); return; }
    setIsAdmin(null);
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(data === true));
  }, [user, loading]);
  return { isAdmin, user, loading: loading || isAdmin === null };
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, user, loading } = useIsAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to={`/admin/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) return <Navigate to="/admin/login?denied=1" replace />;
  return <>{children}</>;
};

export default AdminRoute;
