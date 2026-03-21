import { Phone } from "lucide-react";
import berliozLogo from "@/assets/berlioz-logo.png";

const MinimalHeader = () => (
  <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm" style={{ borderBottom: '1px solid #E8E6DF' }}>
    <div className="max-w-6xl mx-auto flex items-center justify-between px-6" style={{ height: 80 }}>
      <img src={berliozLogo} alt="Berlioz" style={{ height: 28 }} />
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <span className="font-body text-muted-foreground" style={{ fontSize: 12 }}>
          Ciudad de México
        </span>
        <a
          href="tel:5582375469"
          className="flex items-center gap-1.5 font-mono hover:opacity-80 transition-opacity"
          style={{ fontSize: 12, color: 'hsl(var(--primary))' }}
        >
          <Phone className="w-3 h-3" />
          55 8237 5469
        </a>
      </div>
    </div>
  </header>
);

export default MinimalHeader;
