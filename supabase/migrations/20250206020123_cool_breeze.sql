-- Drop and recreate agent_interactions table with correct structure
DROP TABLE IF EXISTS agent_interactions CASCADE;

CREATE TABLE agent_interactions (
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

-- Create policies
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

-- Create indexes
CREATE INDEX agent_interactions_user_id_idx ON agent_interactions(user_id);
CREATE INDEX agent_interactions_agent_id_idx ON agent_interactions(agent_id);
CREATE INDEX agent_interactions_status_idx ON agent_interactions(status);
CREATE INDEX agent_interactions_created_at_idx ON agent_interactions(created_at);
CREATE INDEX agent_interactions_updated_at_idx ON agent_interactions(updated_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_interactions_updated_at
  BEFORE UPDATE ON agent_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();