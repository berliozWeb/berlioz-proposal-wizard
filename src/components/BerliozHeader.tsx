import berliozLogo from "@/assets/berlioz-logo.png";

const BerliozHeader = () => (
  <header className="no-print border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="container max-w-5xl mx-auto flex items-center justify-between py-4 px-6">
      <div className="flex items-center gap-3">
        <img src={berliozLogo} alt="Berlioz" className="h-6" />
        <span className="text-xs font-body text-muted-foreground tracking-[0.2em] uppercase">
          Catering Corporativo
        </span>
      </div>
      <span className="text-xs text-muted-foreground font-mono hidden sm:block">
        Ciudad de México
      </span>
    </div>
  </header>
);

export default BerliozHeader;
