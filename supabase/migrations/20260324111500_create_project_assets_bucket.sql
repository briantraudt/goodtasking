INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own project assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-assets'
  AND name LIKE auth.uid()::text || '/%'
);

CREATE POLICY "Users can view project assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-assets');

CREATE POLICY "Users can update their own project assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-assets'
  AND name LIKE auth.uid()::text || '/%'
)
WITH CHECK (
  bucket_id = 'project-assets'
  AND name LIKE auth.uid()::text || '/%'
);

CREATE POLICY "Users can delete their own project assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-assets'
  AND name LIKE auth.uid()::text || '/%'
);
