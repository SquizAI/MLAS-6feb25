/*
  # Add status to agent_emotional_traits

  1. Changes
    - Add status column for tracking agent availability
    - Add default value and constraints
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add status to agent_emotional_traits
ALTER TABLE agent_emotional_traits 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'idle'
  CHECK (status IN ('idle', 'busy', 'offline'));