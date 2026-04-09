CREATE OR REPLACE FUNCTION public.search_products_for_quote(
  p_categoria text DEFAULT NULL::text,
  p_dietary_tags text[] DEFAULT '{}'::text[],
  p_budget_max numeric DEFAULT NULL::numeric,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id text, nombre text, descripcion text, precio numeric, precio_min numeric, precio_max numeric,
  categoria text, tipo text, imagen_url text, parent_id text, dietary_tags text[],
  score_comercial smallint, score_visual smallint, pricing_model text, serves_up_to smallint,
  destacado boolean, variantes text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    p.id::text, p.nombre, p.descripcion, p.precio, p.precio_min, p.precio_max,
    p.categoria, p.tipo, p.imagen_url, p.parent_id,
    COALESCE(p.dietary_tags, '{}'),
    COALESCE(p.score_comercial, 50::smallint),
    COALESCE(p.score_visual, 50::smallint),
    COALESCE(p.pricing_model, 'per_person'),
    p.serves_up_to,
    COALESCE(p.destacado, false),
    p.variantes
  FROM public.productos p
  WHERE p.activo = true
    AND COALESCE(p.cotizable, true) = true
    AND p.tipo IN ('simple', 'variable')
    AND (p_categoria IS NULL OR p.categoria = p_categoria)
    AND (p_budget_max IS NULL OR COALESCE(p.precio, p.precio_min, 0) <= p_budget_max)
  ORDER BY
    CASE WHEN array_length(p_dietary_tags, 1) IS NOT NULL AND p.dietary_tags && p_dietary_tags THEN 0 ELSE 1 END,
    COALESCE(p.score_comercial, 50) DESC,
    COALESCE(p.destacado, false) DESC,
    p.nombre
  LIMIT p_limit;
$$;