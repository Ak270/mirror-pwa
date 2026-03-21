-- Migration 003: Add display_type for widget classification
-- Classifies habits as counter, streak, or binary for widget display

-- Add display_type column to habits table
ALTER TABLE habits 
ADD COLUMN display_type TEXT DEFAULT 'binary' CHECK (display_type IN ('binary', 'counter', 'streak'));

-- Create index for widget queries
CREATE INDEX IF NOT EXISTS habits_display_type_idx ON habits(user_id, display_type);

-- Add comment for documentation
COMMENT ON COLUMN habits.display_type IS 'Widget display classification: binary (yes/no), counter (quantifiable), streak (days in a row)';

-- Auto-classify existing habits based on quantifiable data
UPDATE habits 
SET display_type = 'counter' 
WHERE id IN (
  SELECT DISTINCT habit_id 
  FROM check_ins 
  WHERE quantifiable_value IS NOT NULL
);
