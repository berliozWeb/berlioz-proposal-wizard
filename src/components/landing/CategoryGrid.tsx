import { MENU_CATEGORY_LABELS, type MenuCategory } from "@/domain/entities/MenuItem";
import { CATEGORY_IMAGES as CL_CATEGORY_IMAGES } from "@/domain/entities/ProductImages";
import { ArrowRight } from "lucide-react";

const CATEGORY_DESCRIPTORS: Partial<Record<MenuCategory, string>> = {
  coffee_break: 'Desde 4 personas',
  coffee_break_surtido: 'Para compartir',
  coffee_break_individual: 'El complemento perfecto',
  desayuno: '7am en adelante',
  working_lunch: 'El favorito de Berlioz',
  working_lunch_economico: 'El favorito de Berlioz',
  tortas: 'Gourmet · Desde $280',
  bebidas: 'El complemento perfecto',
};

interface CategoryGridProps {
  onSelect: (cat: MenuCategory) => void;
  isLeadComplete: boolean;
  onIncompleteClick: () => void;
}

const CategoryGrid = ({ onSelect, isLeadComplete, onIncompleteClick }: CategoryGridProps) => {
  const categories = Object.entries(MENU_CATEGORY_LABELS) as [MenuCategory, string][];

  const handleSelect = (cat: MenuCategory) => {
    if (!isLeadComplete) { onIncompleteClick(); return; }
    onSelect(cat);
  };

  return (
    <section className="max-w-6xl mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 80, borderTop: '1px solid #E2D3CA' }}>
      {/* Section heading */}
      <div style={{ width: 40, height: 2, background: '#014D6F', marginBottom: 10 }} />
      <div className="flex items-end justify-between mb-7">
        <div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 26, color: '#014D6F' }}>
            Explora por categoría
          </h2>
          <p className="mt-1" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: '#888888' }}>
            Desayuno · Coffee Break · Working Lunch · Tortas Gourmet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(key)}
            className="group relative overflow-hidden text-left"
            style={{
              borderRadius: 12,
              height: 220,
              boxShadow: '0 2px 10px rgba(1,77,111,0.07)',
              transition: 'box-shadow 0.3s, transform 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(1,77,111,0.18)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(1,77,111,0.07)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <img
              src={(CL_CATEGORY_IMAGES as Record<string, string>)[key] || CL_CATEGORY_IMAGES.working_lunch}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />

            <div className="absolute inset-0 transition-opacity duration-300" style={{ background: 'linear-gradient(to top, rgba(1,77,111,0.85) 0%, rgba(1,77,111,0.25) 55%, transparent 100%)' }} />

            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div>
                <span className="block" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 19, lineHeight: 1.2, color: 'white' }}>
                  {label}
                </span>
                {CATEGORY_DESCRIPTORS[key] && (
                  <span className="block mt-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', letterSpacing: '0.02em', fontFamily: "'Montserrat', sans-serif" }}>
                    {CATEGORY_DESCRIPTORS[key]}
                  </span>
                )}
              </div>

              <span
                className="inline-flex items-center justify-center rounded-full transition-all duration-300 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                style={{ width: 30, height: 30, background: '#EDD9C8', flexShrink: 0 }}
              >
                <ArrowRight style={{ width: 14, height: 14, color: '#014D6F' }} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
