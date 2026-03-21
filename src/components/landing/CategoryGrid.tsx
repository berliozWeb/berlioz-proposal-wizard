import { MENU_CATEGORY_LABELS, type MenuCategory } from "@/domain/entities/MenuItem";

const WP = 'https://berlioz.mx/wp-content/uploads';

const CATEGORY_IMAGES: Partial<Record<MenuCategory, string>> = {
  coffee_break: `${WP}/2025/08/coffeebreak_PM.jpg`,
  coffee_break_surtido: `${WP}/2023/03/Surtido-Camille-Berlioz-bocadillos.jpg`,
  coffee_break_individual: `${WP}/2020/03/berlioz_fabian-21-scaled.jpg`,
  desayuno: `${WP}/2023/03/berlioz_fabian-18-scaled-e1596123929266.jpg`,
  working_lunch: `${WP}/2023/03/cateringCorporativo12.jpg`,
  working_lunch_economico: `${WP}/2024/11/comedorBERLIOZ.jpg`,
  tortas: `${WP}/2021/03/piropo-surtida.jpg`,
  bebidas: `${WP}/2023/03/Aguas-de-sabor-Berlioz.jpg`,
};

interface CategoryGridProps {
  onSelect: (cat: MenuCategory) => void;
}

const CategoryGrid = ({ onSelect }: CategoryGridProps) => {
  const categories = Object.entries(MENU_CATEGORY_LABELS) as [MenuCategory, string][];

  return (
    <section id="category-grid" className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="font-heading text-lg font-semibold text-foreground mb-5">
        Explora por categoría
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] text-left"
          >
            {CATEGORY_IMAGES[key] ? (
              <img
                src={CATEGORY_IMAGES[key]}
                alt={label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <span className="absolute bottom-3 left-4 text-sm font-heading font-semibold text-white z-10">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
