DROP FUNCTION IF EXISTS public.trigger_woo_catalog_sync();
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_woo_catalog_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://tmeqfvyolasxznyxyvmr.supabase.co/functions/v1/woo-catalog-sync?trigger=cron',
    body := '{}',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZXFmdnlvbGFzeHpueXh5dm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzUyODksImV4cCI6MjA4OTk1MTI4OX0.Qf9xwvlQDl1i9jJVbJBKVRtvZzO8OGakKKgBwg5HW1I'
    )
  ) INTO _request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() FROM anon;
GRANT EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() TO service_role;
