import { NavLink, Link } from "react-router-dom";
import { Package, Settings, BarChart3, Users, LogOut, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import berliozLogo from "@/assets/berlioz-logo.png";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/admin/pedidos", label: "Pedidos web", icon: Package },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
  { to: "/admin/insights", label: "Insights y tienda", icon: BarChart3 },
  { to: "/admin/customers", label: "Clientes", icon: Users },
];

const AdminLayout = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r border-border bg-card flex md:flex-col">
        <div className="hidden md:block p-5 border-b border-border">
          <Link to="/"><img src={berliozLogo} alt="Berlioz" className="h-6" /></Link>
          <p className="font-body text-[11px] text-muted-foreground mt-2">Panel de administrador</p>
        </div>
        <nav className="flex md:flex-col gap-1 p-2 overflow-x-auto flex-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => cn(
              "flex items-center gap-2 px-3 py-2 rounded-md font-body text-sm whitespace-nowrap transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block p-3 border-t border-border space-y-1">
          <p className="font-body text-[11px] text-muted-foreground truncate px-3">{user?.email}</p>
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-md font-body text-sm text-muted-foreground hover:bg-muted"><Home className="w-4 h-4" />Ver sitio</Link>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md font-body text-sm text-muted-foreground hover:bg-muted"><LogOut className="w-4 h-4" />Cerrar sesión</button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 min-w-0">
        <h1 className="font-heading text-2xl text-foreground mb-6">{title}</h1>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
