-- Drop existing policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
  DROP POLICY IF EXISTS "Give users access to own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete own files" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new storage policies with improved access control
CREATE POLICY "Users can access their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    owner = auth.uid()
  )
);

CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.foldername(name))[1] IS NOT NULL
);

CREATE POLICY "Users can update their documents"
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

CREATE POLICY "Users can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure documents table has correct RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own documents"
ON documents FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
TO authenticated
USING (owner_id = auth.uid());