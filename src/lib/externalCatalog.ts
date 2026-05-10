import type { Producto } from '@/hooks/useProductos';

const CATALOG_URL =
  'https://rrfvdhegvgmejxmsdijn.supabase.co/functions/v1/get-catalog';

interface RemoteProduct {
  id: string;
  sku?: string | null;
  nombre: string;
  descripcion_corta?: string | null;
  descripcion_larga?: string | null;
  precio_base?: number | null;
  precio_max?: number | null;
  categoria?: string | null;
  imagen_url?: string | null;
  tags?: string[] | null;
  visible_en_web?: boolean;
  activo?: boolean;
}

interface RemoteCatalogResponse {
  productos: RemoteProduct[];
  total?: number;
  categorias?: string[];
}

function mapRemoteToProducto(r: RemoteProduct, idx: number): Producto {
  const isActive = (r.visible_en_web ?? true) && (r.activo ?? true);
  return {
    id: r.id,
    sku: r.sku ?? null,
    nombre: r.nombre,
    tipo: 'simple',
    categoria: r.categoria ?? null,
    precio: r.precio_base ?? null,
    precio_min: r.precio_base ?? null,
    precio_max: r.precio_max ?? null,
    precio_rebajado: null,
    descripcion: r.descripcion_larga ?? null,
    descripcion_corta: r.descripcion_corta ?? null,
    variante_nombre: null,
    variantes: null,
    imagen: null,
    imagen_url: r.imagen_url ?? null,
    parent_id: null,
    activo: isActive,
    destacado: false,
    orden: idx,
    created_at: null,
    popularity_rank: null,
    dietary_tags: r.tags ?? [],
  };
}

let cache: Promise<Producto[]> | null = null;

export function fetchExternalCatalog(): Promise<Producto[]> {
  if (!cache) {
    cache = (async () => {
      const res = await fetch(CATALOG_URL, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        cache = null;
        throw new Error(`Catálogo externo respondió ${res.status}`);
      }
      const json = (await res.json()) as RemoteCatalogResponse;
      const list = Array.isArray(json?.productos) ? json.productos : [];
      return list.map(mapRemoteToProducto);
    })();
  }
  return cache;
}

export function invalidateExternalCatalog() {
  cache = null;
}