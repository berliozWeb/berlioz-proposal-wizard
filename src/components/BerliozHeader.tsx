const BerliozHeader = () => (
  <header className="no-print border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="container max-w-5xl mx-auto flex items-center justify-between py-4 px-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-[0.2em] text-primary uppercase">
          BERLIOZ
        </h1>
        <p className="text-xs font-body text-muted-foreground tracking-widest uppercase">
          Catering Corporativo
        </p>
      </div>
      <span className="text-xs text-muted-foreground font-mono hidden sm:block">
        Ciudad de México
      </span>
    </div>
  </header>
);

export default BerliozHeader;
