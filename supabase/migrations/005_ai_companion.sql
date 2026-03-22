-- Migration 005: AI Notification Companion
-- Adds new columns for habit types, quantity tracking, and notification conversations

-- ── New columns on habits ───────────────────────────────────────────────────

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS check_in_interval_minutes  INTEGER,
  ADD COLUMN IF NOT EXISTS daily_reduction_goal        NUMERIC,
  ADD COLUMN IF NOT EXISTS daily_reduction_unit        TEXT,
  ADD COLUMN IF NOT EXISTS reminder_interval_minutes   INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_start_time         TIME,
  ADD COLUMN IF NOT EXISTS reminder_end_time           TIME,
  ADD COLUMN IF NOT EXISTS daily_target                NUMERIC,
  ADD COLUMN IF NOT EXISTS daily_target_unit           TEXT,
  ADD COLUMN IF NOT EXISTS yesterday_baseline          NUMERIC;

-- ── daily_quantity_logs ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_quantity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id      UUID NOT NULL REFERENCES habits(id)     ON DELETE CASCADE,
  date          DATE NOT NULL,
  entries       JSONB NOT NULL DEFAULT '[]',
  running_total NUMERIC NOT NULL DEFAULT 0,
  daily_target  NUMERIC,
  goal_met      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_id, date)
);

CREATE INDEX IF NOT EXISTS daily_quantity_logs_user_date_idx
  ON daily_quantity_logs (user_id, date);

CREATE INDEX IF NOT EXISTS daily_quantity_logs_habit_date_idx
  ON daily_quantity_logs (habit_id, date);

-- ── notification_conversations ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_conversations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id              UUID REFERENCES habits(id)              ON DELETE SET NULL,
  date                  DATE NOT NULL,
  sent_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  groq_message          TEXT,
  user_action           TEXT,
  user_text_reply       TEXT,
  groq_follow_up        TEXT,
  running_total_at_time NUMERIC,
  notification_type     TEXT, -- 'timed_reminder' | 'break_free_checkin' | 'quantity_nudge' | 'end_of_day'
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_conversations_user_date_idx
  ON notification_conversations (user_id, date);

CREATE INDEX IF NOT EXISTS notification_conversations_habit_idx
  ON notification_conversations (habit_id, sent_at);

-- ── RLS policies ────────────────────────────────────────────────────────────

ALTER TABLE daily_quantity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quantity logs"
  ON daily_quantity_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE notification_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification conversations"
  ON notification_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
