REVOKE EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() FROM anon;
GRANT EXECUTE ON FUNCTION public.trigger_woo_catalog_sync() TO service_role;