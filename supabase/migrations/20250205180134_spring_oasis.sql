/*
  # Add document management tables

  1. New Tables
    - `document_links`
      - `id` (uuid, primary key)
      - `url` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on `document_links` table
    - Add policies for authenticated users
*/

-- Create document_links table
CREATE TABLE IF NOT EXISTS document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own document links"
  ON document_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own document links"
  ON document_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX document_links_user_id_idx ON document_links(user_id);
CREATE INDEX document_links_created_at_idx ON document_links(created_at);