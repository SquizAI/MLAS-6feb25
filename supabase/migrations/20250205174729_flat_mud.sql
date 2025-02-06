/*
  # Create Agent Interactions Table

  1. New Tables
    - `agent_interactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `agent_id` (text)
      - `content` (text)
      - `response` (text)
      - `created_at` (timestamptz)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on `agent_interactions` table
    - Add policies for authenticated users to:
      - Insert and read their own interactions
*/

-- Create agent_interactions table
CREATE TABLE IF NOT EXISTS agent_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  agent_id text NOT NULL,
  content text NOT NULL,
  response text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_agent CHECK (agent_id IN ('data-analyzer', 'task-coordinator', 'research-agent'))
);

-- Enable RLS
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own interactions"
  ON agent_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own interactions"
  ON agent_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX agent_interactions_user_id_idx ON agent_interactions(user_id);
CREATE INDEX agent_interactions_agent_id_idx ON agent_interactions(agent_id);
CREATE INDEX agent_interactions_created_at_idx ON agent_interactions(created_at);