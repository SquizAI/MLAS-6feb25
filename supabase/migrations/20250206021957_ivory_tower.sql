-- Create travel_plans table
CREATE TABLE IF NOT EXISTS travel_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  activities jsonb DEFAULT '[]'::jsonb,
  accommodations jsonb DEFAULT '[]'::jsonb,
  budget jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their travel plans"
  ON travel_plans
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX travel_plans_user_id_idx ON travel_plans(user_id);
CREATE INDEX travel_plans_dates_idx ON travel_plans(start_date, end_date);