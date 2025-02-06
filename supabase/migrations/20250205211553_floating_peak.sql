/*
  # Fix Documents System Tables

  1. New Tables
    - `folders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `parent_id` (uuid, self-referencing)
      - `owner_id` (uuid)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `color` (text)
      - `icon` (text)
    
    - `documents`
      - `id` (uuid, primary key)
      - `name` (text)
      - `file_path` (text)
      - `mime_type` (text)
      - `size` (bigint)
      - `folder_id` (uuid)
      - `owner_id` (uuid)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `starred` (boolean)
      - `archived` (boolean)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
    - Ensure proper owner-based access control

  3. Changes
    - Drop existing tables if they exist
    - Create new tables with proper constraints
    - Add necessary indexes
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS folders CASCADE;

-- Create folders table
CREATE TABLE folders (
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
CREATE TABLE documents (
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

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Folder policies
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their folders"
  ON folders FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Document policies
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

-- Create indexes for better performance
CREATE INDEX folders_parent_id_idx ON folders(parent_id);
CREATE INDEX folders_owner_id_idx ON folders(owner_id);
CREATE INDEX documents_folder_id_idx ON documents(folder_id);
CREATE INDEX documents_owner_id_idx ON documents(owner_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();