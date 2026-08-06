import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, ChevronDown, LogOut, Package, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const WhatsAppIcon = ({ size = 20, color = "#014D6F" }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
  </svg>
);
import berliozLogo from "@/assets/berlioz-logo.png";

const NAV_LINKS = [
  { to: "/menu", label: "Realizar Pedido" },
  { to: "/cotizar", label: "Cotizar" },
  { to: "/recompensas", label: "Recompensas" },
  { to: "/contacto", label: "Contacto" },
];

const WHATSAPP_URL = "https://wa.me/525582375469";


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
        height: 64,
      }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 md:px-8 h-full">
        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center transition-transform duration-300 hover:scale-[1.04] active:scale-95" aria-label="Berlioz" style={{ textDecoration: 'none' }}>
          <img src={berliozLogo} alt="Berlioz" style={{ height: 44, width: 'auto', display: 'block' }} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center" style={{ gap: 28 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group relative transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: location.pathname === link.to ? 700 : 500,
                fontSize: 15,
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
        <div className="flex items-center" style={{ gap: 16 }}>
          {/* WhatsApp */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-80 active:scale-95"
            style={{ textDecoration: 'none', color: '#014D6F', fontSize: 14, fontFamily: "'Montserrat', sans-serif" }}
            aria-label="WhatsApp 55 8237 5469"
          >
            <WhatsAppIcon size={18} color="#014D6F" />
            55 8237 5469
          </a>

          {/* Cart — always visible */}
          <Link to="/carrito" className="relative p-1 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-110 active:scale-95" style={{ color: '#014D6F' }}>
            <ShoppingCart style={{ width: 18, height: 18 }} />
            {itemCount > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -2, right: -2, width: 16, height: 16, borderRadius: '50%',
                  background: '#014D6F', color: 'white', fontSize: 9, fontWeight: 700,
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
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center transition-transform duration-200 hover:scale-105 active:scale-95" style={{ gap: 6 }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="object-cover" style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid white' }} />
                  ) : (
                    <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: '50%', background: '#014D6F', color: 'white', fontSize: 12, fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>
                      {initials}
                    </div>
                  )}
                  <ChevronDown className="hidden md:block" style={{ width: 13, height: 13, color: '#014D6F' }} />
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
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#014D6F',
                color: 'white',
                textDecoration: 'none',
              }}
              title="Iniciar sesión"
            >
              <User style={{ width: 16, height: 16 }} />
            </Link>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" style={{ color: '#014D6F' }}>
            {mobileOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
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
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-2 active:scale-95 transition-transform" style={{ fontSize: 16, color: '#014D6F', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
              <WhatsAppIcon size={20} color="#014D6F" />
              55 8237 5469
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
