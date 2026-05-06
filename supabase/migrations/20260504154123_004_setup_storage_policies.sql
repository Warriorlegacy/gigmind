-- Storage Policies for Portfolios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- PORTFOLIOS POLICIES
DROP POLICY IF EXISTS "Public Portfolios Access" ON storage.objects;
CREATE POLICY "Public Portfolios Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolios' );

DROP POLICY IF EXISTS "Authenticated Portfolios Upload" ON storage.objects;
CREATE POLICY "Authenticated Portfolios Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated Portfolios Delete" ON storage.objects;
CREATE POLICY "Authenticated Portfolios Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolios' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- AVATARS POLICIES
DROP POLICY IF EXISTS "Public Avatars Access" ON storage.objects;
CREATE POLICY "Public Avatars Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Authenticated Avatars Upload" ON storage.objects;
CREATE POLICY "Authenticated Avatars Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated Avatars Delete" ON storage.objects;
CREATE POLICY "Authenticated Avatars Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
