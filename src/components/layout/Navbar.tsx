import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, ChevronDown, LogOut, Package, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import berliozLogo from "@/assets/berlioz-logo.png";

const NAV_LINKS = [
  { to: "/menu", label: "Realizar Pedido" },
  { to: "/cotizar", label: "Cotizar" },
  { to: "/recompensas", label: "Recompensas" },
  { to: "/contacto", label: "Contacto" },
];

const WHATSAPP_URL = "https://wa.me/525582375469";

const WhatsAppIcon = ({ size = 16, color = "white" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.8-.71-1.33-1.59-1.48-1.89-.15-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46s1.06 2.85 1.21 3.05c.15.2 2.06 3.28 5.02 4.48.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.55-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"/>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.13c-1.5 0-2.98-.4-4.27-1.17l-.31-.18-3.17.83.85-3.09-.2-.32a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.7 8.23 8.24 0 4.54-3.7 8.23-8.24 8.29z"/>
  </svg>
);

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
        height: 76,
      }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 h-full">
        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center transition-transform duration-300 hover:scale-[1.04] active:scale-95" aria-label="Berlioz" style={{ textDecoration: 'none' }}>
          <img src={berliozLogo} alt="Berlioz" style={{ height: 56, width: 'auto', display: 'block' }} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center" style={{ gap: 36 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group relative transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: location.pathname === link.to ? 700 : 500,
                fontSize: 16,
                color: '#014D6F',
                textDecoration: 'none',
              }}
            >
              {link.label}
              <span
                className="absolute left-0 -bottom-1 h-[2px] origin-left transition-transform duration-300 ease-out"
                style={{
                  width: '100%',
                  background: '#014D6F',
                  transform: location.pathname === link.to ? 'scaleX(1)' : 'scaleX(0)',
                }}
                data-underline
              />
              <span className="pointer-events-none absolute left-0 -bottom-1 h-[2px] w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" style={{ background: '#014D6F' }} />
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center" style={{ gap: 20 }}>
          {/* WhatsApp */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-95"
            style={{ gap: 8, textDecoration: 'none', color: '#014D6F', fontSize: 15, fontFamily: "'Montserrat', sans-serif" }}
          >
            <span className="inline-flex items-center justify-center rounded-full transition-colors duration-200" style={{ width: 32, height: 32, background: '#014D6F' }}>
              <WhatsAppIcon size={19} color="white" />
            </span>
            55 8237 5469
          </a>

          {/* Cart — always visible */}
          <Link to="/carrito" className="relative p-1.5 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-110 active:scale-95" style={{ color: '#014D6F' }}>
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
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center transition-transform duration-200 hover:scale-105 active:scale-95" style={{ gap: 8 }}>
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
              className="hidden md:inline-flex items-center justify-center transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95"
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
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center py-2 active:scale-95 transition-transform" style={{ gap: 8, fontSize: 16, color: '#014D6F', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
              <span className="inline-flex items-center justify-center rounded-full" style={{ width: 30, height: 30, background: '#014D6F' }}>
                <WhatsAppIcon size={18} color="white" />
              </span>
              55 8237 5469
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
