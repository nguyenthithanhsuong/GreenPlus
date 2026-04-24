BEGIN;

-- Ensure the product image bucket exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('Product-Image', 'Product-Image', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to manage product images in Product-Image bucket.
DROP POLICY IF EXISTS "Product-Photo" ON storage.objects;
CREATE POLICY "Product-Photo"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Product-Image'
)
WITH CHECK (
  bucket_id = 'Product-Image'
);

COMMIT;
