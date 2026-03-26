import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Phone, ChevronDown, LogOut, Package, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import berliozLogo from "@/assets/berlioz-logo.png";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/menu", label: "Menú" },
  { to: "/cotizar", label: "Cotizar" },
  { to: "/dashboard/recompensas", label: "Recompensas" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location.pathname]);

  const transparent = isHome && !scrolled && !mobileOpen;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        transparent ? "bg-transparent" : "bg-card/95 backdrop-blur-md shadow-sm"
      )}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[72px]">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img
            src={berliozLogo}
            alt="Berlioz"
            className={cn("h-7 transition-all", transparent && "brightness-0 invert")}
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "font-body text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.to
                  ? "text-primary"
                  : transparent ? "text-card" : "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Phone - desktop only */}
          <a
            href="tel:5582375469"
            className={cn(
              "hidden lg:flex items-center gap-1.5 font-mono text-xs transition-colors hover:opacity-80",
              transparent ? "text-card" : "text-secondary"
            )}
          >
            <Phone className="w-3.5 h-3.5" />
            55 8237 5469
          </a>

          {user ? (
            <>
              {/* Cart */}
              <Link
                to="/checkout"
                className={cn(
                  "relative p-2 rounded-full transition-colors",
                  transparent ? "text-card hover:bg-card/10" : "text-foreground hover:bg-muted"
                )}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border-2 border-card"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-body font-semibold text-sm">
                      {initials}
                    </div>
                  )}
                  <ChevronDown className={cn("w-3.5 h-3.5 hidden md:block", transparent ? "text-card" : "text-foreground")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg py-2 animate-slide-up">
                    {/* User info */}
                    <div className="px-4 py-2 border-b border-border mb-1">
                      <p className="font-body text-sm font-semibold text-foreground truncate">
                        {profile?.full_name ?? "Usuario"}
                      </p>
                      {profile?.company_name && (
                        <p className="font-body text-xs text-muted-foreground truncate">{profile.company_name}</p>
                      )}
                    </div>

                    <Link
                      to="/cuenta"
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                      Mi cuenta
                    </Link>
                    <Link
                      to="/dashboard/pedidos"
                      className="flex items-center gap-3 px-4 py-2.5 font-body text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Package className="w-4 h-4 text-muted-foreground" />
                      Mis pedidos
                    </Link>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 font-body text-sm text-destructive hover:bg-muted transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Not logged in */}
              <Link
                to="/login"
                className={cn(
                  "hidden md:inline-flex items-center gap-1.5 h-9 px-4 rounded-lg font-body text-sm font-medium transition-colors",
                  transparent
                    ? "text-card hover:bg-card/10"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <User className="w-4 h-4" />
                Iniciar sesión
              </Link>
              <Link
                to="/cotizar"
                className="hidden md:inline-flex items-center h-9 px-5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Cotizar
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className={cn("md:hidden p-2", transparent ? "text-card" : "text-foreground")}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border animate-slide-up">
          <div className="px-6 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block font-body text-base font-medium text-foreground py-2 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                className="block font-body text-base font-medium text-secondary py-2"
              >
                Iniciar sesión
              </Link>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                className="block font-body text-base font-medium text-destructive py-2"
              >
                Cerrar sesión
              </button>
            )}
            <a href="tel:5582375469" className="flex items-center gap-2 font-mono text-sm text-secondary py-2">
              <Phone className="w-4 h-4" />
              55 8237 5469
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;