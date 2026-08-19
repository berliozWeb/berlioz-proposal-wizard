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
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[\s_/-]+/g, " ")
      .trim();
  const target = norm(raw);
  const found = CATEGORIAS_MENU.find(
    (c) => norm(c.db) === target || norm(c.label) === target,
  );
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

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  let text = html;
  // Los datos de Woo pueden venir con HTML escapado y anidado: decodificar y
  // limpiar en varias pasadas hasta que no queden etiquetas ni entidades.
  for (let i = 0; i < 3; i++) {
    const before = text;
    text = new DOMParser().parseFromString(text, "text/html").body.textContent || "";
    text = text
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|li|ul|ol|div|h[1-6])>/gi, " ")
      .replace(/<[^>]*>/g, " ");
    if (text === before) break;
  }
  const cleaned = text
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s*-\s*/g, " · ")
    .replace(/\s*·\s*(?=·)/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[·\s.,;]+|[·\s;,]+$/g, "")
    .trim();
  return cleaned || null;
}

function mapProducto(row: any): ProductoCotizador {
  const categoria = mapCategoriaMenu(row.categoria);
  const descCorta = stripHtml(row.descripcion_corta) || stripHtml(row.descripcion) || null;
  return {
    product_id: String(row.id),
    nombre: row.nombre ?? "",
    categoria: categoria ?? row.categoria ?? "",
    segunda_categoria: null,
    subcategoria: null,
    tipo: row.tipo ?? "simple",
    desc_mini: descCorta ? descCorta.slice(0, 120) : null,
    desc_corta: descCorta,
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

  // Orden global: más vendidos primero (según total_sales de WooCommerce)
  const rows = (data || [])
    .filter((r) => Boolean(r.categoria?.trim()))
    .sort((a: any, b: any) => (Number(b.total_sales) || 0) - (Number(a.total_sales) || 0));
  const productos = rows
    .map(mapProducto)
    .filter((p) => Boolean(mapCategoriaMenu(p.categoria)));

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

  // `productos` ya viene ordenado por ventas, igual que cada categoría.
  const favoritos = productos.slice(0, 12);

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
