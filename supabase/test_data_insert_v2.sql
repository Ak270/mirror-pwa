-- ============================================================
-- Mirror Test Data Generator v2
-- Creates realistic 90-day habit tracking data for testing
-- ============================================================
--
-- IMPORTANT: Create user FIRST via Supabase Dashboard:
--   1. Go to Authentication → Users → Add User
--   2. Email: test@mirror.app
--   3. Password: Mirror2024!Test
--   4. Auto-confirm: YES
--   5. Copy the User ID that gets generated
--   6. Replace USER_ID_HERE below with that ID
--   7. Then run this script
--
-- To cleanup: Run test_data_cleanup.sql
--
-- ============================================================

-- ⚠️ REPLACE THIS WITH YOUR ACTUAL USER ID FROM SUPABASE DASHBOARD
DO $$
DECLARE
  test_user_id UUID := 'USER_ID_HERE'; -- ← PASTE USER ID HERE
  h1_id UUID; h2_id UUID; h3_id UUID; h4_id UUID; h5_id UUID; h6_id UUID;
  h7_id UUID; h8_id UUID; h9_id UUID; h10_id UUID; h11_id UUID; h12_id UUID;
BEGIN
  
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    RAISE EXCEPTION 'User % not found. Create user in Supabase Dashboard first!', test_user_id;
  END IF;
  
  RAISE NOTICE 'Found user: %', test_user_id;
  
  -- ── 1. Create/update profile ────────────────────────────────
  
  INSERT INTO profiles (id, display_name, onboarding_completed, selected_categories)
  VALUES (
    test_user_id,
    'Test User',
    true,
    ARRAY['build_up', 'break_free', 'rhythm', 'mind_spirit']
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = 'Test User',
    onboarding_completed = true,
    selected_categories = ARRAY['build_up', 'break_free', 'rhythm', 'mind_spirit'];
    
  RAISE NOTICE 'Profile created/updated';
  
  -- ── 2. Delete existing test data ────────────────────────────
  
  DELETE FROM daily_quantity_logs WHERE user_id = test_user_id;
  DELETE FROM notification_conversations WHERE user_id = test_user_id;
  DELETE FROM check_ins WHERE user_id = test_user_id;
  DELETE FROM habits WHERE user_id = test_user_id;
  
  RAISE NOTICE 'Cleaned up existing data';
  
  -- ── 3. Create 12 habits ─────────────────────────────────────
  
  -- 1. Morning Workout (build_up, timed, 6:30am)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, reminder_time, display_type, why_anchor)
  VALUES (test_user_id, 'Morning Workout', '💪', 'build_up', 'build', 'daily', '06:30:00', 'binary', 'Build strength and energy for the day')
  RETURNING id INTO h1_id;
  
  -- 2. No Porn/Masturbation (break_free, 2hr check-ins)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, display_type, check_in_interval_minutes, daily_reduction_goal, daily_reduction_unit, yesterday_baseline)
  VALUES (test_user_id, 'No Porn/Masturbation', '🔓', 'break_free', 'break', 'daily', 'counter', 120, 0, 'times', 2)
  RETURNING id INTO h2_id;
  
  -- 3. No Alcohol (break_free, 4hr check-ins)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, display_type, check_in_interval_minutes, daily_reduction_goal, daily_reduction_unit, yesterday_baseline)
  VALUES (test_user_id, 'No Alcohol', '🍺', 'break_free', 'break', 'daily', 'counter', 240, 0, 'drinks', 3)
  RETURNING id INTO h3_id;
  
  -- 4. Drink Water (quantifiable, 8 glasses, hourly 8am-8pm)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, display_type, daily_target, daily_target_unit, reminder_interval_minutes, reminder_start_time, reminder_end_time)
  VALUES (test_user_id, 'Drink Water', '💧', 'build_up', 'build', 'daily', 'counter', 8, 'glasses', 60, '08:00:00', '20:00:00')
  RETURNING id INTO h4_id;
  
  -- 5. Early Wake Up (rhythm, 6:00am)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, reminder_time, display_type, why_anchor)
  VALUES (test_user_id, 'Wake Up Early', '🌅', 'rhythm', 'rhythm', 'daily', '06:00:00', 'binary', 'Start day with intention and peace')
  RETURNING id INTO h5_id;
  
  -- 6. Reading (quantifiable, 30 pages/day)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, display_type, daily_target, daily_target_unit, reminder_interval_minutes, reminder_start_time, reminder_end_time)
  VALUES (test_user_id, 'Reading', '📚', 'build_up', 'build', 'daily', 'counter', 30, 'pages', 120, '18:00:00', '22:00:00')
  RETURNING id INTO h6_id;
  
  -- 7. Meditation (mind_spirit, 7:00pm)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, reminder_time, display_type, why_anchor)
  VALUES (test_user_id, 'Meditation', '🧘', 'mind_spirit', 'build', 'daily', '19:00:00', 'binary', 'Find inner peace and clarity')
  RETURNING id INTO h7_id;
  
  -- 8. No Smoking (break_free, 3hr check-ins, 15→0 goal)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, display_type, check_in_interval_minutes, daily_reduction_goal, daily_reduction_unit, yesterday_baseline)
  VALUES (test_user_id, 'No Smoking', '🚭', 'break_free', 'break', 'daily', 'counter', 180, 0, 'cigarettes', 15)
  RETURNING id INTO h8_id;
  
  -- 9. Protein Intake (quantifiable, 150g/day)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, display_type, daily_target, daily_target_unit, reminder_interval_minutes, reminder_start_time, reminder_end_time)
  VALUES (test_user_id, 'Protein Intake', '🥩', 'build_up', 'build', 'daily', 'counter', 150, 'grams', 180, '08:00:00', '20:00:00')
  RETURNING id INTO h9_id;
  
  -- 10. Sleep by 10pm (rhythm, 10:00pm)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, reminder_time, display_type, why_anchor)
  VALUES (test_user_id, 'Sleep by 10pm', '😴', 'rhythm', 'rhythm', 'daily', '22:00:00', 'binary', 'Rest and recover for tomorrow')
  RETURNING id INTO h10_id;
  
  -- 11. No Social Media Scrolling (break_free, 2hr check-ins)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, display_type, check_in_interval_minutes, daily_reduction_goal, daily_reduction_unit, yesterday_baseline)
  VALUES (test_user_id, 'No Social Media', '📱', 'break_free', 'break', 'daily', 'counter', 120, 0, 'sessions', 8)
  RETURNING id INTO h11_id;
  
  -- 12. Gratitude Journal (mind_spirit, 9:00pm)
  INSERT INTO habits (user_id, name, icon_emoji, category_id, habit_type, frequency, reminder_time, display_type, why_anchor)
  VALUES (test_user_id, 'Gratitude Journal', '📝', 'mind_spirit', 'build', 'daily', '21:00:00', 'binary', 'Appreciate life and stay positive')
  RETURNING id INTO h12_id;
  
  RAISE NOTICE 'Created 12 habits';
  
  -- ── 4. Generate 90 days of check-ins ────────────────────────
  
  DECLARE
    loop_date DATE;
    day_offset INT;
    day_of_week INT;
    random_val FLOAT;
  BEGIN
    FOR day_offset IN 0..89 LOOP
      loop_date := CURRENT_DATE - day_offset;
      day_of_week := EXTRACT(DOW FROM loop_date);
      
      -- h1: Workout (85% done)
      random_val := random();
      IF random_val < 0.85 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h1_id, loop_date, 'done');
      ELSIF random_val < 0.95 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h1_id, loop_date, 'partial');
      ELSE
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h1_id, loop_date, 'skip');
      END IF;
      
      -- h2: No Porn (improving 45%→70%)
      random_val := random();
      IF day_offset > 60 THEN
        IF random_val < 0.45 THEN
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'done');
        ELSE
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'honest_slip');
        END IF;
      ELSE
        IF random_val < 0.70 THEN
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'done');
        ELSE
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'honest_slip');
        END IF;
      END IF;
      
      -- h3: No Alcohol (weekend slips)
      IF day_of_week IN (5, 6) THEN
        random_val := random();
        IF random_val < 0.40 THEN
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h3_id, loop_date, 'done');
        ELSE
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h3_id, loop_date, 'honest_slip');
        END IF;
      ELSE
        random_val := random();
        IF random_val < 0.90 THEN
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h3_id, loop_date, 'done');
        ELSE
          INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h3_id, loop_date, 'partial');
        END IF;
      END IF;
      
      -- h4-h12: Similar patterns...
      random_val := random();
      IF random_val < 0.80 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h4_id, loop_date, 'done');
      ELSIF random_val < 0.95 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h4_id, loop_date, 'partial'); END IF;
      
      random_val := random();
      IF random_val < 0.75 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h5_id, loop_date, 'done');
      ELSIF random_val < 0.85 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h5_id, loop_date, 'partial');
      ELSE INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h5_id, loop_date, 'skip'); END IF;
      
      random_val := random();
      IF day_offset > 60 THEN
        IF random_val < 0.50 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'done');
        ELSIF random_val < 0.70 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'partial'); END IF;
      ELSE
        IF random_val < 0.80 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'done');
        ELSIF random_val < 0.90 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'partial'); END IF;
      END IF;
      
      random_val := random();
      IF random_val < 0.70 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h7_id, loop_date, 'done');
      ELSIF random_val < 0.85 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h7_id, loop_date, 'partial'); END IF;
      
      random_val := random();
      IF random_val < 0.65 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h8_id, loop_date, 'done');
      ELSE INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h8_id, loop_date, 'honest_slip'); END IF;
      
      random_val := random();
      IF random_val < 0.70 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h9_id, loop_date, 'done');
      ELSIF random_val < 0.85 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h9_id, loop_date, 'partial'); END IF;
      
      random_val := random();
      IF random_val < 0.75 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h10_id, loop_date, 'done');
      ELSIF random_val < 0.85 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h10_id, loop_date, 'partial'); END IF;
      
      random_val := random();
      IF random_val < 0.55 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h11_id, loop_date, 'done');
      ELSE INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h11_id, loop_date, 'honest_slip'); END IF;
      
      random_val := random();
      IF random_val < 0.80 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h12_id, loop_date, 'done');
      ELSIF random_val < 0.90 THEN INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h12_id, loop_date, 'partial'); END IF;
      
    END LOOP;
    
    RAISE NOTICE 'Created 90 days of check-ins';
  END;
  
  -- ── 5. Generate quantity logs ───────────────────────────────
  
  DECLARE
    loop_date DATE;
    day_offset INT;
    water_total INT;
    reading_total INT;
    smoking_total INT;
    protein_total INT;
  BEGIN
    FOR day_offset IN 0..89 LOOP
      loop_date := CURRENT_DATE - day_offset;
      
      -- Water: 5-9 glasses
      water_total := 5 + floor(random() * 5)::INT;
      INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
      VALUES (test_user_id, h4_id, loop_date,
        jsonb_build_array(
          jsonb_build_object('time', (loop_date + interval '8 hours')::TEXT, 'amount', 1, 'unit', 'glasses'),
          jsonb_build_object('time', (loop_date + interval '12 hours')::TEXT, 'amount', 2, 'unit', 'glasses'),
          jsonb_build_object('time', (loop_date + interval '16 hours')::TEXT, 'amount', water_total - 3, 'unit', 'glasses')
        ), water_total, 8, water_total >= 8);
      
      -- Reading: 10→35 pages
      IF day_offset > 60 THEN reading_total := 10 + floor(random() * 15)::INT;
      ELSE reading_total := 25 + floor(random() * 15)::INT; END IF;
      INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
      VALUES (test_user_id, h6_id, loop_date,
        jsonb_build_array(jsonb_build_object('time', (loop_date + interval '19 hours')::TEXT, 'amount', reading_total, 'unit', 'pages')),
        reading_total, 30, reading_total >= 30);
      
      -- Smoking: 15→5 cigarettes
      IF day_offset > 60 THEN smoking_total := 12 + floor(random() * 6)::INT;
      ELSIF day_offset > 30 THEN smoking_total := 8 + floor(random() * 5)::INT;
      ELSE smoking_total := 3 + floor(random() * 5)::INT; END IF;
      INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
      VALUES (test_user_id, h8_id, loop_date,
        jsonb_build_array(
          jsonb_build_object('time', (loop_date + interval '9 hours')::TEXT, 'amount', smoking_total / 3, 'unit', 'cigarettes'),
          jsonb_build_object('time', (loop_date + interval '14 hours')::TEXT, 'amount', smoking_total / 3, 'unit', 'cigarettes'),
          jsonb_build_object('time', (loop_date + interval '20 hours')::TEXT, 'amount', smoking_total - (smoking_total / 3 * 2), 'unit', 'cigarettes')
        ), smoking_total, 0, smoking_total = 0);
      
      -- Protein: 120-170g
      protein_total := 120 + floor(random() * 51)::INT;
      INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
      VALUES (test_user_id, h9_id, loop_date,
        jsonb_build_array(
          jsonb_build_object('time', (loop_date + interval '8 hours')::TEXT, 'amount', 40, 'unit', 'grams'),
          jsonb_build_object('time', (loop_date + interval '13 hours')::TEXT, 'amount', 50, 'unit', 'grams'),
          jsonb_build_object('time', (loop_date + interval '19 hours')::TEXT, 'amount', protein_total - 90, 'unit', 'grams')
        ), protein_total, 150, protein_total >= 150);
      
    END LOOP;
    
    RAISE NOTICE 'Created 90 days of quantity logs';
  END;
  
  -- ── 6. Summary ──────────────────────────────────────────────
  
  DECLARE
    habit_count INT;
    checkin_count INT;
    qlog_count INT;
  BEGIN
    SELECT COUNT(*) INTO habit_count FROM habits WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO checkin_count FROM check_ins WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO qlog_count FROM daily_quantity_logs WHERE user_id = test_user_id;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST DATA CREATED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Email: test@mirror.app';
    RAISE NOTICE 'Password: Mirror2024!Test';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Habits created: %', habit_count;
    RAISE NOTICE 'Check-ins created: %', checkin_count;
    RAISE NOTICE 'Quantity logs created: %', qlog_count;
    RAISE NOTICE '========================================';
  END;
  
END $$;
