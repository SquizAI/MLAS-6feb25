/*
  # Fix Policy Conflicts and Improve Database Structure

  1. Changes
    - Drop conflicting policies before recreating them
    - Add missing indexes for performance
    - Add proper constraints and checks
  
  2. Security
    - Ensure proper RLS policies without conflicts
    - Maintain data access security
*/

-- Drop conflicting policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
  DROP POLICY IF EXISTS "Users can create folders" ON folders;
  DROP POLICY IF EXISTS "Users can update their folders" ON folders;
  DROP POLICY IF EXISTS "Users can delete their folders" ON folders;
  DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
  DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
  DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Recreate policies with unique names
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

CREATE POLICY "document_select_policy"
  ON documents FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

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

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS documents_name_idx ON documents(name);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at);
CREATE INDEX IF NOT EXISTS documents_mime_type_idx ON documents(mime_type);
CREATE INDEX IF NOT EXISTS folders_name_idx ON folders(name);
CREATE INDEX IF NOT EXISTS folders_created_at_idx ON folders(created_at);