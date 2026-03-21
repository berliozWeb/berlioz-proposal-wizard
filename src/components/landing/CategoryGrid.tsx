import { MENU_CATEGORY_LABELS, type MenuCategory } from "@/domain/entities/MenuItem";

const CDN = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';
const WP = 'https://berlioz.mx/wp-content/uploads';

const CATEGORY_IMAGES: Partial<Record<MenuCategory, string>> = {
  coffee_break: `${CDN}/coffeebreak_PM_qlk47d`,
  coffee_break_surtido: `${CDN}/Surtido-Camille-Berlioz-bocadillos_paaynm`,
  coffee_break_individual: `${CDN}/Panque-de-pera-con-chocolate-berlioz-zoom-1_qxvouv`,
  desayuno: `${CDN}/breakfast-ROMA-e1686675516812_bzzmzm`,
  working_lunch: `${CDN}/Pasta-al-pesto-Pink-box-Berlioz-1_ijlkbj`,
  working_lunch_economico: `${CDN}/comedorBERLIOZ_vvm0rz`,
  tortas: `${CDN}/piropo-surtida_efarqs`,
  bebidas: `${WP}/2023/03/Aguas-de-sabor-Berlioz.jpg.webp`,
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
