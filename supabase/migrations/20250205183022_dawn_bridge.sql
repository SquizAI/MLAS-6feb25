/*
  # Fix Data Loading Issues

  1. Changes
    - Add success column to agent_interactions
    - Add response column to agent_interactions
    - Fix agent_emotional_traits constraints
    - Add missing indexes

  2. Security
    - Maintain existing RLS policies
    - Add new policies for success field
*/

-- Add missing columns to agent_interactions
ALTER TABLE agent_interactions
ADD COLUMN IF NOT EXISTS success boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS response text;

-- Update agent_emotional_traits constraints
ALTER TABLE agent_emotional_traits
DROP CONSTRAINT IF EXISTS valid_agent_traits;

ALTER TABLE agent_emotional_traits
ADD CONSTRAINT valid_agent_traits CHECK (
  agent_id IN ('data-analyzer', 'task-coordinator', 'research-agent')
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS agent_interactions_success_idx 
  ON agent_interactions(success);
CREATE INDEX IF NOT EXISTS agent_interactions_response_idx 
  ON agent_interactions(response);

-- Update RLS policies
CREATE POLICY "Users can update their own interactions"
  ON agent_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);