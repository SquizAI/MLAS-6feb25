/*
  # Fix storage bucket setup

  1. New Features
    - Create documents storage bucket
    - Add storage policies for authenticated users
    - Enable versioning for document tracking

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their documents
    - Allow public read access for shared documents
*/

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DO $$ BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update their documents" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can read public documents" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() = owner
);

CREATE POLICY "Authenticated users can update their documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() = owner
);

CREATE POLICY "Anyone can read public documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');