import { Link } from "react-router-dom";
import type { MenuItem } from "@/domain/entities/MenuItem";
import { getTopSellers, getDisplayPrice } from "@/domain/entities/MenuCatalog";
import { getProductImage } from "@/domain/entities/ProductImages";
import { formatMXN } from "@/domain/value-objects/Money";
import { MENU_CATEGORY_LABELS } from "@/domain/entities/MenuItem";
import { Plus, ArrowRight, Expand } from "lucide-react";

interface TopSellersProps {
  onAdd: (item: MenuItem) => void;
  onViewMenu: () => void;
  isLeadComplete: boolean;
  onIncompleteClick: () => void;
}

const CATEGORY_BADGES: Partial<Record<string, string>> = {
  coffee_break: 'Coffee Break',
  coffee_break_surtido: 'Coffee Break',
  coffee_break_individual: 'Coffee Break',
  desayuno: 'Desayuno',
  working_lunch: 'Working Lunch',
  working_lunch_economico: 'Working Lunch',
  tortas: 'Tortas Gourmet',
  bebidas: 'Bebida',
};

const TopSellers = ({ onAdd, onViewMenu, isLeadComplete, onIncompleteClick }: TopSellersProps) => {
  const items = getTopSellers();

  const handleViewMenu = () => {
    if (!isLeadComplete) { onIncompleteClick(); return; }
    onViewMenu();
  };

  return (
    <section
      className="max-w-6xl mx-auto px-6"
      style={{ paddingTop: 64, paddingBottom: 64, borderTop: '1px solid #E8E6DF' }}
    >
      {/* Section heading */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <div style={{ width: 40, height: 2, background: 'hsl(var(--gold))', marginBottom: 10 }} />
          <h2 className="font-heading text-foreground" style={{ fontSize: 26 }}>
            Lo más pedido
          </h2>
          <p className="font-body text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            Los favoritos de nuestros clientes corporativos
          </p>
        </div>
        <button
          type="button"
          onClick={handleViewMenu}
          className="hidden sm:flex items-center gap-1.5 font-body font-semibold transition-all duration-200 hover:gap-2.5"
          style={{ fontSize: 13, color: 'hsl(var(--gold))' }}
        >
          Ver todo
          <ArrowRight style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Horizontal scroll track */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-6 px-6 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => {
          const displayPrice = getDisplayPrice(item, 10);
          const priceLabel = item.pricingModel === 'per_group'
            ? `~${formatMXN(displayPrice)}/pers`
            : item.pricingModel === 'fixed'
              ? formatMXN(item.pricePerPerson)
              : `${formatMXN(item.pricePerPerson)}/pers`;

          const badgeLabel = CATEGORY_BADGES[item.category]
            ?? (MENU_CATEGORY_LABELS[item.category] || '');

          return (
            <div
              key={item.id}
              className="snap-start shrink-0 group flex flex-col overflow-hidden"
              style={{
                width: 208,
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.07)',
                background: '#fff',
                boxShadow: '0 2px 10px rgba(0,61,91,0.05)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,61,91,0.13)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(0,61,91,0.05)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Image */}
              <Link
                to={`/producto/${item.id}`}
                className="relative overflow-hidden block"
                style={{ height: 180 }}
              >
                <img 
                  src={getProductImage(item.id)} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" 
                />
                {/* Visual affordance */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg">
                     <Expand className="w-3.5 h-3.5 text-primary" />
                  </div>
                </div>
                {/* Category badge */}
                {badgeLabel && (
                  <span
                    className="absolute top-3 left-3 font-body font-semibold"
                    style={{
                      fontSize: 10,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(0,0,0,0.52)',
                      color: '#fff',
                      letterSpacing: '0.04em',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {badgeLabel}
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="p-3.5 flex flex-col flex-1">
                <Link to={`/producto/${item.id}`} className="block group/link">
                  <p className="font-body font-bold truncate group-hover/link:text-primary transition-colors" style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>
                    {item.name}
                  </p>
                </Link>
                <p className="font-mono mt-0.5 mb-3" style={{ fontSize: 13, color: 'hsl(var(--gold))' }}>
                  {priceLabel}
                </p>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="mt-auto w-full flex items-center justify-center gap-1.5 font-body font-semibold transition-colors duration-200"
                  style={{
                    height: 36,
                    borderRadius: 10,
                    background: 'hsl(var(--primary))',
                    color: '#fff',
                    fontSize: 12,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--secondary))')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(var(--primary))')}
                >
                  <Plus style={{ width: 13, height: 13 }} />
                  Agregar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile "Ver todo" */}
      <div className="sm:hidden text-center mt-5">
        <button
          type="button"
          onClick={handleViewMenu}
          className="font-body font-semibold"
          style={{ fontSize: 13, color: 'hsl(var(--gold))' }}
        >
          Ver todo el menú →
        </button>
      </div>
    </section>
  );
};

export default TopSellers;
