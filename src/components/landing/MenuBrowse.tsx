import type { MenuItem, MenuCategory } from "@/domain/entities/MenuItem";
import { MENU_CATEGORY_LABELS } from "@/domain/entities/MenuItem";
import { MENU_CATALOG, getByCategory, getDisplayPrice } from "@/domain/entities/MenuCatalog";
import { formatMXN } from "@/domain/value-objects/Money";
import { Plus, ArrowLeft, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuBrowseProps {
  activeCategory: MenuCategory | null;
  onSelectCategory: (cat: MenuCategory | null) => void;
  onAdd: (item: MenuItem) => void;
  cartCount: number;
  cartTotal: number;
  onCheckout: () => void;
  onBack: () => void;
}

const MenuBrowse = ({
  activeCategory,
  onSelectCategory,
  onAdd,
  cartCount,
  cartTotal,
  onCheckout,
  onBack,
}: MenuBrowseProps) => {
  const items = activeCategory ? getByCategory(activeCategory) : MENU_CATALOG;
  const categories = Object.entries(MENU_CATEGORY_LABELS) as [MenuCategory, string][];

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 animate-slide-in">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          {activeCategory ? MENU_CATEGORY_LABELS[activeCategory] : 'Todo el menú'}
        </h2>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            !activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          Todos
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectCategory(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              activeCategory === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-24">
        {items.map((item) => {
          const displayPrice = getDisplayPrice(item, 10);
          const priceLabel = item.pricingModel === 'per_group'
            ? `~${formatMXN(displayPrice)}/pers`
            : item.pricingModel === 'fixed'
              ? formatMXN(item.pricePerPerson)
              : `${formatMXN(item.pricePerPerson)}/pza`;

          return (
            <div key={item.id} className="rounded-xl overflow-hidden border border-border bg-card group">
              <div className="aspect-square overflow-hidden bg-muted">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-3xl">🍽</div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                {item.minQty && (
                  <p className="text-[10px] text-accent mt-0.5">Mín. {item.minQty} pzas</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono font-medium text-foreground">{priceLabel}</span>
                  <button
                    type="button"
                    onClick={() => onAdd(item)}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-forest text-forest-foreground border-t border-forest/20 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm font-medium">{cartCount} items · {formatMXN(cartTotal)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'hsl(38, 55%, 50%)', color: 'hsl(155, 38%, 10%)' }}
            >
              Ver propuesta →
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MenuBrowse;
