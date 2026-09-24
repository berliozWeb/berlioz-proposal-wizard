CREATE TABLE public.order_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  woo_order_id bigint NOT NULL UNIQUE,
  google_event_id text,
  calendar_id text NOT NULL DEFAULT 'hola@berlioz.mx',
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_calendar_events TO service_role;
ALTER TABLE public.order_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins pueden ver eventos de calendario"
  ON public.order_calendar_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
GRANT SELECT ON public.order_calendar_events TO authenticated;
CREATE TRIGGER order_calendar_events_updated_at BEFORE UPDATE ON public.order_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();