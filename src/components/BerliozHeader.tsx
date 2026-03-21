import { Phone } from "lucide-react";

const BerliozHeader = () => (
  <header className="no-print sticky top-0 z-50 bg-background/95 backdrop-blur-sm" style={{ borderBottom: '1px solid #E8E6DF' }}>
    <div className="container max-w-5xl mx-auto flex items-center justify-between px-6" style={{ height: 80 }}>
      <div className="flex flex-col">
        <span className="font-heading font-bold" style={{ fontSize: 28, letterSpacing: '0.15em', color: '#1C3A2F' }}>
          BERLIOZ
        </span>
        <span className="font-body uppercase" style={{ fontSize: 11, letterSpacing: '0.3em', color: '#C9973A', marginTop: -2 }}>
          Catering Corporativo
        </span>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <span className="font-body text-muted-foreground" style={{ fontSize: 12 }}>Ciudad de México</span>
        <a href="tel:5582375469" className="flex items-center gap-1.5 font-mono hover:opacity-80 transition-opacity" style={{ fontSize: 12, color: '#1C3A2F' }}>
          <Phone className="w-3 h-3" />
          55 8237 5469
        </a>
      </div>
    </div>
  </header>
);

export default BerliozHeader;
