-- Dedupe: keep the most recent row per (woo_order_id, product_id)
DELETE FROM public.woo_order_items a
USING public.woo_order_items b
WHERE a.woo_order_id = b.woo_order_id
  AND a.product_id = b.product_id
  AND a.created_at < b.created_at;

-- If timestamps tied, fall back to id
DELETE FROM public.woo_order_items a
USING public.woo_order_items b
WHERE a.woo_order_id = b.woo_order_id
  AND a.product_id = b.product_id
  AND a.created_at = b.created_at
  AND a.id < b.id;

ALTER TABLE public.woo_order_items
  ADD CONSTRAINT woo_order_items_order_product_unique
  UNIQUE (woo_order_id, product_id);