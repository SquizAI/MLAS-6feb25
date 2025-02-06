/*
  # Fix Documents and Folders Tables

  1. New Tables
    - folders: For organizing documents in a hierarchical structure
    - documents: For storing document metadata and file references
    - document_shares: For managing document sharing between users

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Ensure proper cascading deletes
*/

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  color text,
  icon text
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  starred boolean DEFAULT false,
  archived boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
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
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Folder policies
CREATE POLICY "folder_select_policy"
  ON folders FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "folder_insert_policy"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "folder_update_policy"
  ON folders FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "folder_delete_policy"
  ON folders FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Document policies
CREATE POLICY "document_select_policy"
  ON documents FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT document_id 
      FROM document_shares 
      WHERE shared_with = auth.uid()
    )
  );

CREATE POLICY "document_insert_policy"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "document_update_policy"
  ON documents FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "document_delete_policy"
  ON documents FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Document shares policies
CREATE POLICY "document_shares_select_policy"
  ON document_shares FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    ) OR
    shared_with = auth.uid()
  );

CREATE POLICY "document_shares_insert_policy"
  ON document_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
CREATE INDEX IF NOT EXISTS folders_owner_id_idx ON folders(owner_id);
CREATE INDEX IF NOT EXISTS folders_name_idx ON folders(name);
CREATE INDEX IF NOT EXISTS folders_created_at_idx ON folders(created_at);

CREATE INDEX IF NOT EXISTS documents_folder_id_idx ON documents(folder_id);
CREATE INDEX IF NOT EXISTS documents_owner_id_idx ON documents(owner_id);
CREATE INDEX IF NOT EXISTS documents_name_idx ON documents(name);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at);
CREATE INDEX IF NOT EXISTS documents_mime_type_idx ON documents(mime_type);

CREATE INDEX IF NOT EXISTS document_shares_document_id_idx ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS document_shares_shared_with_idx ON document_shares(shared_with);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();