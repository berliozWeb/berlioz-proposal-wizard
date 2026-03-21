import type { MenuItem } from "@/domain/entities/MenuItem";
import { getTopSellers, getDisplayPrice } from "@/domain/entities/MenuCatalog";
import { formatMXN } from "@/domain/value-objects/Money";
import { Plus } from "lucide-react";

interface TopSellersProps {
  onAdd: (item: MenuItem) => void;
  onViewMenu: () => void;
}

const TopSellers = ({ onAdd, onViewMenu }: TopSellersProps) => {
  const items = getTopSellers();

  return (
    <section className="max-w-6xl mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 64, borderTop: '1px solid #E8E6DF' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* Gold line accent */}
          <div style={{ width: 40, height: 2, background: '#C9973A', marginBottom: 12 }} />
          <h2 className="font-heading font-bold" style={{ fontSize: 24, color: '#1C3A2F' }}>
            Lo más pedido
          </h2>
        </div>
        <button
          type="button"
          onClick={onViewMenu}
          className="font-body font-medium hover:underline"
          style={{ fontSize: 14, color: '#C9973A' }}
        >
          Ver todo →
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-3 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
        {items.map((item) => {
          const displayPrice = getDisplayPrice(item, 10);
          const priceLabel = item.pricingModel === 'per_group'
            ? `~${formatMXN(displayPrice)}/pers (10p)`
            : item.pricingModel === 'fixed'
              ? formatMXN(item.pricePerPerson)
              : `${formatMXN(item.pricePerPerson)}/pers`;

          return (
            <div
              key={item.id}
              className="snap-start shrink-0 w-48 overflow-hidden group"
              style={{ borderRadius: 12, border: '1px solid #E8E6DF', background: '#fff' }}
            >
              {/* Photo takes ~65% of card */}
              <div className="overflow-hidden" style={{ height: 180 }}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-3xl">
                    🍽
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-body font-bold truncate" style={{ fontSize: 14, color: '#1C3A2F' }}>
                  {item.name}
                </p>
                <p className="font-mono mt-0.5" style={{ fontSize: 14, color: '#C9973A' }}>
                  {priceLabel}
                </p>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="mt-2.5 w-full flex items-center justify-center gap-1 font-body font-semibold transition-colors"
                  style={{
                    height: 34,
                    borderRadius: 8,
                    background: '#1C3A2F',
                    color: '#fff',
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2A5445')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1C3A2F')}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TopSellers;
