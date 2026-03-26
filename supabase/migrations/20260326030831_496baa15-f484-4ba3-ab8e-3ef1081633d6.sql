
-- Scheduled orders table
CREATE TABLE public.scheduled_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  frequency text NOT NULL DEFAULT 'weekly',
  day_of_week integer NOT NULL DEFAULT 1,
  time_slot text NOT NULL,
  delivery_address_id uuid REFERENCES public.delivery_addresses(id),
  next_delivery_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled orders" ON public.scheduled_orders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER scheduled_orders_updated_at BEFORE UPDATE ON public.scheduled_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add notification_preferences and fiscal data to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{"order_confirmation":true,"reminder_48h":true,"status_updates":true,"promotions":false,"points_earned":true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fiscal_rfc text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fiscal_razon_social text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fiscal_direccion text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fiscal_uso_cfdi text DEFAULT 'G03';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fiscal_regimen text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT 'BRZ-' || substr(gen_random_uuid()::text, 1, 8);
