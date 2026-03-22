-- Test Data for Dopamine & Living Progress System
-- ACCELERATED TIMELINES: Notifications trigger within 10 minutes for testing
-- Run this AFTER migration 005_dopamine_living_progress.sql

-- ============================================================================
-- SETUP: Get or create test user
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID;
  test_profile_id UUID;
BEGIN
  -- Try to get existing test user
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@mirror.app' LIMIT 1;
  
  -- If no test user exists, create one
  IF test_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      'test@mirror.app',
      crypt('Mirror2024!Test.', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"Test User"}',
      false,
      'authenticated'
    ) RETURNING id INTO test_user_id;
  END IF;

  -- Update or create profile with custom day boundaries
  INSERT INTO profiles (
    id,
    display_name,
    day_start_time,
    day_end_time,
    energy_peak_time,
    energy_dip_time,
    created_at
  ) VALUES (
    test_user_id,
    'Test User',
    '06:00',
    '22:00',
    '10:00',
    '15:00',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    day_start_time = '06:00',
    day_end_time = '22:00',
    energy_peak_time = '10:00',
    energy_dip_time = '15:00';

  RAISE NOTICE 'Test user ID: %', test_user_id;
END $$;

-- ============================================================================
-- TEST SCENARIO 1: LEAVE HABIT with Day 1 Letter & Urge Surfing
-- ============================================================================

-- Create a "Quit Smoking" leave habit with high addiction level
INSERT INTO habits (
  user_id,
  name,
  category_id,
  icon_emoji,
  habit_type,
  frequency,
  intent,
  addiction_level,
  origin_anchor,
  day1_letter,
  day1_letter_delivered,
  vulnerability_hour,
  created_at
)
SELECT 
  id,
  'Quit Smoking',
  'break_free',
  '🚭',
  'break',
  'daily',
  'leave',
  8, -- High addiction level
  'I saw my daughter looking at me differently. I don''t want her to remember me like this.',
  'Hey. I know today is hard. When I wrote this, I wanted you to remember why you started. You''re not doing this because you have to. You''re doing this because you chose to. The urge will pass. It always does. You''ve made it this far. That version of you who decided this — they believed in you. I still do.',
  false,
  14, -- 2pm vulnerability hour (will trigger urge surfing at 12:30pm for testing)
  NOW() - INTERVAL '5 days'
FROM auth.users WHERE email = 'test@mirror.app'
ON CONFLICT DO NOTHING;

-- Add check-ins for the last 5 days (building streak)
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  (CURRENT_DATE - interval '1 day' * generate_series(4, 0))::date,
  'done',
  (NOW() - interval '1 day' * generate_series(4, 0))
FROM auth.users u
JOIN habits h ON h.user_id = u.id
WHERE u.email = 'test@mirror.app' AND h.name = 'Quit Smoking'
ON CONFLICT (habit_id, date) DO NOTHING;

-- Add historical slips to establish vulnerability pattern (all around 2pm)
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  (CURRENT_DATE - interval '1 day' * (10 + generate_series(0, 4)))::date,
  'honest_slip',
  (NOW() - interval '1 day' * (10 + generate_series(0, 4))) + interval '14 hours' -- All at 2pm
FROM auth.users u
JOIN habits h ON h.user_id = u.id
WHERE u.email = 'test@mirror.app' AND h.name = 'Quit Smoking'
ON CONFLICT (habit_id, date) DO NOTHING;

-- ============================================================================
-- TEST SCENARIO 2: START HABIT with Grace Days Earned
-- ============================================================================

-- Create "Morning Workout" with 32-day streak (should have 1 grace day)
INSERT INTO habits (
  user_id,
  name,
  category_id,
  icon_emoji,
  habit_type,
  frequency,
  intent,
  banked_grace_days,
  grace_days_earned_total,
  last_grace_day_earned_at,
  created_at
)
SELECT 
  id,
  'Morning Workout',
  'build_up',
  '💪',
  'build',
  'daily',
  'start',
  1, -- Has 1 grace day available
  1,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '32 days'
FROM auth.users WHERE email = 'test@mirror.app'
ON CONFLICT DO NOTHING;

-- Add check-ins for 32 consecutive days
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  (CURRENT_DATE - interval '1 day' * generate_series(31, 0))::date,
  'done',
  (NOW() - interval '1 day' * generate_series(31, 0))
FROM auth.users u
JOIN habits h ON h.user_id = u.id
WHERE u.email = 'test@mirror.app' AND h.name = 'Morning Workout'
ON CONFLICT (habit_id, date) DO NOTHING;

-- ============================================================================
-- TEST SCENARIO 3: RE-ENTRY SCENARIO (User returning after 4 days)
-- ============================================================================

-- Create "Reading" habit with gap in check-ins
INSERT INTO habits (
  user_id,
  name,
  category_id,
  icon_emoji,
  habit_type,
  frequency,
  intent,
  created_at
)
SELECT 
  id,
  'Reading',
  'build_up',
  '📚',
  'build',
  'daily',
  'start',
  NOW() - INTERVAL '20 days'
FROM auth.users WHERE email = 'test@mirror.app'
ON CONFLICT DO NOTHING;

-- Add check-ins up to 5 days ago, then nothing (simulates 4-day absence)
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  (CURRENT_DATE - interval '1 day' * generate_series(19, 5))::date,
  CASE WHEN random() > 0.2 THEN 'done' ELSE 'skip' END,
  (NOW() - interval '1 day' * generate_series(19, 5))
FROM auth.users u
JOIN habits h ON h.user_id = u.id
WHERE u.email = 'test@mirror.app' AND h.name = 'Reading'
ON CONFLICT (habit_id, date) DO NOTHING;

-- ============================================================================
-- TEST SCENARIO 4: LIVING PROGRESS RING (Multiple habits at different states)
-- ============================================================================

-- Create 5 habits for today's dashboard
INSERT INTO habits (user_id, name, category_id, icon_emoji, habit_type, frequency, intent, created_at)
SELECT 
  id,
  habit_name,
  'build_up',
  emoji,
  'build',
  'daily',
  'start',
  NOW() - INTERVAL '10 days'
FROM auth.users u,
LATERAL (VALUES 
  ('Meditation', '🧘'),
  ('Water Intake', '💧'),
  ('Journal', '✍️'),
  ('Walk', '🚶'),
  ('Gratitude', '🙏')
) AS habits(habit_name, emoji)
WHERE u.email = 'test@mirror.app'
ON CONFLICT DO NOTHING;

-- Log 2 out of 7 habits today (28% completion - should show "Starting" state)
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  CURRENT_DATE,
  'done',
  NOW() - INTERVAL '2 hours'
FROM auth.users u
JOIN habits h ON h.user_id = u.id
WHERE u.email = 'test@mirror.app' 
  AND h.name IN ('Meditation', 'Water Intake')
ON CONFLICT (habit_id, date) DO NOTHING;

-- ============================================================================
-- TEST SCENARIO 5: PATTERN SURPRISE DATA
-- ============================================================================

-- Create habit with "Day of Week Breakthrough" pattern (used to slip on Mondays, hasn't for 2 weeks)
INSERT INTO habits (
  user_id,
  name,
  category_id,
  icon_emoji,
  habit_type,
  frequency,
  intent,
  created_at
)
SELECT 
  id,
  'No Social Media',
  'break_free',
  '📱',
  'break',
  'daily',
  'leave',
  NOW() - INTERVAL '30 days'
FROM auth.users WHERE email = 'test@mirror.app'
ON CONFLICT DO NOTHING;

-- Add slips on Mondays 3-4 weeks ago
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  date_val::date,
  'honest_slip',
  date_val::timestamp
FROM auth.users u
JOIN habits h ON h.user_id = u.id
CROSS JOIN (
  SELECT generate_series(
    date_trunc('week', CURRENT_DATE - INTERVAL '4 weeks'),
    date_trunc('week', CURRENT_DATE - INTERVAL '2 weeks'),
    '1 week'::interval
  ) AS date_val
) dates
WHERE u.email = 'test@mirror.app' AND h.name = 'No Social Media'
ON CONFLICT (habit_id, date) DO NOTHING;

-- Add successful check-ins for last 14 days (including recent Mondays)
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  (CURRENT_DATE - interval '1 day' * generate_series(13, 0))::date,
  'done',
  (NOW() - interval '1 day' * generate_series(13, 0))
FROM auth.users u
JOIN habits h ON h.user_id = u.id
WHERE u.email = 'test@mirror.app' AND h.name = 'No Social Media'
ON CONFLICT (habit_id, date) DO NOTHING;

-- ============================================================================
-- TEST SCENARIO 6: FORGIVENESS MODE (Yesterday missed, within grace window)
-- ============================================================================

-- Create habit that should show forgiveness mode
INSERT INTO habits (
  user_id,
  name,
  category_id,
  icon_emoji,
  habit_type,
  frequency,
  intent,
  created_at
)
SELECT 
  id,
  'Yoga',
  'build_up',
  '🧘‍♀️',
  'build',
  'daily',
  'start',
  NOW() - INTERVAL '15 days'
FROM auth.users WHERE email = 'test@mirror.app'
ON CONFLICT DO NOTHING;

-- Add check-ins up to 2 days ago (yesterday is missing - should trigger forgiveness)
INSERT INTO check_ins (user_id, habit_id, date, status, created_at)
SELECT 
  u.id,
  h.id,
  (CURRENT_DATE - interval '1 day' * generate_series(8, 2))::date,
  'done',
  (NOW() - interval '1 day' * generate_series(8, 2))
FROM auth.users u
JOIN habits h ON h.user_id = u.id
WHERE u.email = 'test@mirror.app' AND h.name = 'Yoga'
ON CONFLICT (habit_id, date) DO NOTHING;

-- ============================================================================
-- NOTIFICATION TEST DATA (ACCELERATED TIMELINE)
-- ============================================================================

-- For testing notifications within 10 minutes, we'll use groq_rate_limits table
-- to simulate rate limit windows

-- Clear existing rate limits for test user
DELETE FROM groq_rate_limits 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'test@mirror.app');

-- Set up rate limits that will allow immediate testing
INSERT INTO groq_rate_limits (user_id, endpoint, date, count, created_at, updated_at)
SELECT 
  id,
  endpoint,
  CURRENT_DATE,
  0, -- No requests yet
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
FROM auth.users u
CROSS JOIN (VALUES 
  ('checkin'),
  ('insight'),
  ('notifications'),
  ('unexpected')
) AS endpoints(endpoint)
WHERE u.email = 'test@mirror.app'
ON CONFLICT (user_id, date, endpoint) DO UPDATE SET count = 0;

-- ============================================================================
-- SUMMARY OUTPUT
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID;
  habit_count INTEGER;
  checkin_count INTEGER;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@mirror.app';
  SELECT COUNT(*) INTO habit_count FROM habits WHERE user_id = test_user_id;
  SELECT COUNT(*) INTO checkin_count FROM check_ins WHERE user_id = test_user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST DATA CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test User ID: %', test_user_id;
  RAISE NOTICE 'Habits Created: %', habit_count;
  RAISE NOTICE 'Check-ins Created: %', checkin_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE 'Email: test@mirror.app';
  RAISE NOTICE 'Password: Mirror2024!Test.';
  RAISE NOTICE '========================================';
END $$;
