-- ============================================================
-- Mirror Test Data Generator
-- Creates realistic 90-day habit tracking data for testing
-- ============================================================
--
-- Login credentials:
--   Email: test@mirror.app
--   Password: Mirror2024!Test
--
-- To run: Copy and paste into Supabase SQL Editor
-- To cleanup: Run test_data_cleanup.sql
--
-- ============================================================

-- ── 1. Create test user ─────────────────────────────────────

DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT := 'test@mirror.app';
  test_password TEXT := 'Mirror2024!Test';
BEGIN
  -- Check if user already exists
  SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
  
  IF test_user_id IS NULL THEN
    -- Create user in auth.users (Supabase Auth)
    -- Note: This requires admin privileges. If this fails, create user via Supabase Dashboard
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      test_email,
      crypt(test_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      '',
      ''
    ) RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Created test user: %', test_user_id;
  ELSE
    RAISE NOTICE 'Test user already exists: %', test_user_id;
  END IF;
  
  -- Create/update profile
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
END $$;

-- ── 2. Create habits ────────────────────────────────────────

DO $$
DECLARE
  test_user_id UUID;
  h1_id UUID; h2_id UUID; h3_id UUID; h4_id UUID; h5_id UUID; h6_id UUID;
  h7_id UUID; h8_id UUID; h9_id UUID; h10_id UUID; h11_id UUID; h12_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@mirror.app';
  
  -- Delete existing habits for clean slate
  DELETE FROM habits WHERE user_id = test_user_id;
  
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
  RAISE NOTICE 'h1 (Workout): %, h2 (No Porn): %, h3 (No Alcohol): %', h1_id, h2_id, h3_id;
  RAISE NOTICE 'h4 (Water): %, h5 (Wake): %, h6 (Reading): %', h4_id, h5_id, h6_id;
  RAISE NOTICE 'h7 (Meditation): %, h8 (No Smoking): %, h9 (Protein): %', h7_id, h8_id, h9_id;
  RAISE NOTICE 'h10 (Sleep): %, h11 (No Social): %, h12 (Gratitude): %', h10_id, h11_id, h12_id;
END $$;

-- ── 3. Generate 90 days of check-ins ────────────────────────

DO $$
DECLARE
  test_user_id UUID;
  h1_id UUID; h2_id UUID; h3_id UUID; h4_id UUID; h5_id UUID; h6_id UUID;
  h7_id UUID; h8_id UUID; h9_id UUID; h10_id UUID; h11_id UUID; h12_id UUID;
  loop_date DATE;
  day_offset INT;
  day_of_week INT;
  random_val FLOAT;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@mirror.app';
  
  -- Get habit IDs
  SELECT id INTO h1_id FROM habits WHERE user_id = test_user_id AND name = 'Morning Workout';
  SELECT id INTO h2_id FROM habits WHERE user_id = test_user_id AND name = 'No Porn/Masturbation';
  SELECT id INTO h3_id FROM habits WHERE user_id = test_user_id AND name = 'No Alcohol';
  SELECT id INTO h4_id FROM habits WHERE user_id = test_user_id AND name = 'Drink Water';
  SELECT id INTO h5_id FROM habits WHERE user_id = test_user_id AND name = 'Wake Up Early';
  SELECT id INTO h6_id FROM habits WHERE user_id = test_user_id AND name = 'Reading';
  SELECT id INTO h7_id FROM habits WHERE user_id = test_user_id AND name = 'Meditation';
  SELECT id INTO h8_id FROM habits WHERE user_id = test_user_id AND name = 'No Smoking';
  SELECT id INTO h9_id FROM habits WHERE user_id = test_user_id AND name = 'Protein Intake';
  SELECT id INTO h10_id FROM habits WHERE user_id = test_user_id AND name = 'Sleep by 10pm';
  SELECT id INTO h11_id FROM habits WHERE user_id = test_user_id AND name = 'No Social Media';
  SELECT id INTO h12_id FROM habits WHERE user_id = test_user_id AND name = 'Gratitude Journal';
  
  -- Loop through 90 days
  FOR day_offset IN 0..89 LOOP
    loop_date := CURRENT_DATE - day_offset;
    day_of_week := EXTRACT(DOW FROM loop_date); -- 0=Sunday, 6=Saturday
    
    -- h1: Workout (strong streak, 85% done, occasional skip)
    random_val := random();
    IF random_val < 0.85 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h1_id, loop_date, 'done');
    ELSIF random_val < 0.95 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h1_id, loop_date, 'partial');
    ELSE
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h1_id, loop_date, 'skip');
    END IF;
    
    -- h2: No Porn (struggling, 60% success, more slips early on)
    random_val := random();
    IF day_offset > 60 THEN -- Worse in early days
      IF random_val < 0.45 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'done');
      ELSE
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'honest_slip');
      END IF;
    ELSE -- Better recently
      IF random_val < 0.70 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'done');
      ELSE
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h2_id, loop_date, 'honest_slip');
      END IF;
    END IF;
    
    -- h3: No Alcohol (weekend slips, weekday strong)
    IF day_of_week IN (5, 6) THEN -- Friday, Saturday
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
    
    -- h4: Water (strong, 80% done)
    random_val := random();
    IF random_val < 0.80 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h4_id, loop_date, 'done');
    ELSIF random_val < 0.95 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h4_id, loop_date, 'partial');
    END IF;
    
    -- h5: Wake Early (correlated with sleep, 75% done)
    random_val := random();
    IF random_val < 0.75 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h5_id, loop_date, 'done');
    ELSIF random_val < 0.85 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h5_id, loop_date, 'partial');
    ELSE
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h5_id, loop_date, 'skip');
    END IF;
    
    -- h6: Reading (improving trend, 50%→80%)
    random_val := random();
    IF day_offset > 60 THEN
      IF random_val < 0.50 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'done');
      ELSIF random_val < 0.70 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'partial');
      END IF;
    ELSE
      IF random_val < 0.80 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'done');
      ELSIF random_val < 0.90 THEN
        INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h6_id, loop_date, 'partial');
      END IF;
    END IF;
    
    -- h7: Meditation (correlated with workout, 70% done)
    random_val := random();
    IF random_val < 0.70 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h7_id, loop_date, 'done');
    ELSIF random_val < 0.85 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h7_id, loop_date, 'partial');
    END IF;
    
    -- h8: No Smoking (improving, 15→5 cigarettes)
    random_val := random();
    IF random_val < 0.65 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h8_id, loop_date, 'done');
    ELSE
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h8_id, loop_date, 'honest_slip');
    END IF;
    
    -- h9: Protein (70% done)
    random_val := random();
    IF random_val < 0.70 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h9_id, loop_date, 'done');
    ELSIF random_val < 0.85 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h9_id, loop_date, 'partial');
    END IF;
    
    -- h10: Sleep (correlated with wake, 75% done)
    random_val := random();
    IF random_val < 0.75 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h10_id, loop_date, 'done');
    ELSIF random_val < 0.85 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h10_id, loop_date, 'partial');
    END IF;
    
    -- h11: No Social Media (struggling, 55% done)
    random_val := random();
    IF random_val < 0.55 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h11_id, loop_date, 'done');
    ELSE
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h11_id, loop_date, 'honest_slip');
    END IF;
    
    -- h12: Gratitude (strong, 80% done)
    random_val := random();
    IF random_val < 0.80 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h12_id, loop_date, 'done');
    ELSIF random_val < 0.90 THEN
      INSERT INTO check_ins (user_id, habit_id, date, status) VALUES (test_user_id, h12_id, loop_date, 'partial');
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Created 90 days of check-ins for 12 habits';
END $$;

-- ── 4. Generate quantity logs for quantifiable habits ───────

DO $$
DECLARE
  test_user_id UUID;
  h4_id UUID; h6_id UUID; h8_id UUID; h9_id UUID;
  loop_date DATE;
  day_offset INT;
  water_total INT;
  reading_total INT;
  smoking_total INT;
  protein_total INT;
  entry_time TIMESTAMPTZ;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@mirror.app';
  
  SELECT id INTO h4_id FROM habits WHERE user_id = test_user_id AND name = 'Drink Water';
  SELECT id INTO h6_id FROM habits WHERE user_id = test_user_id AND name = 'Reading';
  SELECT id INTO h8_id FROM habits WHERE user_id = test_user_id AND name = 'No Smoking';
  SELECT id INTO h9_id FROM habits WHERE user_id = test_user_id AND name = 'Protein Intake';
  
  FOR day_offset IN 0..89 LOOP
    loop_date := CURRENT_DATE - day_offset;
    
    -- Water: 5-9 glasses (target 8)
    water_total := 5 + floor(random() * 5)::INT;
    INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
    VALUES (
      test_user_id,
      h4_id,
      loop_date,
      jsonb_build_array(
        jsonb_build_object('time', (loop_date + interval '8 hours')::TEXT, 'amount', 1, 'unit', 'glasses'),
        jsonb_build_object('time', (loop_date + interval '10 hours')::TEXT, 'amount', 1, 'unit', 'glasses'),
        jsonb_build_object('time', (loop_date + interval '12 hours')::TEXT, 'amount', 1, 'unit', 'glasses'),
        jsonb_build_object('time', (loop_date + interval '14 hours')::TEXT, 'amount', 1, 'unit', 'glasses'),
        jsonb_build_object('time', (loop_date + interval '16 hours')::TEXT, 'amount', water_total - 4, 'unit', 'glasses')
      ),
      water_total,
      8,
      water_total >= 8
    );
    
    -- Reading: improving 10→35 pages (target 30)
    IF day_offset > 60 THEN
      reading_total := 10 + floor(random() * 15)::INT;
    ELSE
      reading_total := 25 + floor(random() * 15)::INT;
    END IF;
    INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
    VALUES (
      test_user_id,
      h6_id,
      loop_date,
      jsonb_build_array(
        jsonb_build_object('time', (loop_date + interval '19 hours')::TEXT, 'amount', reading_total, 'unit', 'pages')
      ),
      reading_total,
      30,
      reading_total >= 30
    );
    
    -- Smoking: reducing 15→5 cigarettes (target 0)
    IF day_offset > 60 THEN
      smoking_total := 12 + floor(random() * 6)::INT; -- 12-17
    ELSIF day_offset > 30 THEN
      smoking_total := 8 + floor(random() * 5)::INT; -- 8-12
    ELSE
      smoking_total := 3 + floor(random() * 5)::INT; -- 3-7
    END IF;
    INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
    VALUES (
      test_user_id,
      h8_id,
      loop_date,
      jsonb_build_array(
        jsonb_build_object('time', (loop_date + interval '9 hours')::TEXT, 'amount', smoking_total / 3, 'unit', 'cigarettes'),
        jsonb_build_object('time', (loop_date + interval '14 hours')::TEXT, 'amount', smoking_total / 3, 'unit', 'cigarettes'),
        jsonb_build_object('time', (loop_date + interval '20 hours')::TEXT, 'amount', smoking_total - (smoking_total / 3 * 2), 'unit', 'cigarettes')
      ),
      smoking_total,
      0,
      smoking_total = 0
    );
    
    -- Protein: 120-170g (target 150)
    protein_total := 120 + floor(random() * 51)::INT;
    INSERT INTO daily_quantity_logs (user_id, habit_id, date, entries, running_total, daily_target, goal_met)
    VALUES (
      test_user_id,
      h9_id,
      loop_date,
      jsonb_build_array(
        jsonb_build_object('time', (loop_date + interval '8 hours')::TEXT, 'amount', 40, 'unit', 'grams'),
        jsonb_build_object('time', (loop_date + interval '13 hours')::TEXT, 'amount', 50, 'unit', 'grams'),
        jsonb_build_object('time', (loop_date + interval '19 hours')::TEXT, 'amount', protein_total - 90, 'unit', 'grams')
      ),
      protein_total,
      150,
      protein_total >= 150
    );
    
  END LOOP;
  
  RAISE NOTICE 'Created 90 days of quantity logs for 4 quantifiable habits';
END $$;

-- ── 5. Summary ──────────────────────────────────────────────

DO $$
DECLARE
  test_user_id UUID;
  habit_count INT;
  checkin_count INT;
  qlog_count INT;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@mirror.app';
  
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
END $$;
