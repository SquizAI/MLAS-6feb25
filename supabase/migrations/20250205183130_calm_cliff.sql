/*
  # Document Management System

  1. New Tables
    - documents: Stores document metadata and organization
    - folders: Manages folder structure
    - document_shares: Tracks document sharing

  2. Security
    - Enable RLS
    - Add policies for document access
    - Add policies for folder management
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL,
  folder_id uuid REFERENCES folders(id),
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  starred boolean DEFAULT false,
  archived boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id),
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  color text,
  icon text
);

-- Create document_shares table
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  shared_with uuid REFERENCES auth.users(id),
  permission text CHECK (permission IN ('view', 'edit')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Document policies
CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT document_id 
      FROM document_shares 
      WHERE shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Folder policies
CREATE POLICY "Users can view their own folders"
  ON folders
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create folders"
  ON folders
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their folders"
  ON folders
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their folders"
  ON folders
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS documents_folder_id_idx ON documents(folder_id);
CREATE INDEX IF NOT EXISTS documents_owner_id_idx ON documents(owner_id);
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
CREATE INDEX IF NOT EXISTS folders_owner_id_idx ON folders(owner_id);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();