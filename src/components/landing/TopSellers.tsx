import type { MenuItem } from "@/domain/entities/MenuItem";
import { getTopSellers } from "@/domain/entities/MenuCatalog";
import { formatMXN } from "@/domain/value-objects/Money";
import { Plus } from "lucide-react";

interface TopSellersProps {
  onAdd: (item: MenuItem) => void;
  onViewMenu: () => void;
}

const TopSellers = ({ onAdd, onViewMenu }: TopSellersProps) => {
  const items = getTopSellers();

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Lo más pedido
        </h2>
        <button
          type="button"
          onClick={onViewMenu}
          className="text-xs text-primary font-medium hover:underline"
        >
          Ver todo →
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {items.map((item) => (
          <div
            key={item.id}
            className="snap-start shrink-0 w-44 rounded-xl overflow-hidden border border-border bg-card group"
          >
            <div className="aspect-square overflow-hidden bg-muted">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-3xl">
                  🍽
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatMXN(item.pricePerPerson)}/persona</p>
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="mt-2 w-full flex items-center justify-center gap-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopSellers;
