-- Helper function to check admin role (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND admin_role = 'admin'
  );
$$;

-- New table for WooCommerce-sourced order items (separate from existing order_items)
CREATE TABLE IF NOT EXISTS public.woo_order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  woo_order_id      bigint NOT NULL,
  order_date        timestamptz,
  empresa           text,
  email             text,
  product_name      text,
  product_id        bigint,
  sku               text,
  category          text,
  quantity          integer,
  unit_price        numeric,
  order_total       numeric,
  delivery_date     text,
  delivery_schedule text,
  payment_method    text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_woo_oi_order_id ON public.woo_order_items(woo_order_id);
CREATE INDEX IF NOT EXISTS idx_woo_oi_empresa  ON public.woo_order_items(empresa);
CREATE INDEX IF NOT EXISTS idx_woo_oi_category ON public.woo_order_items(category);
CREATE INDEX IF NOT EXISTS idx_woo_oi_date     ON public.woo_order_items(order_date DESC);

ALTER TABLE public.woo_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view woo order items"
  ON public.woo_order_items FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Unique constraint to enable upsert in sales_insights
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_insights_type_key
  ON public.sales_insights(insight_type, context_key);

-- Admin policies for sales_insights (currently only public SELECT exists)
CREATE POLICY "Admins can insert insights"
  ON public.sales_insights FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update insights"
  ON public.sales_insights FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete insights"
  ON public.sales_insights FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can update quotes status (accept/reject)
CREATE POLICY "Admins can view all quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all quotes"
  ON public.quotes FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));