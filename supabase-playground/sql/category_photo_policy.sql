BEGIN;

-- Ensure bucket for category photos exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('Category-Image', 'Category-Image', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to add/update/delete category images in Category-Image bucket.
DROP POLICY IF EXISTS "Category-Photo" ON storage.objects;
CREATE POLICY "Category-Photo"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Category-Image'
)
WITH CHECK (
  bucket_id = 'Category-Image'
);

COMMIT;
