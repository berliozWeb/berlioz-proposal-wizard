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
    <section className="max-w-6xl mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 64, borderTop: '1px solid #E2D3CA' }}>
      {/* Section heading */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <div style={{ width: 40, height: 2, background: '#014D6F', marginBottom: 10 }} />
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 26, color: '#014D6F' }}>
            Lo más pedido
          </h2>
          <p className="mt-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#888888' }}>
            Los favoritos de nuestros clientes corporativos
          </p>
        </div>
        <button type="button" onClick={handleViewMenu} className="hidden sm:flex items-center gap-1.5 transition-all duration-200 hover:gap-2.5" style={{ fontSize: 13, color: '#014D6F', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
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
                borderRadius: 12,
                border: '1px solid #E2D3CA',
                background: '#fff',
                boxShadow: '0 2px 10px rgba(1,77,111,0.05)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(1,77,111,0.10)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(1,77,111,0.05)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Image */}
              <Link to={`/producto/${item.id}`} className="relative overflow-hidden block" style={{ height: 180 }}>
                <img src={getProductImage(item.id)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg">
                     <Expand className="w-3.5 h-3.5" style={{ color: '#014D6F' }} />
                  </div>
                </div>
                {badgeLabel && (
                  <span className="absolute top-3 left-3" style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(1,77,111,0.75)', color: '#fff', letterSpacing: '0.04em', backdropFilter: 'blur(4px)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                    {badgeLabel}
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="p-3.5 flex flex-col flex-1">
                <Link to={`/producto/${item.id}`} className="block group/link">
                  <p className="truncate group-hover/link:opacity-80 transition-opacity" style={{ fontSize: 13, fontWeight: 700, color: '#014D6F', fontFamily: "'Montserrat', sans-serif" }}>
                    {item.name}
                  </p>
                </Link>
                <p className="mt-0.5 mb-3" style={{ fontSize: 13, color: '#014D6F', fontWeight: 700, letterSpacing: '1px', fontFamily: "'Montserrat', sans-serif" }}>
                  {priceLabel}
                </p>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="mt-auto w-full flex items-center justify-center gap-1.5 transition-colors duration-200"
                  style={{ height: 36, borderRadius: 8, background: '#014D6F', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'Montserrat', sans-serif", border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1A6485')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#014D6F')}
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
        <button type="button" onClick={handleViewMenu} style={{ fontSize: 13, color: '#014D6F', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
          Ver todo el menú →
        </button>
      </div>
    </section>
  );
};

export default TopSellers;
