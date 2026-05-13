
-- companies: lock down to admins
DROP POLICY IF EXISTS "Anyone can read companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated can insert companies" ON public.companies;
CREATE POLICY "Admins can read companies" ON public.companies
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- sales_history: admin read only; writes via service role
DROP POLICY IF EXISTS "Sales history readable by anyone" ON public.sales_history;
DROP POLICY IF EXISTS "System can insert sales history" ON public.sales_history;
DROP POLICY IF EXISTS "System can update sales history" ON public.sales_history;
CREATE POLICY "Admins can read sales history" ON public.sales_history
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- catalog_import_runs: admin read only
DROP POLICY IF EXISTS "Import runs are publicly readable" ON public.catalog_import_runs;
CREATE POLICY "Admins can read import runs" ON public.catalog_import_runs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- generated_images_cache: drop public writes (edge function uses service role)
DROP POLICY IF EXISTS "System can insert cache" ON public.generated_images_cache;
DROP POLICY IF EXISTS "System can update cache" ON public.generated_images_cache;

-- productos: restrict writes to admins
DROP POLICY IF EXISTS "Auth write productos" ON public.productos;
DROP POLICY IF EXISTS "Auth update productos" ON public.productos;
DROP POLICY IF EXISTS "Auth delete productos" ON public.productos;
CREATE POLICY "Admins can insert productos" ON public.productos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update productos" ON public.productos
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete productos" ON public.productos
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- coupons: drop public update (service role bypasses RLS)
DROP POLICY IF EXISTS "System can update coupon usage" ON public.coupons;

-- quote_requests: drop leaky anon-view-all policy
DROP POLICY IF EXISTS "Anon can view own by id" ON public.quote_requests;

-- quote_proposals/packages/items: drop public insert (service role bypasses RLS)
DROP POLICY IF EXISTS "System can insert proposals" ON public.quote_proposals;
DROP POLICY IF EXISTS "System can insert packages" ON public.quote_packages;
DROP POLICY IF EXISTS "System can insert items" ON public.quote_package_items;

-- profiles: drop cross-domain read that leaks fiscal data
DROP POLICY IF EXISTS "Users can read profiles by domain" ON public.profiles;

-- Recreate popular_products_by_event with security_invoker
DROP VIEW IF EXISTS public.popular_products_by_event;
CREATE VIEW public.popular_products_by_event
WITH (security_invoker = true) AS
SELECT qr.event_type,
       qpi.product_name,
       qpi.product_id,
       qp.tier,
       count(*) AS times_included,
       count(qf.id) FILTER (WHERE qf.selected_tier = qp.tier) AS times_selected,
       count(qf.id) FILTER (WHERE qf.accepted = true) AS times_accepted,
       round(avg(qpi.unit_price), 2) AS avg_price,
       round(avg(qpi.score), 0) AS avg_score,
       round(avg(qr.people_count), 0) AS avg_people
FROM quote_package_items qpi
  JOIN quote_packages qp ON qp.id = qpi.package_id
  JOIN quote_proposals qpr ON qpr.id = qp.proposal_id
  JOIN quote_requests qr ON qr.id = qpr.quote_request_id
  LEFT JOIN quote_feedback qf ON qf.proposal_id = qpr.id
GROUP BY qr.event_type, qpi.product_name, qpi.product_id, qp.tier
ORDER BY (count(qf.id) FILTER (WHERE qf.selected_tier = qp.tier)) DESC, (count(*)) DESC;

-- Revoke execute on internal functions that should not be client-callable
REVOKE EXECUTE ON FUNCTION public.search_products_for_quote(text, text[], numeric, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated;
