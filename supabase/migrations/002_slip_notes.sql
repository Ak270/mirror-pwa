-- Migration 002: Add slip notes for micro-journaling
-- Allows users to optionally record why they slipped on a habit

-- Add slip_note column to check_ins table
ALTER TABLE check_ins 
ADD COLUMN slip_note TEXT;

-- Add index for querying slip notes
CREATE INDEX IF NOT EXISTS check_ins_slip_note_idx ON check_ins(user_id, slip_note) 
WHERE slip_note IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN check_ins.slip_note IS 'Optional note explaining why user slipped on this habit (honest_slip status only)';
