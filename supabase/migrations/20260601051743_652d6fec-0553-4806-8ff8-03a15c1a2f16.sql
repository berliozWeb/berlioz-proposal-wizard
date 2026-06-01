
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-videos', 'hero-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Hero videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-videos');

CREATE POLICY "Admins can upload hero videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update hero videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete hero videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-videos' AND public.is_admin(auth.uid()));
