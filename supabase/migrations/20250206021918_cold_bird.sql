-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  category text NOT NULL,
  priority text NOT NULL,
  reminders integer[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_category CHECK (category IN ('family', 'personal', 'reminder')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own events"
  ON events
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX events_user_id_idx ON events(user_id);
CREATE INDEX events_start_time_idx ON events(start_time);
CREATE INDEX events_category_idx ON events(category);