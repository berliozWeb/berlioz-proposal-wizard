import { Phone } from "lucide-react";

const MinimalHeader = () => (
  <header
    className="sticky top-0 z-50"
    style={{
      background: 'rgba(247, 232, 223, 0.92)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid #E2D3CA',
      height: 68,
    }}
  >
    <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-full">
      {/* Logo */}
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#014D6F', letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>
        BERLIOZ
      </span>

      {/* Right side */}
      <div className="flex items-center" style={{ gap: 20 }}>
        <span
          className="hidden md:inline"
          style={{ fontSize: 11, color: '#888888', letterSpacing: '0.22em', textTransform: 'uppercase' as const, fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
        >
          Catering Corporativo · CDMX
        </span>

        {/* Divider */}
        <span className="hidden md:inline" style={{ width: 1, height: 28, background: '#E2D3CA', display: 'inline-block' }} />

        <a href="tel:5582375469" className="flex items-center transition-opacity hover:opacity-75" style={{ gap: 8, textDecoration: 'none' }}>
          <span className="inline-flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: 'rgba(1,77,111,0.1)' }}>
            <Phone style={{ width: 12, height: 12, color: '#014D6F' }} />
          </span>
          <div className="hidden sm:flex flex-col">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#014D6F', fontFamily: "'Montserrat', sans-serif" }}>
              55 8237 5469
            </span>
            <span style={{ fontSize: 10, color: '#888888', fontFamily: "'Montserrat', sans-serif" }}>
              ¿Necesitas ayuda?
            </span>
          </div>
        </a>
      </div>
    </div>
  </header>
);

export default MinimalHeader;
