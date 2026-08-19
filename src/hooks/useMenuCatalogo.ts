import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductoCotizador, Variante } from "@/hooks/useMenuCotizador";

export type CategoriaMenu =
  | "Working Lunch"
  | "Desayuno"
  | "Coffee Break"
  | "Bebidas"
  | "Tortas Piropo"
  | "Entrega Especial"
  | "Vegano / Vegetariano";

const CATEGORIAS_MENU: { db: string; label: CategoriaMenu }[] = [
  { db: "Comida", label: "Working Lunch" },
  { db: "comida", label: "Working Lunch" },
  { db: "Working Lunch", label: "Working Lunch" },
  { db: "working_lunch", label: "Working Lunch" },
  { db: "Desayuno", label: "Desayuno" },
  { db: "desayuno", label: "Desayuno" },
  { db: "Coffee-break", label: "Coffee Break" },
  { db: "coffee-break", label: "Coffee Break" },
  { db: "Coffee Break", label: "Coffee Break" },
  { db: "coffee_break", label: "Coffee Break" },
  { db: "Bebida", label: "Bebidas" },
  { db: "bebida", label: "Bebidas" },
  { db: "Bebidas", label: "Bebidas" },
  { db: "bebidas", label: "Bebidas" },
  { db: "Tortas-piropo", label: "Tortas Piropo" },
  { db: "tortas-piropo", label: "Tortas Piropo" },
  { db: "Tortas Piropo", label: "Tortas Piropo" },
  { db: "tortas_piropo", label: "Tortas Piropo" },
  { db: "Entrega-especial", label: "Entrega Especial" },
  { db: "entrega-especial", label: "Entrega Especial" },
  { db: "Entrega Especial", label: "Entrega Especial" },
  { db: "entrega_especial", label: "Entrega Especial" },
  { db: "Vegano-vegetariano", label: "Vegano / Vegetariano" },
  { db: "vegano-vegetariano", label: "Vegano / Vegetariano" },
];

export const CATEGORIAS_MENU_ORDEN: CategoriaMenu[] = [
  "Working Lunch",
  "Desayuno",
  "Coffee Break",
  "Bebidas",
  "Tortas Piropo",
  "Entrega Especial",
  "Vegano / Vegetariano",
];

export function mapCategoriaMenu(raw: string | null): CategoriaMenu | null {
  if (!raw) return null;
  const found = CATEGORIAS_MENU.find((c) => c.db === raw);
  return found ? found.label : null;
}

function parseVariantes(product: any): Variante[] {
  const base: Variante = {
    variante_id: String(product.id),
    nombre_variante: product.nombre,
    nombre_display: product.nombre,
    precio: product.precio ?? 0,
    notas_precio: null,
    es_base: true,
    es_comida: "No",
    vegetariano: "No",
    vegano: "No",
    keto: "No",
    sin_gluten: "No",
    sin_lactosa: "No",
    img: product.imagen_url ?? null,
    wc_id: product.id,
  };

  const raw = product.variantes;
  if (typeof raw !== "string" || !raw.trim()) {
    return [base];
  }

  const names = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (names.length === 0) return [base];

  return names.map((name, idx) => ({
    variante_id: `${product.id}-${idx}`,
    nombre_variante: name,
    nombre_display: `${product.nombre} — ${name}`,
    precio: product.precio ?? 0,
    notas_precio: null,
    es_base: idx === 0,
    es_comida: "No",
    vegetariano: "No",
    vegano: "No",
    keto: "No",
    sin_gluten: "No",
    sin_lactosa: "No",
    img: product.imagen_url ?? null,
    wc_id: product.id,
  }));
}

function mapProducto(row: any): ProductoCotizador {
  const categoria = mapCategoriaMenu(row.categoria);
  return {
    product_id: String(row.id),
    nombre: row.nombre ?? "",
    categoria: categoria ?? row.categoria ?? "",
    segunda_categoria: null,
    subcategoria: null,
    tipo: row.tipo ?? "simple",
    desc_mini: row.descripcion_corta ?? null,
    desc_corta: row.descripcion_corta ?? null,
    desc_bullets: null,
    img_principal: row.imagen_url ?? null,
    img_fallback: row.imagen_url ?? null,
    galeria: row.imagen_url ? [row.imagen_url] : [],
    variantes: parseVariantes(row),
  };
}

interface MenuCatalogoData {
  productos: ProductoCotizador[];
  favoritos: ProductoCotizador[];
  porCategoria: Record<CategoriaMenu, ProductoCotizador[]>;
  categoriasPresentes: CategoriaMenu[];
}

async function fetchMenuCatalogo(): Promise<MenuCatalogoData> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .eq("woo_source", true)
    .in("tipo", ["simple", "variable"]);

  if (error) {
    throw new Error(`No se pudo cargar el menú: ${error.message}`);
  }

  const rows = (data || []).filter((r) => Boolean(r.categoria?.trim()));
  const productos = rows.map(mapProducto).filter((p) => p.categoria);

  const porCategoria: Record<CategoriaMenu, ProductoCotizador[]> = {
    "Working Lunch": [],
    Desayuno: [],
    "Coffee Break": [],
    Bebidas: [],
    "Tortas Piropo": [],
    "Entrega Especial": [],
    "Vegano / Vegetariano": [],
  };

  for (const p of productos) {
    const cat = p.categoria as CategoriaMenu;
    if (porCategoria[cat]) {
      porCategoria[cat].push(p);
    }
  }

  const categoriasPresentes = CATEGORIAS_MENU_ORDEN.filter(
    (cat) => porCategoria[cat].length > 0,
  );

  const favoritos = [...productos]
    .sort((a, b) => {
      const rowA = rows.find((r) => String(r.id) === a.product_id);
      const rowB = rows.find((r) => String(r.id) === b.product_id);
      return (rowB?.total_sales ?? 0) - (rowA?.total_sales ?? 0);
    })
    .slice(0, 12);

  return { productos, favoritos, porCategoria, categoriasPresentes };
}

export function useMenuCatalogo() {
  return useQuery<MenuCatalogoData, Error>({
    queryKey: ["menu-catalogo"],
    queryFn: fetchMenuCatalogo,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
