BEGIN;

-- Ensure the avatar bucket exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('User_Images', 'User_Images', true)
ON CONFLICT (id) DO NOTHING;

-- Users can only manage objects inside their own folder:
-- path format: <auth.uid()>/<filename>
CREATE POLICY "Change PFP"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'User_Images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'User_Images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
