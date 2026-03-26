import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Phone } from "lucide-react";
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
  const { user } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = isHome && !scrolled && !mobileOpen;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent"
          : "bg-card/95 backdrop-blur-md shadow-sm"
      )}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[72px]">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src={berliozLogo} alt="Berlioz" className="h-7" />
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
                  : transparent
                    ? "text-card"
                    : "text-foreground"
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

          {/* Avatar / Login */}
          {user ? (
            <Link
              to="/cuenta"
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-body font-semibold text-sm",
                "bg-primary text-primary-foreground"
              )}
            >
              {user.email?.[0]?.toUpperCase() ?? "U"}
            </Link>
          ) : (
            <Link
              to="/login"
              className={cn(
                "p-2 rounded-full transition-colors",
                transparent ? "text-card hover:bg-card/10" : "text-foreground hover:bg-muted"
              )}
            >
              <User className="w-5 h-5" />
            </Link>
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
                onClick={() => setMobileOpen(false)}
                className="block font-body text-base font-medium text-foreground py-2 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="tel:5582375469"
              className="flex items-center gap-2 font-mono text-sm text-secondary py-2"
            >
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