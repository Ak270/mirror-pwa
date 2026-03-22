# Quick Fix for Test User Login Issue

## Problem
The error `"email_change": converting NULL to string is unsupported` occurs because Supabase auth requires certain columns to be empty strings `''` instead of `NULL`.

## Solution (2 options)

### **Option A: Fix Existing User (Fastest)**

1. Open Supabase SQL Editor
2. Run this query:

```sql
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE email = 'test@mirror.app';
```

3. Try logging in again with:
   - Email: `test@mirror.app`
   - Password: `Mirror2024!Test`

---

### **Option B: Delete & Recreate User Properly**

1. **Delete the broken user:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find `test@mirror.app`
   - Click the three dots → Delete User

2. **Create user via Dashboard (NOT SQL):**
   - Click **Add User** button
   - Email: `test@mirror.app`
   - Password: `Mirror2024!Test`
   - **Auto Confirm User:** ✅ YES
   - Click **Create User**
   - Copy the generated User ID

3. **Run the data population script:**
   - Open `/supabase/test_data_insert_v2.sql`
   - Replace line 21: `test_user_id UUID := 'USER_ID_HERE';`
   - Paste your copied User ID
   - Run the entire script in SQL Editor

---

## Why This Happens

When creating users via SQL (like the original script tried), these columns must be set to `''` not `NULL`:
- `confirmation_token`
- `email_change`
- `email_change_token_new`
- `recovery_token`

The Supabase Dashboard handles this automatically, but manual SQL inserts don't.

---

## Recommended: Use Option A

It's faster and doesn't require recreating the user. Just run the UPDATE query above and you're good to go!
