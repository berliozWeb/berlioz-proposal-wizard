-- Add popularity_rank column
ALTER TABLE public.productos ADD COLUMN popularity_rank smallint DEFAULT NULL;

-- Populate popularity_rank from sales_history using name matching
WITH ranked AS (
  SELECT
    product_name,
    ROW_NUMBER() OVER (ORDER BY total_qty_sold DESC NULLS LAST) AS rk
  FROM public.sales_history
  WHERE total_qty_sold > 0
)
UPDATE public.productos p
SET popularity_rank = r.rk
FROM ranked r
WHERE LOWER(TRIM(p.nombre)) = LOWER(TRIM(r.product_name))
  AND p.activo = true
  AND p.tipo IN ('simple', 'variable');