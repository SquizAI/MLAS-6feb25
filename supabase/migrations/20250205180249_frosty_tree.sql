/*
  # Add Google integration support

  1. New Tables
    - `google_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `google_user_id` (text)
      - `access_token` (text)
      - `refresh_token` (text)
      - `scopes` (text[])
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `google_connections` table
    - Add policies for authenticated users
*/

-- Create google_connections table
CREATE TABLE IF NOT EXISTS google_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  google_user_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  scopes text[] NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, google_user_id)
);

-- Enable RLS
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read their own Google connections"
  ON google_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google connections"
  ON google_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google connections"
  ON google_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX google_connections_user_id_idx ON google_connections(user_id);
CREATE INDEX google_connections_google_user_id_idx ON google_connections(google_user_id);