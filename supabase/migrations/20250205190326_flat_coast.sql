/*
  # Add missing columns to agent_interactions

  1. Changes
    - Add progress column for tracking task completion
    - Add deadline column for task scheduling
    - Add metadata column for additional task data
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to agent_interactions
ALTER TABLE agent_interactions
ADD COLUMN IF NOT EXISTS progress float CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS deadline timestamptz;