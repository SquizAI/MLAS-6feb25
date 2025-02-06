/*
  # Fix Database Issues
  
  1. Changes
    - Add status column to agent_interactions table
    - Fix storage bucket permissions
    - Fix folders table parent_id handling
*/

-- Add status column to agent_interactions if it doesn't exist
ALTER TABLE agent_interactions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'));

-- Create index for status column
CREATE INDEX IF NOT EXISTS agent_interactions_status_idx ON agent_interactions(status);

-- Fix storage bucket permissions
DO $$ BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update their documents" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can read public documents" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can update their documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can read public documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Fix folders table parent_id handling
ALTER TABLE folders
DROP CONSTRAINT IF EXISTS folders_parent_id_fkey,
ADD CONSTRAINT folders_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES folders(id)
  ON DELETE SET NULL;

-- Update parent_id query handling
CREATE OR REPLACE FUNCTION get_root_folders(user_id uuid)
RETURNS SETOF folders AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM folders
  WHERE owner_id = user_id
  AND (parent_id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;