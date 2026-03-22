-- ============================================================
-- Mirror Test Data Cleanup
-- Removes all test data created by test_data_insert.sql
-- ============================================================
--
-- WARNING: This will permanently delete:
--   - Test user account (test@mirror.app)
--   - All habits, check-ins, and quantity logs for test user
--
-- To run: Copy and paste into Supabase SQL Editor
--
-- ============================================================

DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT := 'test@mirror.app';
  deleted_habits INT;
  deleted_checkins INT;
  deleted_qlogs INT;
  deleted_convos INT;
BEGIN
  -- Get test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Test user not found. Nothing to clean up.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found test user: %', test_user_id;
  RAISE NOTICE 'Starting cleanup...';
  
  -- Delete notification conversations
  DELETE FROM notification_conversations WHERE user_id = test_user_id;
  GET DIAGNOSTICS deleted_convos = ROW_COUNT;
  
  -- Delete quantity logs
  DELETE FROM daily_quantity_logs WHERE user_id = test_user_id;
  GET DIAGNOSTICS deleted_qlogs = ROW_COUNT;
  
  -- Delete check-ins
  DELETE FROM check_ins WHERE user_id = test_user_id;
  GET DIAGNOSTICS deleted_checkins = ROW_COUNT;
  
  -- Delete habits
  DELETE FROM habits WHERE user_id = test_user_id;
  GET DIAGNOSTICS deleted_habits = ROW_COUNT;
  
  -- Delete profile
  DELETE FROM profiles WHERE id = test_user_id;
  
  -- Delete notification subscriptions
  DELETE FROM notification_subscriptions WHERE user_id = test_user_id;
  
  -- Delete user from auth.users
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CLEANUP COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Deleted conversations: %', deleted_convos;
  RAISE NOTICE 'Deleted quantity logs: %', deleted_qlogs;
  RAISE NOTICE 'Deleted check-ins: %', deleted_checkins;
  RAISE NOTICE 'Deleted habits: %', deleted_habits;
  RAISE NOTICE 'Deleted user: %', test_email;
  RAISE NOTICE '========================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during cleanup: %', SQLERRM;
    RAISE NOTICE 'You may need to delete the user manually from Supabase Dashboard';
END $$;
