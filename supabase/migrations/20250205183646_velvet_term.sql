/*
  # Create agent interactions schema

  1. New Tables
    - `agent_interactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `agent_id` (text)
      - `content` (text)
      - `response` (text)
      - `progress` (float)
      - `deadline` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create agent_interactions table
CREATE TABLE IF NOT EXISTS agent_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  agent_id text NOT NULL,
  content text NOT NULL,
  response text,
  progress float CHECK (progress >= 0 AND progress <= 100),
  deadline timestamptz,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for agent_interactions
CREATE POLICY "Users can read their own interactions"
  ON agent_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON agent_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON agent_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS agent_interactions_user_id_idx 
  ON agent_interactions(user_id);
CREATE INDEX IF NOT EXISTS agent_interactions_agent_id_idx 
  ON agent_interactions(agent_id);
CREATE INDEX IF NOT EXISTS agent_interactions_status_idx 
  ON agent_interactions(status);
CREATE INDEX IF NOT EXISTS agent_interactions_created_at_idx 
  ON agent_interactions(created_at);