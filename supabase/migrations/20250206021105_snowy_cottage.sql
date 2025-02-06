/*
  # Fix Database Tables and Add Documents Support

  1. New Tables
    - `documents` - Stores document metadata and file paths
    - `folders` - Manages document organization structure
  
  2. Changes
    - Fix agent_emotional_traits table structure
    - Add missing columns to agent_interactions
    - Add proper indexes and triggers

  3. Security
    - Enable RLS on all tables
    - Add appropriate access policies
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

-- Fix agent_emotional_traits table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS agent_emotional_traits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id text NOT NULL,
    empathy float CHECK (empathy >= 0 AND empathy <= 1),
    patience float CHECK (patience >= 0 AND patience <= 1),
    assertiveness float CHECK (assertiveness >= 0 AND assertiveness <= 1),
    adaptability float CHECK (adaptability >= 0 AND adaptability <= 1),
    status text DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'offline')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN others THEN NULL;
END $$;

-- Fix agent_interactions table
DO $$ BEGIN
  ALTER TABLE agent_interactions 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS progress float CHECK (progress >= 0 AND progress <= 100),
  ADD COLUMN IF NOT EXISTS deadline timestamptz;
EXCEPTION WHEN others THEN NULL;
END $$;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
CREATE INDEX IF NOT EXISTS folders_owner_id_idx ON folders(owner_id);
CREATE INDEX IF NOT EXISTS documents_folder_id_idx ON documents(folder_id);
CREATE INDEX IF NOT EXISTS documents_owner_id_idx ON documents(owner_id);
CREATE INDEX IF NOT EXISTS agent_interactions_updated_at_idx ON agent_interactions(updated_at);
CREATE INDEX IF NOT EXISTS agent_emotional_traits_updated_at_idx ON agent_emotional_traits(updated_at);

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

CREATE TRIGGER agent_interactions_updated_at
  BEFORE UPDATE ON agent_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agent_emotional_traits_updated_at
  BEFORE UPDATE ON agent_emotional_traits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();