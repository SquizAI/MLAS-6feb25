-- Drop and recreate agent_emotional_traits table with correct structure
DROP TABLE IF EXISTS agent_emotional_traits CASCADE;

CREATE TABLE agent_emotional_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  empathy float CHECK (empathy >= 0 AND empathy <= 1),
  patience float CHECK (patience >= 0 AND patience <= 1),
  assertiveness float CHECK (assertiveness >= 0 AND assertiveness <= 1),
  adaptability float CHECK (adaptability >= 0 AND adaptability <= 1),
  status text DEFAULT 'idle'
    CHECK (status IN ('idle', 'busy', 'offline')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agent_emotional_traits ENABLE ROW LEVEL SECURITY;

-- Add policy for agent_emotional_traits
CREATE POLICY "Users can read agent traits"
  ON agent_emotional_traits
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial agent traits
INSERT INTO agent_emotional_traits (agent_id, empathy, patience, assertiveness, adaptability, status)
VALUES 
  ('data-analyzer', 0.7, 0.8, 0.6, 0.7, 'idle'),
  ('task-coordinator', 0.8, 0.7, 0.8, 0.9, 'idle'),
  ('research-agent', 0.9, 0.9, 0.5, 0.8, 'idle');