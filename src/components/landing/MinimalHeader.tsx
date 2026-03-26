import { Phone } from "lucide-react";
import berliozLogo from "@/assets/berlioz-logo.png";

const MinimalHeader = () => (
  <header
    className="sticky top-0 z-50 backdrop-blur-md"
    style={{
      background: 'rgba(255,255,255,0.88)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 1px 24px 0 rgba(0,61,91,0.06)',
    }}
  >
    <div className="max-w-6xl mx-auto flex items-center justify-between px-6" style={{ height: 72 }}>
      {/* Logo */}
      <img src={berliozLogo} alt="Berlioz" style={{ height: 26 }} />

      {/* Right side: catering label + phone */}
      <div className="flex items-center gap-5">
        <span
          className="hidden md:inline font-body uppercase tracking-widest"
          style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.22em' }}
        >
          Catering Corporativo · CDMX
        </span>

        {/* Gold divider */}
        <span
          className="hidden md:inline"
          style={{ width: 1, height: 28, background: 'hsl(var(--gold) / 0.4)', display: 'inline-block' }}
        />

        <a
          href="tel:5582375469"
          className="flex items-center gap-2 transition-opacity hover:opacity-75"
          style={{ textDecoration: 'none' }}
        >
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
              width: 28,
              height: 28,
              background: 'hsl(var(--gold) / 0.12)',
            }}
          >
            <Phone style={{ width: 12, height: 12, color: 'hsl(var(--gold))' }} />
          </span>
          <div className="hidden sm:flex flex-col">
            <span className="font-mono font-semibold" style={{ fontSize: 13, color: 'hsl(var(--primary))' }}>
              55 8237 5469
            </span>
            <span className="font-body" style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
              ¿Necesitas ayuda?
            </span>
          </div>
        </a>
      </div>
    </div>
  </header>
);

export default MinimalHeader;
