import { useState } from "react";
import { ShoppingBag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  tags?: string[];
  isBestseller?: boolean;
  isPerPerson?: boolean;
}

const ProductCard = ({ id, name, description, price, image, tags, isBestseller, isPerPerson }: ProductCardProps) => {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id, name, price, image, isPerPerson });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        {isBestseller && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-body text-[10px] font-semibold uppercase tracking-wide">
            Bestseller
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-body text-sm font-semibold text-foreground leading-tight mb-1">{name}</h3>
        {description && (
          <p className="font-body text-xs text-muted-foreground line-clamp-2 mb-2">{description}</p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-blue-light font-body text-[10px] text-secondary font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-body text-base font-bold text-foreground">
              ${price.toLocaleString("es-MX")}
            </span>
            {isPerPerson && (
              <span className="font-body text-[10px] text-muted-foreground ml-1">/persona</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className={cn(
              "h-9 px-3 rounded-lg font-body text-xs font-semibold flex items-center gap-1.5 transition-all",
              added
                ? "bg-success text-success-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {added ? (
              "✓ Agregado"
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;