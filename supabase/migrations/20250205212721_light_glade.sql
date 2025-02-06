-- Create voice_memos table
CREATE TABLE voice_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  transcript text NOT NULL,
  processed_data jsonb NOT NULL,
  audio_url text,
  duration integer,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own voice memos"
  ON voice_memos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own voice memos"
  ON voice_memos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX voice_memos_user_id_idx ON voice_memos(user_id);
CREATE INDEX voice_memos_created_at_idx ON voice_memos(created_at);