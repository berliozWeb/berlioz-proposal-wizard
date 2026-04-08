
-- ═══════════════════════════════════════════════════════════
-- PHASE 1: Enrich existing productos table
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS dietary_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cotizable boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS score_comercial smallint DEFAULT 50,
  ADD COLUMN IF NOT EXISTS score_visual smallint DEFAULT 50,
  ADD COLUMN IF NOT EXISTS texto_busqueda text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'per_person',
  ADD COLUMN IF NOT EXISTS serves_up_to smallint,
  ADD COLUMN IF NOT EXISTS min_qty smallint;

-- Index for quoter retrieval
CREATE INDEX IF NOT EXISTS idx_productos_cotizable ON public.productos (cotizable, activo, categoria);
CREATE INDEX IF NOT EXISTS idx_productos_dietary ON public.productos USING GIN (dietary_tags);

-- ═══════════════════════════════════════════════════════════
-- PHASE 2: Product relations (cross-sell, substitutes, etc.)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.product_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id text NOT NULL,
  related_product_id text NOT NULL,
  relation_type text NOT NULL CHECK (relation_type IN ('cross_sell', 'substitute', 'upsell', 'complementary')),
  strength_score smallint DEFAULT 50,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (source_product_id, related_product_id, relation_type)
);

ALTER TABLE public.product_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product relations are publicly readable"
  ON public.product_relations FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════
-- PHASE 3: Quote request (separated from proposal)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  people_count int NOT NULL,
  event_date date,
  event_time text,
  delivery_time text,
  zip_code text,
  duration_hours numeric(4,1),
  budget_enabled boolean DEFAULT false,
  budget_per_person numeric(10,2),
  dietary_restrictions text[] DEFAULT '{}',
  contact_name text,
  company_name text,
  source_flow text DEFAULT 'cotizar',
  raw_payload jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quote requests"
  ON public.quote_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create quote requests"
  ON public.quote_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anon can create quote requests"
  ON public.quote_requests FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "Anon can view own by id"
  ON public.quote_requests FOR SELECT USING (user_id IS NULL);

-- ═══════════════════════════════════════════════════════════
-- PHASE 4: Quote proposals (each generation run)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.quote_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid REFERENCES public.quote_requests(id) ON DELETE CASCADE NOT NULL,
  engine_version text DEFAULT 'v1-heuristic',
  strategy_used text,
  fallback_used boolean DEFAULT false,
  total_estimated numeric(10,2),
  shipping_amount numeric(10,2) DEFAULT 360,
  tax_amount numeric(10,2),
  recommendation_summary text,
  reasoning_json jsonb DEFAULT '{}',
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE public.quote_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Proposals visible via quote request"
  ON public.quote_proposals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quote_requests qr
    WHERE qr.id = quote_request_id
    AND (qr.user_id = auth.uid() OR qr.user_id IS NULL)
  ));
CREATE POLICY "System can insert proposals"
  ON public.quote_proposals FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- PHASE 5: Quote packages (one row per tier)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.quote_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.quote_proposals(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL CHECK (tier IN ('esencial', 'equilibrado', 'experiencia')),
  title text NOT NULL,
  tagline text,
  subtotal numeric(10,2) DEFAULT 0,
  iva numeric(10,2) DEFAULT 0,
  shipping numeric(10,2) DEFAULT 360,
  total numeric(10,2) DEFAULT 0,
  price_per_person numeric(10,2) DEFAULT 0,
  recommendation_reason text,
  ranking_score smallint DEFAULT 50,
  is_recommended boolean DEFAULT false,
  highlights text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quote_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Packages visible via proposal"
  ON public.quote_packages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quote_proposals qp
    JOIN public.quote_requests qr ON qr.id = qp.quote_request_id
    WHERE qp.id = proposal_id
    AND (qr.user_id = auth.uid() OR qr.user_id IS NULL)
  ));
CREATE POLICY "System can insert packages"
  ON public.quote_packages FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- PHASE 6: Quote package items (detail per product)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.quote_package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES public.quote_packages(id) ON DELETE CASCADE NOT NULL,
  product_id text,
  parent_product_id text,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  computed_price numeric(10,2) NOT NULL DEFAULT 0,
  score smallint DEFAULT 50,
  recommendation_reason text,
  image_url text,
  image_source text DEFAULT 'product_image' CHECK (image_source IN ('product_image', 'parent_image', 'gallery_image', 'generated_prompt')),
  image_prompt text,
  source_type text DEFAULT 'supabase' CHECK (source_type IN ('supabase', 'deterministic-fallback')),
  swap_group text,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quote_package_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items visible via package"
  ON public.quote_package_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quote_packages qpk
    JOIN public.quote_proposals qp ON qp.id = qpk.proposal_id
    JOIN public.quote_requests qr ON qr.id = qp.quote_request_id
    WHERE qpk.id = package_id
    AND (qr.user_id = auth.uid() OR qr.user_id IS NULL)
  ));
CREATE POLICY "System can insert items"
  ON public.quote_package_items FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- PHASE 7: Quote feedback
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.quote_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.quote_proposals(id) ON DELETE CASCADE NOT NULL,
  selected_tier text,
  rating smallint,
  manual_changes jsonb DEFAULT '{}',
  products_removed text[] DEFAULT '{}',
  products_added text[] DEFAULT '{}',
  accepted boolean,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quote_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feedback insertable by anyone"
  ON public.quote_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Feedback visible via proposal"
  ON public.quote_feedback FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quote_proposals qp
    JOIN public.quote_requests qr ON qr.id = qp.quote_request_id
    WHERE qp.id = proposal_id
    AND (qr.user_id = auth.uid() OR qr.user_id IS NULL)
  ));

-- ═══════════════════════════════════════════════════════════
-- PHASE 8: Catalog import runs (audit trail)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.catalog_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file text,
  imported_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending',
  total_rows int DEFAULT 0,
  published_rows int DEFAULT 0,
  rows_with_missing_images int DEFAULT 0,
  warnings text[] DEFAULT '{}',
  normalization_summary jsonb DEFAULT '{}'
);

ALTER TABLE public.catalog_import_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Import runs are publicly readable"
  ON public.catalog_import_runs FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════
-- PHASE 9: RPC for product retrieval with scoring
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.search_products_for_quote(
  p_categoria text DEFAULT NULL,
  p_dietary_tags text[] DEFAULT '{}',
  p_budget_max numeric DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id text,
  nombre text,
  descripcion text,
  precio numeric,
  precio_min numeric,
  precio_max numeric,
  categoria text,
  tipo text,
  imagen_url text,
  parent_id text,
  dietary_tags text[],
  score_comercial smallint,
  score_visual smallint,
  pricing_model text,
  serves_up_to smallint,
  destacado boolean,
  variantes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id::text,
    p.nombre,
    p.descripcion,
    p.precio,
    p.precio_min,
    p.precio_max,
    p.categoria,
    p.tipo,
    p.imagen_url,
    p.parent_id,
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
    AND (
      array_length(p_dietary_tags, 1) IS NULL
      OR p.dietary_tags && p_dietary_tags
    )
  ORDER BY COALESCE(p.score_comercial, 50) DESC, COALESCE(p.destacado, false) DESC, p.nombre
  LIMIT p_limit;
$$;
