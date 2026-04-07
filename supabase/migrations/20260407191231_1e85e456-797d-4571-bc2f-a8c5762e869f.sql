CREATE TABLE IF NOT EXISTS public.productos (
  id            TEXT PRIMARY KEY,
  sku           TEXT,
  nombre        TEXT NOT NULL,
  tipo          TEXT,
  categoria     TEXT,
  precio        NUMERIC,
  precio_min    NUMERIC,
  precio_max    NUMERIC,
  precio_rebajado NUMERIC,
  descripcion   TEXT,
  variante_nombre TEXT,
  variantes     TEXT,
  imagen        TEXT,
  imagen_url    TEXT,
  parent_id     TEXT,
  activo        BOOLEAN DEFAULT true,
  destacado     BOOLEAN DEFAULT false,
  orden         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read productos" ON public.productos FOR SELECT USING (true);

CREATE POLICY "Auth write productos" ON public.productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update productos" ON public.productos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete productos" ON public.productos FOR DELETE TO authenticated USING (true);

CREATE INDEX productos_categoria_idx ON public.productos(categoria);
CREATE INDEX productos_activo_idx ON public.productos(activo);
CREATE INDEX productos_parent_idx ON public.productos(parent_id);
CREATE INDEX productos_tipo_idx ON public.productos(tipo);