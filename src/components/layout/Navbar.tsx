import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Phone, ChevronDown, LogOut, Package, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const NAV_LINKS = [
  { to: "/menu", label: "Realizar Pedido" },
  { to: "/cotizar", label: "Cotizar" },
  { to: "/recompensas", label: "Recompensas" },
  { to: "/contacto", label: "Contacto" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location.pathname]);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: '#F7E8DF',
        borderBottom: '1px solid #E2D3CA',
        height: 68,
      }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 h-full">
        {/* Logo */}
        <Link to="/" className="shrink-0" style={{ letterSpacing: '0.18em', fontSize: 20, fontWeight: 700, color: '#014D6F', textTransform: 'uppercase' as const, textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
          BERLIOZ
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center" style={{ gap: 36 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative transition-colors"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: location.pathname === link.to ? 700 : 500,
                fontSize: 14,
                color: '#014D6F',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#1A6485'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#014D6F'; }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center" style={{ gap: 20 }}>
          {/* Phone */}
          <a
            href="tel:5582375469"
            className="hidden lg:flex items-center transition-opacity hover:opacity-80"
            style={{ gap: 6, textDecoration: 'none', color: '#014D6F', fontSize: 13, fontFamily: "'Montserrat', sans-serif" }}
          >
            <Phone style={{ width: 14, height: 14, color: '#014D6F' }} />
            55 8237 5469
          </a>

          {/* Cart — always visible */}
          <Link to="/menu" className="relative p-1.5" style={{ color: '#014D6F' }}>
            <ShoppingCart style={{ width: 20, height: 20 }} />
            {itemCount > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
                  background: '#014D6F', color: 'white', fontSize: 10, fontWeight: 700,
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center" style={{ gap: 8 }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="object-cover" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid white' }} />
                  ) : (
                    <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: '50%', background: '#014D6F', color: 'white', fontSize: 13, fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
                      {initials}
                    </div>
                  )}
                  <ChevronDown className="hidden md:block" style={{ width: 14, height: 14, color: '#014D6F' }} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 animate-slide-up" style={{ width: 224, background: 'white', borderRadius: 12, border: '1px solid #E2D3CA', boxShadow: '0 8px 24px rgba(1,77,111,0.12)', padding: '8px 0' }}>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid #E2D3CA', marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#014D6F', fontFamily: "'Montserrat', sans-serif" }} className="truncate">
                        {profile?.full_name ?? "Usuario"}
                      </p>
                      {profile?.company_name && (
                        <p style={{ fontSize: 12, color: '#888888', fontFamily: "'Montserrat', sans-serif" }} className="truncate">{profile.company_name}</p>
                      )}
                    </div>
                    <Link to="/cuenta" className="flex items-center transition-colors hover:bg-muted" style={{ gap: 12, padding: '10px 16px', fontSize: 14, color: '#014D6F', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
                      <UserCircle style={{ width: 16, height: 16, color: '#888888' }} /> Mi cuenta
                    </Link>
                    <Link to="/dashboard/pedidos" className="flex items-center transition-colors hover:bg-muted" style={{ gap: 12, padding: '10px 16px', fontSize: 14, color: '#014D6F', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
                      <Package style={{ width: 16, height: 16, color: '#888888' }} /> Mis pedidos
                    </Link>
                    <div style={{ borderTop: '1px solid #E2D3CA', marginTop: 4, paddingTop: 4 }}>
                      <button onClick={handleSignOut} className="flex items-center w-full transition-colors hover:bg-muted" style={{ gap: 12, padding: '10px 16px', fontSize: 14, color: '#B20000', fontFamily: "'Montserrat', sans-serif" }}>
                        <LogOut style={{ width: 16, height: 16 }} /> Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex items-center justify-center transition-all hover:opacity-80"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#014D6F',
                color: 'white',
                textDecoration: 'none',
              }}
              title="Iniciar sesión"
            >
              <User style={{ width: 18, height: 18 }} />
            </Link>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" style={{ color: '#014D6F' }}>
            {mobileOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden animate-slide-up" style={{ background: '#F7E8DF', borderTop: '1px solid #E2D3CA' }}>
          <div style={{ padding: '16px 24px' }} className="space-y-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="block py-2 transition-colors hover:opacity-80" style={{ fontSize: 16, fontWeight: 500, color: '#014D6F', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link to="/login" className="block py-2" style={{ fontSize: 16, fontWeight: 500, color: '#1A6485', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
                Iniciar sesión
              </Link>
            )}
            {user && (
              <button onClick={handleSignOut} className="block py-2" style={{ fontSize: 16, fontWeight: 500, color: '#B20000', fontFamily: "'Montserrat', sans-serif" }}>
                Cerrar sesión
              </button>
            )}
            <a href="tel:5582375469" className="flex items-center py-2" style={{ gap: 8, fontSize: 14, color: '#014D6F', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
              <Phone style={{ width: 16, height: 16 }} /> 55 8237 5469
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
