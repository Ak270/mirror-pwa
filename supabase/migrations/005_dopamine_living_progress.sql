-- Migration 005: Dopamine & Living Progress System
-- Adds intent classification, addiction support, day boundaries, grace days, and psychological tracking

-- ============================================================================
-- HABITS TABLE EXTENSIONS
-- ============================================================================

-- Intent classification: leave vs start habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS intent TEXT DEFAULT 'start' CHECK (intent IN ('start', 'leave'));

-- Leave habit psychology fields
ALTER TABLE habits ADD COLUMN IF NOT EXISTS addiction_level INTEGER CHECK (addiction_level BETWEEN 1 AND 10);
ALTER TABLE habits ADD COLUMN IF NOT EXISTS origin_anchor TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS day1_letter TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS day1_letter_delivered BOOLEAN DEFAULT false;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS vulnerability_hour INTEGER CHECK (vulnerability_hour BETWEEN 0 AND 23);
ALTER TABLE habits ADD COLUMN IF NOT EXISTS replacement_behaviors JSONB DEFAULT '[]';

-- Streak insurance (earned grace days)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS banked_grace_days INTEGER DEFAULT 0;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS grace_days_earned_total INTEGER DEFAULT 0;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS last_grace_day_earned_at TIMESTAMPTZ;

-- Energy arc tracking
ALTER TABLE habits ADD COLUMN IF NOT EXISTS energy_arc_position TEXT CHECK (energy_arc_position IN ('peak', 'normal', 'dip'));

-- ============================================================================
-- PROFILES TABLE EXTENSIONS
-- ============================================================================

-- Personal day boundaries (replace midnight reset)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS day_start_time TIME DEFAULT '06:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS day_end_time TIME DEFAULT '22:00';

-- Energy windows
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS energy_peak_time TIME;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS energy_dip_time TIME;

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Daily feelings (evening acknowledgment)
CREATE TABLE IF NOT EXISTS daily_feelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  feeling_score SMALLINT CHECK (feeling_score BETWEEN 1 AND 5),
  completion_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_feelings ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_feelings_own ON daily_feelings 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_feelings_user_date 
  ON daily_feelings(user_id, date DESC);

-- Unexpected weekly messages log (prevent pattern repeats)
CREATE TABLE IF NOT EXISTS unexpected_messages_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  week_start DATE NOT NULL
);

ALTER TABLE unexpected_messages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY unexpected_messages_own ON unexpected_messages_log 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_unexpected_messages_user_week 
  ON unexpected_messages_log(user_id, week_start DESC);

-- Groq rate limiting (move from in-memory to persistent)
CREATE TABLE IF NOT EXISTS groq_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, endpoint)
);

ALTER TABLE groq_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY groq_rate_limits_own ON groq_rate_limits 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_groq_rate_limits_user_date 
  ON groq_rate_limits(user_id, date DESC);

-- Partial victories (urge surfing wins that aren't full check-ins)
CREATE TABLE IF NOT EXISTS partial_victories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  victory_type TEXT NOT NULL, -- 'urge_surfed', 'replacement_behavior', 'grace_day_used'
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE partial_victories ENABLE ROW LEVEL SECURITY;

CREATE POLICY partial_victories_own ON partial_victories 
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_partial_victories_habit 
  ON partial_victories(habit_id, created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate vulnerability hour for a leave habit based on slip patterns
CREATE OR REPLACE FUNCTION calculate_vulnerability_hour(p_habit_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_hour INTEGER;
BEGIN
  SELECT EXTRACT(HOUR FROM created_at)::INTEGER INTO v_hour
  FROM check_ins
  WHERE habit_id = p_habit_id
    AND status = 'honest_slip'
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  RETURN v_hour;
END;
$$ LANGUAGE plpgsql;

-- Check if user should earn a grace day (called after check-in)
CREATE OR REPLACE FUNCTION check_grace_day_earn(p_habit_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_streak INTEGER;
  v_last_earned_at TIMESTAMPTZ;
  v_should_earn BOOLEAN := false;
BEGIN
  SELECT current_streak, last_grace_day_earned_at INTO v_current_streak, v_last_earned_at
  FROM habits
  WHERE id = p_habit_id;
  
  -- Earn at 30, 60, 90, 120... day milestones
  IF v_current_streak % 30 = 0 AND v_current_streak > 0 THEN
    -- Only if we haven't earned one in the last 29 days
    IF v_last_earned_at IS NULL OR v_last_earned_at < NOW() - INTERVAL '29 days' THEN
      v_should_earn := true;
      
      -- Update the habit
      UPDATE habits
      SET banked_grace_days = LEAST(banked_grace_days + 1, 3),
          grace_days_earned_total = grace_days_earned_total + 1,
          last_grace_day_earned_at = NOW()
      WHERE id = p_habit_id;
    END IF;
  END IF;
  
  RETURN v_should_earn;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN habits.intent IS 'Whether this is a habit to START (build) or LEAVE (quit)';
COMMENT ON COLUMN habits.addiction_level IS '1-10 scale of how strong the pull is. Determines support intensity.';
COMMENT ON COLUMN habits.origin_anchor IS 'User''s words about why they started this habit. Quoted back in vulnerability moments.';
COMMENT ON COLUMN habits.day1_letter IS 'Letter user wrote to themselves for hard days. Delivered on first slip.';
COMMENT ON COLUMN habits.vulnerability_hour IS 'Hour (0-23) when user most commonly slips. Auto-calculated from check_ins.';
COMMENT ON COLUMN habits.banked_grace_days IS 'Earned grace days available to spend. Max 3.';
COMMENT ON COLUMN habits.replacement_behaviors IS 'Array of behaviors user did instead of the leave habit.';

COMMENT ON TABLE daily_feelings IS 'Evening acknowledgment: how user feels vs completion percentage';
COMMENT ON TABLE unexpected_messages_log IS 'Tracks which pattern was sent per week to prevent repeats';
COMMENT ON TABLE groq_rate_limits IS 'Persistent rate limiting for Groq API calls';
COMMENT ON TABLE partial_victories IS 'Urge surfing wins and other partial successes that aren''t full check-ins';
