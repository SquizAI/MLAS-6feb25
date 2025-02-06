/*
  # XP & Trust/Reputation System Schema

  1. New Tables
    - `agent_xp_events`: Records XP gains from various activities
    - `agent_achievements`: Tracks achievement progress and unlocks
    - `agent_skills`: Manages skill levels and progression
    - `agent_reputation`: Stores reputation scores across different categories
    - `agent_streaks`: Tracks daily activity streaks
    - `agent_badges`: Manages badge awards and display

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add indexes for performance

  3. Changes
    - Add XP-related columns to existing tables
    - Add achievement tracking
*/

-- Create agent_xp_events table
CREATE TABLE IF NOT EXISTS agent_xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  event_type text NOT NULL,
  xp_amount integer NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'task_completion', 'idea_capture', 'skill_improvement',
      'collaboration', 'innovation', 'feedback', 'streak'
    )
  ),
  CONSTRAINT valid_source_type CHECK (
    source_type IN (
      'task', 'idea', 'skill', 'achievement', 'collaboration'
    )
  )
);

-- Create agent_achievements table
CREATE TABLE IF NOT EXISTS agent_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL,
  progress float DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  requirements jsonb NOT NULL,
  tier text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_achievement_type CHECK (
    achievement_type IN (
      'task_completion', 'skill_mastery', 'collaboration',
      'innovation', 'quality', 'milestone'
    )
  ),
  CONSTRAINT valid_tier CHECK (
    tier IN ('bronze', 'silver', 'gold', 'platinum')
  )
);

-- Create agent_skills table
CREATE TABLE IF NOT EXISTS agent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  skill_name text NOT NULL,
  current_level integer DEFAULT 1,
  current_xp integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  proficiency float CHECK (proficiency >= 0 AND proficiency <= 1),
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_reputation table
CREATE TABLE IF NOT EXISTS agent_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  category text NOT NULL,
  score float CHECK (score >= 0 AND score <= 1),
  confidence float CHECK (confidence >= 0 AND confidence <= 1),
  sample_size integer NOT NULL,
  trend text CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (
    category IN (
      'task_quality', 'communication', 'reliability',
      'innovation', 'collaboration', 'emotional_intelligence'
    )
  )
);

-- Create agent_streaks table
CREATE TABLE IF NOT EXISTS agent_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date NOT NULL,
  multiplier float DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_badges table
CREATE TABLE IF NOT EXISTS agent_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  badge_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  display_priority integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_badge_type CHECK (
    badge_type IN (
      'achievement', 'milestone', 'special', 'seasonal',
      'collaboration', 'innovation'
    )
  )
);

-- Enable RLS
ALTER TABLE agent_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_achievements ENABLE ROW LEVEL_SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read XP events"
  ON agent_xp_events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can read achievements"
  ON agent_achievements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can read agent skills"
  ON agent_skills FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can read reputation scores"
  ON agent_reputation FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can read streaks"
  ON agent_streaks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can read badges"
  ON agent_badges FOR SELECT TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX agent_xp_events_agent_id_idx ON agent_xp_events(agent_id);
CREATE INDEX agent_xp_events_event_type_idx ON agent_xp_events(event_type);
CREATE INDEX agent_achievements_agent_id_idx ON agent_achievements(agent_id);
CREATE INDEX agent_achievements_type_idx ON agent_achievements(achievement_type);
CREATE INDEX agent_skills_agent_id_idx ON agent_skills(agent_id);
CREATE INDEX agent_reputation_agent_id_idx ON agent_reputation(agent_id);
CREATE INDEX agent_reputation_category_idx ON agent_reputation(category);
CREATE INDEX agent_streaks_agent_id_idx ON agent_streaks(agent_id);
CREATE INDEX agent_badges_agent_id_idx ON agent_badges(agent_id);

-- Create functions for XP calculations
CREATE OR REPLACE FUNCTION calculate_level_xp(level integer)
RETURNS integer AS $$
BEGIN
  -- Experience curve: Each level requires 50% more XP than the previous
  RETURN floor(100 * pow(1.5, level - 1));
END;
$$ LANGUAGE plpgsql;

-- Create function to update agent level based on XP
CREATE OR REPLACE FUNCTION update_agent_level()
RETURNS trigger AS $$
BEGIN
  -- Calculate new level based on XP
  WHILE NEW.current_xp >= calculate_level_xp(NEW.current_level + 1) LOOP
    NEW.current_xp := NEW.current_xp - calculate_level_xp(NEW.current_level + 1);
    NEW.current_level := NEW.current_level + 1;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level updates
CREATE TRIGGER agent_level_update
  BEFORE UPDATE ON agent_skills
  FOR EACH ROW
  WHEN (NEW.current_xp != OLD.current_xp)
  EXECUTE FUNCTION update_agent_level();

-- Insert initial achievements
INSERT INTO agent_achievements (
  agent_id, achievement_type, title, description,
  xp_reward, requirements, tier, icon
) VALUES
  (
    'data-analyzer',
    'task_completion',
    'Task Master Bronze',
    'Complete 10 tasks successfully',
    100,
    '{"tasks_completed": 10}',
    'bronze',
    'check-circle'
  ),
  (
    'task-coordinator',
    'quality',
    'Quality Champion Silver',
    'Maintain 90% quality rating for 20 tasks',
    250,
    '{"quality_rating": 0.9, "tasks_completed": 20}',
    'silver',
    'award'
  ),
  (
    'research-agent',
    'innovation',
    'Innovation Master Gold',
    'Propose 5 successful workflow optimizations',
    500,
    '{"workflow_improvements": 5}',
    'gold',
    'lightbulb'
  );