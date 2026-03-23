-- Migration 006: Allow multiple check-ins per day for quantifiable habits
-- This enables cumulative tracking (e.g., 2 glasses at 8am, 3 more at 10am)

-- Remove unique constraint on (habit_id, date) to allow multiple check-ins per day
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_habit_id_date_key;

-- Add index for efficient querying of today's check-ins
CREATE INDEX IF NOT EXISTS idx_check_ins_habit_date_created 
  ON check_ins(habit_id, date, created_at DESC);

-- Function to get today's cumulative quantity for a habit
CREATE OR REPLACE FUNCTION get_today_quantity_total(p_habit_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0) INTO v_total
  FROM check_ins
  WHERE habit_id = p_habit_id 
    AND date = p_date
    AND status = 'done';
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to check if quantifiable goal is met today
CREATE OR REPLACE FUNCTION is_quantifiable_goal_met(p_habit_id UUID, p_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_total INTEGER;
  v_goal INTEGER;
BEGIN
  -- Get today's total
  v_total := get_today_quantity_total(p_habit_id, p_date);
  
  -- Get habit goal
  SELECT goal_value INTO v_goal
  FROM habits
  WHERE id = p_habit_id;
  
  RETURN v_total >= v_goal;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the change
COMMENT ON TABLE check_ins IS 'Stores habit check-ins. Multiple check-ins per day allowed for quantifiable habits to enable cumulative tracking (e.g., logging water glasses throughout the day).';
