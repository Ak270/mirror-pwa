# Database Migration Required

## Error: "Could not find the 'display_type' column"

This error occurs because the database migration hasn't been run yet.

## Fix: Run Database Migrations

You need to execute these SQL migrations in your Supabase SQL Editor:

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `mirror` (hvrchyoytzmоujgdrczi)
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Migration 003 (Add display_type column)

Copy and paste this SQL into the editor and click **Run**:

```sql
-- Migration 003: Add display_type column to habits table
-- This enables widget classification (binary, counter, streak)

-- Add display_type column with default value
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS display_type TEXT DEFAULT 'binary' CHECK (display_type IN ('binary', 'counter', 'streak'));

-- Auto-classify existing habits based on their properties
UPDATE habits
SET display_type = CASE
  -- If habit has goal_value, it's a counter
  WHEN goal_value IS NOT NULL THEN 'counter'
  -- If habit is in rhythm category, it's likely a streak tracker
  WHEN category_id = 'rhythm' THEN 'streak'
  -- Default to binary (done/not done)
  ELSE 'binary'
END
WHERE display_type IS NULL OR display_type = 'binary';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_habits_display_type ON habits(display_type);
```

### Step 3: Verify Migration

After running the migration, verify it worked:

```sql
-- Check if column exists and has data
SELECT id, name, display_type 
FROM habits 
LIMIT 5;
```

You should see the `display_type` column with values like 'binary', 'counter', or 'streak'.

### Step 4: Run Other Pending Migrations (Optional)

If you haven't run these yet, execute them in order:

#### Migration 002: Add slip_note column
```sql
-- Migration 002: Add slip_note to check_ins
ALTER TABLE check_ins 
ADD COLUMN IF NOT EXISTS slip_note TEXT;

CREATE INDEX IF NOT EXISTS idx_check_ins_slip_note ON check_ins(slip_note) 
WHERE slip_note IS NOT NULL;
```

#### Migration 004: Add notification metadata
```sql
-- Migration 004: Add source and last_verified_at to notification_subscriptions
ALTER TABLE notification_subscriptions 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'browser' CHECK (source IN ('browser', 'ios_pwa', 'android_pwa'));

ALTER TABLE notification_subscriptions 
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_source ON notification_subscriptions(source);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_verified ON notification_subscriptions(last_verified_at);
```

## After Running Migrations

1. **Refresh your app** - The error should be gone
2. **Try creating a habit again** - It should work now
3. **Test the widget API**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://mirror-pwa.vercel.app/api/habits/widget
   ```

## Quick Fix Summary

**Minimum required**: Run Migration 003 (display_type column)

**Recommended**: Run all 3 migrations (002, 003, 004) for full v0.2.0 functionality

---

## Why This Happened

The `display_type` column was added in Task 13 (Widget API & Habit Classification) but the database migration wasn't run yet. This is a one-time setup step required after deploying the new code.
