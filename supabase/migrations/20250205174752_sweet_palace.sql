/*
  # Add Emotional Metadata Support

  1. New Tables
    - `emotional_states`
      - `id` (uuid, primary key)
      - `raw_data_id` (uuid, references raw_data)
      - `valence` (float, -1 to 1)
      - `arousal` (float, 0 to 1)
      - `dominance` (float, 0 to 1)
      - `intensity` (float, 0 to 1)
      - `confidence` (float, 0 to 1)
      - `primary_emotion` (text)
      - `created_at` (timestamptz)
      - `metadata` (jsonb)

    - `agent_emotional_traits`
      - `id` (uuid, primary key)
      - `agent_id` (text)
      - `empathy` (float, 0 to 1)
      - `patience` (float, 0 to 1)
      - `assertiveness` (float, 0 to 1)
      - `adaptability` (float, 0 to 1)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create emotional_states table
CREATE TABLE IF NOT EXISTS emotional_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id uuid REFERENCES raw_data NOT NULL,
  valence float CHECK (valence >= -1 AND valence <= 1),
  arousal float CHECK (arousal >= 0 AND arousal <= 1),
  dominance float CHECK (dominance >= 0 AND dominance <= 1),
  intensity float CHECK (intensity >= 0 AND intensity <= 1),
  confidence float CHECK (confidence >= 0 AND confidence <= 1),
  primary_emotion text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_emotion CHECK (
    primary_emotion IN (
      'joy', 'sadness', 'anger', 'fear',
      'trust', 'disgust', 'anticipation', 'surprise'
    )
  )
);

-- Create agent_emotional_traits table
CREATE TABLE IF NOT EXISTS agent_emotional_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  empathy float CHECK (empathy >= 0 AND empathy <= 1),
  patience float CHECK (patience >= 0 AND patience <= 1),
  assertiveness float CHECK (assertiveness >= 0 AND assertiveness <= 1),
  adaptability float CHECK (adaptability >= 0 AND adaptability <= 1),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_agent_traits CHECK (
    agent_id IN ('data-analyzer', 'task-coordinator', 'research-agent')
  )
);

-- Enable RLS
ALTER TABLE emotional_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_emotional_traits ENABLE ROW LEVEL SECURITY;

-- Policies for emotional_states
CREATE POLICY "Users can read emotional states of their data"
  ON emotional_states
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM raw_data
      WHERE raw_data.id = emotional_states.raw_data_id
      AND raw_data.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert emotional states"
  ON emotional_states
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for agent_emotional_traits
CREATE POLICY "Users can read agent traits"
  ON agent_emotional_traits
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX emotional_states_raw_data_id_idx ON emotional_states(raw_data_id);
CREATE INDEX emotional_states_primary_emotion_idx ON emotional_states(primary_emotion);
CREATE INDEX agent_emotional_traits_agent_id_idx ON agent_emotional_traits(agent_id);