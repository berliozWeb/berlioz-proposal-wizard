import { useMemo } from 'react';
import { useProductos } from '@/hooks/useProductos';
import { SIDEBAR_CATEGORIES, type CatalogProduct } from '@/domain/entities/BerliozCatalog';

/**
 * DB category (productos.categoria) -> Sidebar pill in the cotizador.
 * Adjust when new categories are added in Supabase.
 */
const SIDEBAR_MAP: Record<string, string> = {
  'Desayuno': 'Desayuno',
  'Coffee Break': 'Coffee Break',
  'Working Lunch': 'Working Lunch',
  'Bebidas': 'Bebidas',
  'Snacks': 'Coffee Break', // snacks viven dentro de coffee break en la DB
  'Surtidos': 'Surtidos',
  'Tortas Piropo': 'Piropo',
  'Piropo': 'Piropo',
  'Vegano / Vegetariano': 'Vegano',
  'Entrega Especial': 'Entrega Especial',
};

const FALLBACK_BY_CATEGORY: Record<string, string> = {
  'Desayuno': 'https://berlioz.mx/wp-content/uploads/2023/03/berlioz_fabian-31.jpg',
  'Coffee Break': 'https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-46-1-scaled.jpg',
  'Working Lunch': 'https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-40-scaled-e1596130008398.jpg',
  'Bebidas': 'https://berlioz.mx/wp-content/uploads/2023/03/Aguas-de-sabor-Berlioz.jpg.webp',
  'Snacks': 'https://berlioz.mx/wp-content/uploads/2018/03/Snacks-saludables-Berlioz-scaled.jpg',
  'Surtidos': 'https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-46-1-scaled.jpg',
  'Piropo': 'https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-21-scaled.jpg',
};

export function getCategoryFallback(cat?: string | null): string {
  if (cat && FALLBACK_BY_CATEGORY[cat]) return FALLBACK_BY_CATEGORY[cat];
  return 'https://berlioz.mx/wp-content/uploads/2018/03/berlioz_fabian-46-1-scaled.jpg';
}

export interface QuoterCatalogItem extends CatalogProduct {
  imagen_url: string | null;
  descripcion?: string | null;
  categoriaDB?: string | null;
}

/** Returns active, cotizable products from Supabase mapped to CatalogProduct shape. */
export function useCatalogoCotizador(category?: string) {
  const { productos, loading } = useProductos({ activo: true, tipo: ['simple', 'variable'] });

  const items = useMemo<QuoterCatalogItem[]>(() => {
    return productos
      .filter(p => !!p.nombre)
      .map(p => {
        const sidebarCategory = SIDEBAR_MAP[p.categoria || ''] || 'Working Lunch';
        const price = Number(p.precio ?? p.precio_min ?? 0);
        return {
          id: p.id,
          name: p.nombre,
          price,
          category: 'working-lunch' as CatalogProduct['category'], // legacy field, unused in sidebar
          sidebarCategory,
          tags: p.dietary_tags || [],
          description: p.descripcion_corta || p.descripcion || undefined,
          isBestseller: !!p.destacado,
          isPerPerson: true,
          imagen_url: p.imagen_url || null,
          descripcion: p.descripcion,
          categoriaDB: p.categoria,
        };
      })
      .filter(p => !category || p.sidebarCategory === category);
  }, [productos, category]);

  return { items, loading };
}

/** Categorías visibles en el sidebar (orden importa). "Favoritos" y "Todos" son pestañas virtuales. */
export const QUOTER_SIDEBAR_CATEGORIES = [
  'Favoritos',
  'Todos',
  'Desayuno',
  'Coffee Break',
  'Working Lunch',
  'Bebidas',
  'Surtidos',
  'Vegano',
  'Piropo',
] as const;

export { SIDEBAR_CATEGORIES };
