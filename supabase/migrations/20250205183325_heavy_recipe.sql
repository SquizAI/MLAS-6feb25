/*
  # Agent Emotional System

  1. New Tables
    - agent_emotional_traits: Stores agent emotional capabilities
    - agent_interactions: Tracks agent task interactions
    
  2. Security
    - Enable RLS
    - Add policies for data access
*/

-- Create agent_emotional_traits table first
CREATE TABLE IF NOT EXISTS agent_emotional_traits (
  agent_id text PRIMARY KEY,
  empathy float CHECK (empathy >= 0 AND empathy <= 1),
  patience float CHECK (patience >= 0 AND patience <= 1),
  assertiveness float CHECK (assertiveness >= 0 AND assertiveness <= 1),
  adaptability float CHECK (adaptability >= 0 AND adaptability <= 1),
  active boolean DEFAULT true,
  status text DEFAULT 'idle'
    CHECK (status IN ('idle', 'busy', 'offline')),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on agent_emotional_traits
ALTER TABLE agent_emotional_traits ENABLE ROW LEVEL SECURITY;

-- Add policy for agent_emotional_traits
CREATE POLICY "Users can read agent traits"
  ON agent_emotional_traits
  FOR SELECT
  TO authenticated
  USING (true);

-- Add missing columns to raw_data
ALTER TABLE raw_data
ADD COLUMN IF NOT EXISTS emotional_context jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS agent_id text REFERENCES agent_emotional_traits(agent_id);

-- Create agent_interactions table
CREATE TABLE IF NOT EXISTS agent_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id uuid REFERENCES raw_data(id),
  agent_id text NOT NULL REFERENCES agent_emotional_traits(agent_id),
  progress float CHECK (progress >= 0 AND progress <= 100),
  deadline timestamptz,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on agent_interactions
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for agent_interactions
CREATE POLICY "Users can read agent interactions"
  ON agent_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM raw_data
      WHERE raw_data.id = agent_interactions.raw_data_id
      AND raw_data.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agent interactions"
  ON agent_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM raw_data
      WHERE raw_data.id = agent_interactions.raw_data_id
      AND raw_data.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS agent_interactions_raw_data_id_idx 
  ON agent_interactions(raw_data_id);
CREATE INDEX IF NOT EXISTS agent_interactions_agent_id_idx 
  ON agent_interactions(agent_id);
CREATE INDEX IF NOT EXISTS agent_interactions_status_idx 
  ON agent_interactions(status);
CREATE INDEX IF NOT EXISTS raw_data_agent_id_idx 
  ON raw_data(agent_id);
CREATE INDEX IF NOT EXISTS agent_emotional_traits_active_idx 
  ON agent_emotional_traits(active);

-- Insert initial agent traits
INSERT INTO agent_emotional_traits (agent_id, empathy, patience, assertiveness, adaptability)
VALUES 
  ('data-analyzer', 0.7, 0.8, 0.6, 0.7),
  ('task-coordinator', 0.8, 0.7, 0.8, 0.9),
  ('research-agent', 0.9, 0.9, 0.5, 0.8);