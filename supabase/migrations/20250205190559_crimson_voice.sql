/*
  # Update agent traits constraints

  1. Changes
    - Safely update agent_emotional_traits table constraints
    - Update existing agent records to match constraints
*/

-- Safely drop constraint if it exists
DO $$ BEGIN
  ALTER TABLE agent_emotional_traits
  DROP CONSTRAINT IF EXISTS valid_agent_traits;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add constraint back
ALTER TABLE agent_emotional_traits
ADD CONSTRAINT valid_agent_traits CHECK (
  agent_id IN ('data-analyzer', 'task-coordinator', 'research-agent')
);

-- Update existing agent traits to ensure they match the constraint
UPDATE agent_emotional_traits
SET agent_id = 'data-analyzer'
WHERE agent_id = 'data-analyzer';

UPDATE agent_emotional_traits
SET agent_id = 'task-coordinator'
WHERE agent_id = 'task-coordinator';

UPDATE agent_emotional_traits
SET agent_id = 'research-agent'
WHERE agent_id = 'research-agent';