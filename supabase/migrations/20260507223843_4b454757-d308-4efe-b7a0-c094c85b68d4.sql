
CREATE TABLE public.proposal_admin_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id text,
  package_tier text,
  rating smallint NOT NULL CHECK (rating IN (-1, 1)),
  comment text,
  category text NOT NULL,
  request_snapshot jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_admin_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view feedback"
ON public.proposal_admin_feedback FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert feedback"
ON public.proposal_admin_feedback FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE INDEX idx_proposal_admin_feedback_created_at ON public.proposal_admin_feedback(created_at DESC);
