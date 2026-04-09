
-- Add bank transfer control columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_transfer_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_transfer_enabled_by uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_transfer_enabled_at timestamptz;

-- Add admin_role column for basic role management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_role text NOT NULL DEFAULT 'customer';
-- values: 'customer' | 'admin'
