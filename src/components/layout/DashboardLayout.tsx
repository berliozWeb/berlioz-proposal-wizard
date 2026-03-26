import { Link, useLocation } from "react-router-dom";
import { Home, List, Users, Star, FileText, Settings, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import berliozLogo from "@/assets/berlioz-logo.png";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/dashboard/pedidos", label: "Mis Pedidos", icon: List },
  { to: "/dashboard/equipo", label: "Mi Equipo", icon: Users },
  { to: "/dashboard/recompensas", label: "Recompensas", icon: Star },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText, agencyOnly: true },
  { to: "/cuenta", label: "Configuración", icon: Settings },
];

const MOBILE_ITEMS = NAV_ITEMS.filter((_, i) => i < 5);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const location = useLocation();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.agencyOnly || profile?.profile_type === "agency"
  );
  const filteredMobile = MOBILE_ITEMS.filter(
    (item) => !item.agencyOnly || profile?.profile_type === "agency"
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-[72px]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card shrink-0 sticky top-[72px] h-[calc(100vh-72px)]">
          {/* User info */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-body font-semibold text-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-foreground truncate">{profile?.full_name ?? "Usuario"}</p>
                {profile?.company_name && (
                  <p className="font-body text-xs text-muted-foreground truncate">{profile.company_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-1">
            {filteredItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="p-4 border-t border-border">
            <Link
              to="/menu"
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors w-full"
            >
              <ShoppingBag className="w-4 h-4" />
              Hacer pedido
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex items-center justify-around h-16 px-2">
        {filteredMobile.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-body text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
