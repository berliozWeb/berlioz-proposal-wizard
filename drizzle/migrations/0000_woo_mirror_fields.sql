ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS woo_categorias text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS permalink text,
  ADD COLUMN IF NOT EXISTS woo_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS en_stock boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS menu_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upsell_ids bigint[] DEFAULT '{}'::bigint[],
  ADD COLUMN IF NOT EXISTS imagenes_galeria text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS woo_variaciones jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS woo_status text;

CREATE INDEX IF NOT EXISTS productos_woo_categorias_idx ON public.productos USING gin (woo_categorias);
CREATE INDEX IF NOT EXISTS productos_activo_woo_source_idx ON public.productos (activo, woo_source);

CREATE TABLE IF NOT EXISTS public.catalogo_exclusiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origen text NOT NULL,
  nombre_buscado text NOT NULL,
  motivo text NOT NULL,
  detalle jsonb NOT NULL DEFAULT '{}'::jsonb,
  woo_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.catalogo_exclusiones TO authenticated;
GRANT ALL ON public.catalogo_exclusiones TO service_role;

ALTER TABLE public.catalogo_exclusiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins pueden ver exclusiones de catalogo"
ON public.catalogo_exclusiones
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));