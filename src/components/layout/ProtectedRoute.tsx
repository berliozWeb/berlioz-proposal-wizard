import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If user has no profile or hasn't completed onboarding, redirect (unless already on onboarding)
  if (location.pathname !== "/onboarding") {
    if (!profile || !profile.onboarding_complete || !profile.profile_type) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;