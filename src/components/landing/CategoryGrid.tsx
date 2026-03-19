import { MENU_CATEGORY_LABELS, type MenuCategory } from "@/domain/entities/MenuItem";

const CDN = 'https://res.cloudinary.com/dsr7tnfh6/image/upload/w_800,q_auto,f_auto';

const CATEGORY_IMAGES: Record<MenuCategory, string> = {
  coffee_break: `${CDN}/coffeebreak_PM_qlk47d`,
  desayuno: `${CDN}/Pan-dulce-Berlioz-desayuno-zoom_k4cqtv`,
  comida: `${CDN}/lunch-ciabatta_shrxzi`,
  tortas: `${CDN}/tortas_gourmet2_devjfz`,
  surtidos: `${CDN}/mini-BOX_ntjbxh`,
  bebidas: `${CDN}/Snacks-saludables-Berlioz-scaled_pukfu4`,
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] text-left"
          >
            <img
              src={CATEGORY_IMAGES[key]}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
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
