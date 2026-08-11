ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

DROP POLICY IF EXISTS "Active banners are public" ON public.banners;
CREATE POLICY "Active banners are public"
ON public.banners FOR SELECT
TO anon, authenticated
USING (
  active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at > now())
);

DROP POLICY IF EXISTS "Banner images are public" ON storage.objects;
CREATE POLICY "Banner images are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Admins upload banner images" ON storage.objects;
CREATE POLICY "Admins upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update banner images" ON storage.objects;
CREATE POLICY "Admins update banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete banner images" ON storage.objects;
CREATE POLICY "Admins delete banner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));