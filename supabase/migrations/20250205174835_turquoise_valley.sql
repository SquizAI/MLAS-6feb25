/*
  # Add Gamification Features

  1. New Tables
    - `achievements`
      - Stores achievement definitions and requirements
    - `user_achievements`
      - Tracks user achievement progress and completion
    - `agent_milestones`
      - Records significant agent accomplishments
    - `leaderboards`
      - Maintains various ranking categories
    - `reputation_scores`
      - Tracks detailed agent reputation metrics

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  tier text NOT NULL,
  xp_reward integer NOT NULL,
  requirements jsonb NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (
    category IN ('task_completion', 'skill_mastery', 'collaboration', 'innovation', 'quality', 'milestone')
  ),
  CONSTRAINT valid_tier CHECK (
    tier IN ('bronze', 'silver', 'gold', 'platinum')
  )
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  achievement_id uuid REFERENCES achievements NOT NULL,
  progress float NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 1)
);

-- Create agent_milestones table
CREATE TABLE IF NOT EXISTS agent_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  xp_awarded integer NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_milestone_type CHECK (
    type IN ('skill_level', 'task_count', 'quality_score', 'innovation', 'collaboration')
  )
);

-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  agent_id text NOT NULL,
  score integer NOT NULL,
  rank integer NOT NULL,
  period text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_category CHECK (
    category IN ('xp', 'tasks_completed', 'quality_score', 'innovation_score', 'collaboration_score')
  ),
  CONSTRAINT valid_period CHECK (
    period IN ('daily', 'weekly', 'monthly', 'all_time')
  )
);

-- Create reputation_scores table
CREATE TABLE IF NOT EXISTS reputation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  category text NOT NULL,
  score float NOT NULL,
  confidence float NOT NULL,
  sample_size integer NOT NULL,
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 1),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT valid_category CHECK (
    category IN (
      'task_quality', 'communication', 'reliability', 
      'innovation', 'collaboration', 'emotional_intelligence'
    )
  )
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Anyone can read achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_achievements
CREATE POLICY "Users can read their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for agent_milestones
CREATE POLICY "Users can read agent milestones"
  ON agent_milestones
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for leaderboards
CREATE POLICY "Users can read leaderboards"
  ON leaderboards
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for reputation_scores
CREATE POLICY "Users can read reputation scores"
  ON reputation_scores
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX user_achievements_user_id_idx ON user_achievements(user_id);
CREATE INDEX user_achievements_achievement_id_idx ON user_achievements(achievement_id);
CREATE INDEX agent_milestones_agent_id_idx ON agent_milestones(agent_id);
CREATE INDEX leaderboards_category_period_idx ON leaderboards(category, period);
CREATE INDEX reputation_scores_agent_category_idx ON reputation_scores(agent_id, category);