import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MENU_CATALOG } from "@/domain/entities/MenuCatalog";
import { MENU_CATEGORY_LABELS, BROWSE_CATEGORIES, type MenuCategory } from "@/domain/entities/MenuItem";
import type { PackageItem } from "@/domain/entities/Proposal";
import { getProductImage } from "@/domain/entities/ProductImages";
import { formatMXN } from "@/domain/value-objects/Money";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  currentItem: PackageItem;
  onSwap: (newItem: PackageItem) => void;
}

// Guess category from code
function guessCategory(code: string): MenuCategory {
  if (code.includes('cb_') || code.includes('coffee')) return 'coffee_break';
  if (code.includes('breakfast') || code.includes('desayuno') || code.includes('healthy')) return 'desayuno';
  if (code.includes('lunch') || code.includes('box') || code.includes('golden') || code.includes('salmon') || code.includes('pink') || code.includes('black') || code.includes('blt') || code.includes('aqua') || code.includes('green') || code.includes('white') || code.includes('mini_box') || code.includes('orzo')) return 'working_lunch';
  if (code.includes('agua') || code.includes('jugo') || code.includes('cafe') || code.includes('coca') || code.includes('sprite') || code.includes('fanta') || code.includes('san_pellegrino') || code.includes('bui')) return 'bebidas';
  if (code.includes('surtido') || code.includes('mini_surtido')) return 'coffee_break_surtido';
  return 'working_lunch';
}

const ProductSwapModal = ({ open, onClose, currentItem, onSwap }: Props) => {
  const defaultCat = guessCategory(currentItem.code);
  const [selectedCat, setSelectedCat] = useState<MenuCategory>(defaultCat);

  const filtered = MENU_CATALOG.filter(m => m.category === selectedCat);

  const handleSelect = (menuItem: typeof MENU_CATALOG[0]) => {
    const unitPrice = menuItem.pricePerPerson || 0;
    const newItem: PackageItem = {
      code: menuItem.id,
      name: menuItem.name,
      unitPrice,
      qtyPerPerson: 1,
      totalQty: currentItem.totalQty,
      subtotal: unitPrice * currentItem.totalQty,
    };
    onSwap(newItem);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Reemplazar: {currentItem.name}</DialogTitle>
        </DialogHeader>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 py-2 border-b border-border">
          {BROWSE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                selectedCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {MENU_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No hay productos en esta categoría</p>
          )}
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-left"
            >
              <img
                src={getProductImage(item.id)}
                alt={item.name}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
              </div>
              <span className="text-sm font-mono font-semibold text-foreground shrink-0">
                {item.pricePerPerson > 0 ? formatMXN(item.pricePerPerson) : 'Precio por grupo'}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSwapModal;
