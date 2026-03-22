-- ============================================================
-- Fix auth.users NULL column issue
-- Updates NULL values to empty strings for auth compatibility
-- ============================================================

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE email = 'test@mirror.app';

-- Verify the fix
SELECT 
  id,
  email,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
FROM auth.users
WHERE email = 'test@mirror.app';
