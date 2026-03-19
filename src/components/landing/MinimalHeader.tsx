import berliozLogo from "@/assets/berlioz-logo.png";

interface MinimalHeaderProps {
  nombre: string;
  empresa: string;
  celular: string;
  onUpdate: (field: 'nombre' | 'empresa' | 'celular', value: string) => void;
}

const MinimalHeader = ({ nombre, empresa, celular, onUpdate }: MinimalHeaderProps) => (
  <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 h-[72px]">
      <img src={berliozLogo} alt="Berlioz" className="h-5 shrink-0" />
      <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
        <input
          type="text"
          value={nombre}
          onChange={(e) => onUpdate('nombre', e.target.value)}
          placeholder="Tu nombre"
          className="h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-[100px] max-w-[180px]"
        />
        <input
          type="text"
          value={empresa}
          onChange={(e) => onUpdate('empresa', e.target.value)}
          placeholder="Tu empresa"
          className="h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-[100px] max-w-[180px]"
        />
        <input
          type="tel"
          value={celular}
          onChange={(e) => onUpdate('celular', e.target.value)}
          placeholder="Tu celular"
          className="h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-[100px] max-w-[160px]"
        />
      </div>
      <span className="text-xs text-muted-foreground font-mono hidden lg:block shrink-0">
        CDMX
      </span>
    </div>
    {/* Mobile: compact form below logo */}
    <div className="sm:hidden flex items-center gap-2 px-4 pb-3">
      <input
        type="text"
        value={nombre}
        onChange={(e) => onUpdate('nombre', e.target.value)}
        placeholder="Nombre"
        className="h-8 px-2 text-xs rounded border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring flex-1"
      />
      <input
        type="text"
        value={empresa}
        onChange={(e) => onUpdate('empresa', e.target.value)}
        placeholder="Empresa"
        className="h-8 px-2 text-xs rounded border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring flex-1"
      />
      <input
        type="tel"
        value={celular}
        onChange={(e) => onUpdate('celular', e.target.value)}
        placeholder="Celular"
        className="h-8 px-2 text-xs rounded border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring flex-1"
      />
    </div>
  </header>
);

export default MinimalHeader;
