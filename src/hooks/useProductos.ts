import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    let q = supabase.from('productos').select('*').order('orden').order('nombre');

    if (filters.activo !== undefined) q = q.eq('activo', filters.activo);
    if (filters.categoria) q = q.eq('categoria', filters.categoria);
    if (filters.parent_id) q = q.eq('parent_id', filters.parent_id);
    if (filters.tipo) {
      if (Array.isArray(filters.tipo)) q = q.in('tipo', filters.tipo);
      else q = q.eq('tipo', filters.tipo);
    }

    q.then(({ data, error }) => {
      if (!error && data) setProductos(data as unknown as Producto[]);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { productos, loading };
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
