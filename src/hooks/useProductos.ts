import { useState, useEffect } from 'react';
import { fetchExternalCatalog, invalidateExternalCatalog } from '@/lib/externalCatalog';

export interface Producto {
  id: string;
  sku: string | null;
  nombre: string;
  tipo: string | null;
  categoria: string | null;
  precio: number | null;
  precio_min: number | null;
  precio_max: number | null;
  precio_rebajado: number | null;
  descripcion: string | null;
  descripcion_corta: string | null;
  variante_nombre: string | null;
  variantes: string | null;
  imagen: string | null;
  imagen_url: string | null;
  parent_id: string | null;
  activo: boolean;
  destacado: boolean;
  orden: number;
  created_at: string | null;
  popularity_rank: number | null;
  dietary_tags: string[] | null;
}

interface Filters {
  activo?: boolean;
  categoria?: string;
  tipo?: string | string[];
  parent_id?: string;
}

export function useProductos(filters: Filters = {}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchExternalCatalog()
      .then((all) => {
        if (cancelled) return;
        const tipos = filters.tipo
          ? Array.isArray(filters.tipo)
            ? filters.tipo
            : [filters.tipo]
          : null;
        const filtered = all.filter((p) => {
          if (filters.activo !== undefined && p.activo !== filters.activo) return false;
          if (filters.categoria && p.categoria !== filters.categoria) return false;
          if (filters.parent_id && p.parent_id !== filters.parent_id) return false;
          if (tipos && !tipos.includes(p.tipo ?? '')) return false;
          return true;
        });
        setProductos(filtered);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[useProductos] catálogo externo falló:', err);
        setError('No pudimos cargar el catálogo. Intenta de nuevo.');
        setProductos([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filters), reloadKey]);

  const reload = () => {
    invalidateExternalCatalog();
    setReloadKey((k) => k + 1);
  };

  return { productos, loading, error, reload };
}

export function useMenuProductos(categoria?: string) {
  return useProductos({
    activo: true,
    tipo: ['simple', 'variable'],
    ...(categoria ? { categoria } : {}),
  });
}

export function useCatalogoCompleto() {
  return useProductos({ activo: true });
}

export function useVariantes(parentId: string) {
  return useProductos({ parent_id: parentId, tipo: 'variation' });
}
