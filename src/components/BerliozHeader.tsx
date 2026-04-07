import { Phone } from "lucide-react";

const BerliozHeader = () => (
  <header className="no-print sticky top-0 z-50" style={{ background: '#F7E8DF', borderBottom: '1px solid #E2D3CA', height: 68 }}>
    <div className="container max-w-5xl mx-auto flex items-center justify-between px-6 h-full">
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#014D6F', letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>
        BERLIOZ
      </span>
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <span style={{ fontSize: 12, color: '#888888', fontFamily: "'Montserrat', sans-serif" }}>Ciudad de México</span>
        <a href="tel:5582375469" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ fontSize: 12, color: '#014D6F', textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
          <Phone className="w-3 h-3" />
          55 8237 5469
        </a>
      </div>
    </div>
  </header>
);

export default BerliozHeader;
