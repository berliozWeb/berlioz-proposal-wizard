
CREATE TABLE public.sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  product_sku text,
  product_id text,
  categoria text,
  total_qty_sold integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  unique_companies integer DEFAULT 0,
  avg_order_size numeric DEFAULT 0,
  top_companies text[] DEFAULT '{}',
  top_zip_codes text[] DEFAULT '{}',
  peak_months text[] DEFAULT '{}',
  common_time_slots text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales history readable by anyone"
  ON public.sales_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can insert sales history"
  ON public.sales_history FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "System can update sales history"
  ON public.sales_history FOR UPDATE
  TO public
  USING (true);
