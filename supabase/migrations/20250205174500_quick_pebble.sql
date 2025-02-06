/*
  # Create Raw Data Table

  1. New Tables
    - `raw_data`
      - `id` (uuid, primary key)
      - `source` (text)
      - `content` (text)
      - `metadata` (jsonb)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `processed` (boolean)
      - `processed_at` (timestamptz)

  2. Security
    - Enable RLS on `raw_data` table
    - Add policies for authenticated users to:
      - Insert their own data
      - Read their own data
*/

-- Create raw_data table
CREATE TABLE IF NOT EXISTS raw_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamptz,
  CONSTRAINT valid_source CHECK (source IN ('email', 'slack', 'text'))
);

-- Enable RLS
ALTER TABLE raw_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own data"
  ON raw_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own data"
  ON raw_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX raw_data_user_id_idx ON raw_data(user_id);
CREATE INDEX raw_data_source_idx ON raw_data(source);
CREATE INDEX raw_data_processed_idx ON raw_data(processed);