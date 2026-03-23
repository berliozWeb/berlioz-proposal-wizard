import { useState } from "react";
import { MENU_CATALOG } from "@/domain/entities/MenuCatalog";
import { MENU_CATEGORY_LABELS, type MenuCategory } from "@/domain/entities/MenuItem";
import { getProductImage } from "@/domain/entities/ProductImages";
import { formatMXN } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";

const TABS: { cat: MenuCategory; label: string }[] = [
  { cat: 'desayuno', label: 'Desayuno' },
  { cat: 'coffee_break', label: 'Coffee Break' },
  { cat: 'working_lunch', label: 'Working Lunch' },
  { cat: 'coffee_break_surtido', label: 'Surtidos' },
  { cat: 'bebidas', label: 'Bebidas' },
  { cat: 'coffee_break_individual', label: 'Snacks' },
  { cat: 'tortas', label: 'Piropo' },
];

interface Props {
  packageName: string;
  onClose: () => void;
  onAdd: (item: typeof MENU_CATALOG[0]) => void;
}

const ProductBrowsePanel = ({ packageName, onClose, onAdd }: Props) => {
  const [tab, setTab] = useState<MenuCategory>('desayuno');
  const filtered = MENU_CATALOG.filter(m => m.category === tab);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground">Agregando a:</p>
          <p className="font-heading text-sm font-semibold text-foreground">{packageName}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground">✕</button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.cat}
            onClick={() => setTab(t.cat)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-all",
              tab === t.cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary/30 transition-all">
            <img src={getProductImage(item.id)} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.pricePerPerson > 0 ? formatMXN(item.pricePerPerson) : 'Precio por grupo'}</p>
            </div>
            <button
              onClick={() => onAdd(item)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
            >
              + Agregar
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No hay productos en esta categoría</p>
        )}
      </div>
    </div>
  );
};

export default ProductBrowsePanel;
