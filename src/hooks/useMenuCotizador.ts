import { useQuery } from "@tanstack/react-query";

export const MENU_COTIZADOR_URL =
  "https://rrfvdhegvgmejxmsdijn.supabase.co/functions/v1/get-menu-cotizador";

export type SiNo = "Sí" | "Si" | "No" | "No aplica" | string | null;

export interface Variante {
  variante_id: string;
  nombre_variante: string | null;
  nombre_display?: string | null;
  precio: number;
  notas_precio?: string | null;
  es_base?: boolean;
  es_comida: SiNo;
  vegetariano: SiNo;
  vegano: SiNo;
  keto: SiNo;
  sin_gluten: SiNo;
  sin_lactosa: SiNo;
  img: string | null;
  wc_nombre?: string | null;
  wc_id?: string | number | null;
}

export type CategoriaCotizador =
  | "Desayuno"
  | "Coffee Break"
  | "Comida"
  | "Torta Piropo"
  | "Bebida";

export interface ProductoCotizador {
  product_id: string;
  nombre: string;
  categoria: CategoriaCotizador | string;
  segunda_categoria: string | null;
  subcategoria: string | null;
  tipo?: string;
  desc_mini: string | null;
  desc_corta: string | null;
  desc_bullets: string | null;
  img_principal: string | null;
  img_fallback: string | null;
  galeria: string[];
  variantes: Variante[];
}

interface MenuResponse {
  productos: ProductoCotizador[];
  total?: number;
}

export const CATEGORIAS_COTIZADOR: CategoriaCotizador[] = [
  "Desayuno",
  "Coffee Break",
  "Comida",
  "Torta Piropo",
  "Bebida",
];

/** Yes-only check: "Sí"/"Si" → true. "No"/"No aplica"/null → false. */
export function isYes(v: SiNo | undefined): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === "sí" || s === "si";
}

/** Recommendation taxonomy: only Variante.es_comida === "Sí" counts as food. */
export function isVarianteComida(v: Variante): boolean {
  return isYes(v.es_comida);
}

/** Recommendation taxonomy: only Producto.categoria === "Bebida" counts as drink. */
export function isProductoBebida(p: ProductoCotizador): boolean {
  return p.categoria === "Bebida";
}

async function fetchMenuCotizador(): Promise<ProductoCotizador[]> {
  const res = await fetch(MENU_COTIZADOR_URL, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Menú cotizador respondió ${res.status}`);
  }
  const json = (await res.json()) as MenuResponse;
  return Array.isArray(json?.productos) ? json.productos : [];
}

export function useMenuCotizador() {
  return useQuery({
    queryKey: ["menu-cotizador"],
    queryFn: fetchMenuCotizador,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export type DietaryFilter =
  | "vegetariano"
  | "vegano"
  | "keto"
  | "sin_gluten"
  | "sin_lactosa";

export function varianteMatchesDietary(v: Variante, f: DietaryFilter): boolean {
  return isYes(v[f]);
}

export function productoHasDietary(p: ProductoCotizador, f: DietaryFilter): boolean {
  return p.variantes.some((v) => varianteMatchesDietary(v, f));
}