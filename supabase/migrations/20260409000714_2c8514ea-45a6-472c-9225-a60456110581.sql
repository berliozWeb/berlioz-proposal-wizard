CREATE TABLE IF NOT EXISTS public.generated_images_cache (
  product_id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_images_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cache readable by anyone"
  ON public.generated_images_cache
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert cache"
  ON public.generated_images_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update cache"
  ON public.generated_images_cache
  FOR UPDATE
  USING (true);