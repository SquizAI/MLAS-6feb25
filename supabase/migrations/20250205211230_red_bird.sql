-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
  DROP POLICY IF EXISTS "Give users access to own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete own files" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new storage policies
CREATE POLICY "Give users access to own folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Give users access to own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  owner = auth.uid()
);

CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated users to update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);