-- 1. sales_insights
CREATE TABLE IF NOT EXISTS public.sales_insights (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL,
  context_key  text NOT NULL,
  insight_text text NOT NULL,
  metadata     jsonb,
  updated_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insights_type ON public.sales_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_key  ON public.sales_insights(context_key);

ALTER TABLE public.sales_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insights publicly readable"
  ON public.sales_insights FOR SELECT
  USING (true);

-- 2. Extender la tabla quotes existente con las columnas que necesita ANA
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS user_message     text,
  ADD COLUMN IF NOT EXISTS categoria        text,
  ADD COLUMN IF NOT EXISTS num_personas     int,
  ADD COLUMN IF NOT EXISTS empresa          text,
  ADD COLUMN IF NOT EXISTS sector           text,
  ADD COLUMN IF NOT EXISTS proposal_text    text,
  ADD COLUMN IF NOT EXISTS insights_used    text[],
  ADD COLUMN IF NOT EXISTS final_order_id   text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- user_id ya existe pero es NOT NULL — relajarlo para permitir cotizaciones anónimas de ANA
ALTER TABLE public.quotes ALTER COLUMN user_id DROP NOT NULL;

-- people_count y event_type son NOT NULL en el esquema viejo — relajar para nuevas filas de ANA
ALTER TABLE public.quotes ALTER COLUMN people_count DROP NOT NULL;
ALTER TABLE public.quotes ALTER COLUMN event_type DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_status_v2  ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_empresa    ON public.quotes(empresa);
CREATE INDEX IF NOT EXISTS idx_quotes_created_v2 ON public.quotes(created_at DESC);

-- Política para permitir que la edge function (service role) y anon inserten cotizaciones de ANA
DROP POLICY IF EXISTS "Anon can insert ANA quotes" ON public.quotes;
CREATE POLICY "Anon can insert ANA quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anon can read own ANA quotes" ON public.quotes;
CREATE POLICY "Anon can read own ANA quotes"
  ON public.quotes FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());