-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  meal_type text NOT NULL,
  recipe text NOT NULL,
  ingredients text[] NOT NULL,
  servings integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'))
);

-- Create grocery_items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  purchased boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their meal plans"
  ON meal_plans
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their grocery items"
  ON grocery_items
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX meal_plans_user_id_idx ON meal_plans(user_id);
CREATE INDEX meal_plans_date_idx ON meal_plans(date);
CREATE INDEX grocery_items_user_id_idx ON grocery_items(user_id);
CREATE INDEX grocery_items_category_idx ON grocery_items(category);