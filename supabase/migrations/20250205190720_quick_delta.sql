/*
  # Fix database schema issues
  
  1. Changes
    - Add missing columns to agent_interactions table
    - Add missing status column to agent_emotional_traits table
    - Create folders table and related tables
*/

-- Add missing columns to agent_interactions if they don't exist
ALTER TABLE agent_interactions
ADD COLUMN IF NOT EXISTS progress float CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS deadline timestamptz;

-- Add status to agent_emotional_traits if it doesn't exist
ALTER TABLE agent_emotional_traits 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'idle'
  CHECK (status IN ('idle', 'busy', 'offline'));

-- Create folders table if it doesn't exist
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

-- Enable RLS on folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create folder policies
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

-- Create indexes
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
CREATE INDEX IF NOT EXISTS folders_owner_id_idx ON folders(owner_id);