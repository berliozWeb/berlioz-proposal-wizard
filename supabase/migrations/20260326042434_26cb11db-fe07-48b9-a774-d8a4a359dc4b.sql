
-- Fix infinite recursion: replace self-referencing SELECT policy with a security definer function

CREATE OR REPLACE FUNCTION public.get_my_email_domain()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email_domain FROM public.profiles WHERE id = auth.uid()
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can read profiles by domain" ON public.profiles;

-- Recreate using the security definer function
CREATE POLICY "Users can read profiles by domain"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  email_domain IS NOT NULL
  AND email_domain = public.get_my_email_domain()
);
