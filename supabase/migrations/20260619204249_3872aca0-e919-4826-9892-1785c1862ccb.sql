
-- 1. Add Woo tracking columns to productos
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS woo_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS woo_source BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Sync runs tracking table
CREATE TABLE IF NOT EXISTS public.woo_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('catalog', 'orders')),
  trigger TEXT NOT NULL DEFAULT 'manual' CHECK (trigger IN ('manual', 'cron')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  items_synced INTEGER NOT NULL DEFAULT 0,
  pages_fetched INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.woo_sync_runs TO authenticated;
GRANT ALL ON public.woo_sync_runs TO service_role;

ALTER TABLE public.woo_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync runs"
ON public.woo_sync_runs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_woo_sync_runs_kind_started
  ON public.woo_sync_runs (kind, started_at DESC);

-- 3. Enable pg_cron + pg_net for scheduled sync
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
