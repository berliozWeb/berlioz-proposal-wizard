import { supabase } from '@/integrations/supabase/client';
import type { Producto, ProductoVariante } from '@/hooks/useProductos';

/**
 * Espejo local de WooCommerce (tabla `productos`, filas con `woo_source`).
 * Regla absoluta: si no está publicado y activo en Woo, no existe aquí.
 */

interface WooVariacion {
  id?: string | number;
  woo_id?: number;
  sku?: string | null;
  opcion?: string | null;
  nombre?: string | null;
  precio?: number | null;
  imagen_url?: string | null;
  en_stock?: boolean;
}

function mapVariaciones(raw: unknown): ProductoVariante[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const list = (raw as WooVariacion[])
    .map((v) => ({
      id: String(v.id ?? v.woo_id ?? ''),
      sku: v.sku ?? null,
      nombre: String(v.nombre ?? v.opcion ?? ''),
      opcion: String(v.opcion ?? v.nombre ?? ''),
      precio: typeof v.precio === 'number' ? v.precio : null,
      imagen_url: v.imagen_url ?? null,
      en_stock: v.en_stock !== false,
    }))
    .filter((v) => v.id && v.opcion);
  return list.length > 0 ? list : null;
}

function mapRow(r: any, idx: number): Producto {
  const variaciones = mapVariaciones(r.woo_variaciones);
  const galeria = Array.isArray(r.imagenes_galeria) && r.imagenes_galeria.length > 0
    ? r.imagenes_galeria
    : r.imagen_url
      ? [r.imagen_url]
      : null;
  return {
    id: String(r.id),
    sku: r.sku ?? null,
    nombre: r.nombre ?? '',
    tipo: r.tipo ?? 'simple',
    categoria: r.categoria ?? null,
    precio: r.precio ?? r.precio_min ?? null,
    precio_min: r.precio_min ?? r.precio ?? null,
    precio_max: r.precio_max ?? r.precio ?? null,
    precio_rebajado: r.precio_rebajado ?? null,
    descripcion: r.descripcion ?? null,
    descripcion_corta: r.descripcion_corta ?? null,
    variante_nombre: null,
    variantes: r.variantes ?? null,
    imagen: null,
    imagen_url: r.imagen_url ?? null,
    imagenes_galeria: galeria,
    parent_id: r.parent_id ?? null,
    activo: r.activo !== false,
    destacado: r.destacado ?? false,
    orden: typeof r.menu_order === 'number' ? r.menu_order : idx,
    created_at: r.created_at ?? null,
    popularity_rank: r.popularity_rank ?? null,
    dietary_tags: Array.isArray(r.woo_tags) && r.woo_tags.length > 0
      ? r.woo_tags
      : (r.dietary_tags ?? []),
    variaciones,
    requiere_variante: r.tipo === 'variable' && !!variaciones?.length,
  };
}

let cache: Promise<Producto[]> | null = null;

export function fetchExternalCatalog(): Promise<Producto[]> {
  if (!cache) {
    cache = (async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('woo_source', true)
        .eq('activo', true)
        .order('total_sales', { ascending: false });
      if (error) {
        cache = null;
        throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
      }
      return (data ?? []).map(mapRow);
    })();
  }
  return cache;
}

export function invalidateExternalCatalog() {
  cache = null;
}
