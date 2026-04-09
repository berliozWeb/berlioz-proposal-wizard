ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_zone INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost_breakdown JSONB;