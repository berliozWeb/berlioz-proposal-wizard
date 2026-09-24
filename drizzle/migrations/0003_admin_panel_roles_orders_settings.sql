DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_for_allowed_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) IN ('hola@berlioz.mx','oscar@berlioz.mx') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_allowed_email();
DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_admin AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_allowed_email();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email_confirmed_at IS NOT NULL AND lower(email) IN ('hola@berlioz.mx','oscar@berlioz.mx')
ON CONFLICT DO NOTHING;

-- Prevent users from self-escalating via profiles.admin_role
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.admin_role := OLD.admin_role;
    IF NOT public.is_admin(auth.uid()) THEN
      NEW.bank_transfer_enabled := OLD.bank_transfer_enabled;
      NEW.bank_transfer_enabled_by := OLD.bank_transfer_enabled_by;
      NEW.bank_transfer_enabled_at := OLD.bank_transfer_enabled_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_protect_admin_fields ON public.profiles;
CREATE TRIGGER profiles_protect_admin_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();
COMMENT ON COLUMN public.profiles.admin_role IS 'DEPRECATED: replaced by public.user_roles';

CREATE TABLE IF NOT EXISTS public.web_orders (
  woo_order_id bigint PRIMARY KEY,
  order_number text NOT NULL,
  customer_name text,
  customer_email text,
  company text,
  total numeric,
  status text NOT NULL DEFAULT 'pending',
  delivery_date text,
  delivery_slot text,
  delivery_type text,
  pay_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.web_orders TO authenticated;
GRANT ALL ON public.web_orders TO service_role;
ALTER TABLE public.web_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read web orders" ON public.web_orders FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER web_orders_updated_at BEFORE UPDATE ON public.web_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();