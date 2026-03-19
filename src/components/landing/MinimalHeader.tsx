import berliozLogo from "@/assets/berlioz-logo.png";

const MinimalHeader = () => (
  <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 h-[56px]">
      <img src={berliozLogo} alt="Berlioz" className="h-5 shrink-0" />
      <span className="text-xs text-muted-foreground font-mono ml-auto shrink-0">
        CDMX
      </span>
    </div>
  </header>
);

export default MinimalHeader;
