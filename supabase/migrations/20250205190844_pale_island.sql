/*
  # Add status column to agent_interactions
  
  1. Changes
    - Add status column to agent_interactions table
    - Add constraint to ensure valid status values
*/

-- Add status column if it doesn't exist
ALTER TABLE agent_interactions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'));

-- Create index for status column
CREATE INDEX IF NOT EXISTS agent_interactions_status_idx ON agent_interactions(status);