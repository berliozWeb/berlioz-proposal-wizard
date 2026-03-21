import { MENU_CATEGORY_LABELS, type MenuCategory } from "@/domain/entities/MenuItem";
import { CATEGORY_IMAGES as CL_CATEGORY_IMAGES } from "@/domain/entities/ProductImages";

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
    <section className="max-w-6xl mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 64, borderTop: '1px solid #E8E6DF' }}>
      <div style={{ width: 40, height: 2, background: 'hsl(var(--gold))', marginBottom: 12 }} />
      <h2 className="font-heading font-bold text-foreground mb-6" style={{ fontSize: 24 }}>
        Explora por categoría
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(key)}
            className="group relative overflow-hidden text-left"
            style={{ borderRadius: 16, height: 200 }}
          >
            <img
              src={(CL_CATEGORY_IMAGES as Record<string, string>)[key] || CL_CATEGORY_IMAGES.working_lunch}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(10,25,20,0.85) 0%, transparent 50%)' }}
            />
            <div className="absolute bottom-4 left-5 z-10">
              <span className="font-heading font-bold text-white block" style={{ fontSize: 20 }}>
                {label}
              </span>
              {CATEGORY_DESCRIPTORS[key] && (
                <span className="font-body text-white/75 block" style={{ fontSize: 11, marginTop: 2 }}>
                  {CATEGORY_DESCRIPTORS[key]}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
