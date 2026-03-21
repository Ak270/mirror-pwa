# Notification Cron Job Setup Guide

## Problem
Notifications only work when manually testing, not automatically. This is because the scheduled notification system requires a cron job to trigger the `/api/notifications/send` endpoint.

## Solution: Set Up Cron Job

### Step 1: Generate CRON_SECRET

First, generate a secure random secret:

```bash
# Generate a random secret (run this in terminal)
openssl rand -base64 32
```

Copy the output (e.g., `abc123xyz789...`)

### Step 2: Add Environment Variable to Vercel

1. Go to https://vercel.com/dashboard
2. Select your Mirror project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: (paste the secret you generated)
   - **Environments**: Production, Preview, Development
5. Click **Save**
6. **Redeploy** your app for changes to take effect

### Step 3: Set Up Cron Job on cron-job.org

1. **Go to**: https://console.cron-job.org/jobs
2. **Sign up/Login** (free account)
3. **Click**: "Create cronjob"

#### Cron Job Configuration:

**Title**: `Mirror Notifications`

**URL**: `https://mirror-pwa.vercel.app/api/notifications/send`

**Request Method**: `POST`

**Request Headers**: Add header
- **Name**: `Authorization`
- **Value**: `Bearer YOUR_CRON_SECRET_HERE`
  (Replace with the secret you generated in Step 1)

**Schedule**: 
- **Every**: `5 minutes`
- Or use cron expression: `*/5 * * * *`

**Timezone**: Select your timezone (e.g., `Asia/Kolkata` for IST)

**Active Hours**: 
- **From**: `07:00` (7 AM)
- **To**: `22:00` (10 PM)
- This ensures notifications only during waking hours

**Notifications**: 
- ✅ Enable "Notify on failure"
- Add your email to get alerts if the cron job fails

**Save Responses**: ✅ Enable (helps with debugging)

4. **Click**: "Create cronjob"

### Step 4: Test the Cron Job

#### Manual Test:
1. In cron-job.org dashboard, find your job
2. Click **"Run now"** button
3. Check the response:
   - **Success**: `{"sent": 0, "message": "..."}`
   - **Error**: Check response body for details

#### Check Logs:
1. Go to **Execution history** tab
2. View recent runs
3. Check for errors

### Step 5: Verify Notifications Are Working

1. **Set a reminder** in Mirror app:
   - Go to a habit
   - Set reminder time (e.g., 5 minutes from now)
   - Save

2. **Wait for notification**:
   - Cron job runs every 5 minutes
   - Notification sent at -15, -10, -5, 0 minutes before reminder
   - Check your device for notification

3. **Check cron job logs**:
   - Go to cron-job.org dashboard
   - View execution history
   - Should see successful runs with `{"sent": 1}` or similar

## How It Works

```
┌─────────────────┐
│  cron-job.org   │  Every 5 minutes
│  (Scheduler)    │  
└────────┬────────┘
         │ POST with Bearer token
         ▼
┌─────────────────────────────────┐
│  /api/notifications/send        │
│  - Checks habits with reminders │
│  - Finds unlogged habits        │
│  - Sends push notifications     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  User's Device  │  Receives notification
│  (iOS/Android)  │
└─────────────────┘
```

## Notification Logic

The endpoint sends notifications when:
- ✅ Habit has `reminder_time` set
- ✅ Current time is -15, -10, -5, or 0 minutes from reminder
- ✅ Habit not logged today
- ✅ Within quiet hours (7 AM - 10 PM)
- ✅ User has valid push subscription

## Troubleshooting

### Cron job returns 401 Unauthorized
- **Cause**: Wrong or missing CRON_SECRET
- **Fix**: 
  1. Check `Authorization` header in cron-job.org
  2. Verify `CRON_SECRET` in Vercel environment variables
  3. Make sure format is: `Bearer YOUR_SECRET` (with space)

### Cron job succeeds but no notifications
- **Cause**: No habits with reminders or already logged
- **Fix**:
  1. Set a reminder time on a habit
  2. Don't log it today
  3. Wait for the reminder time

### Notifications only work during test
- **Cause**: Cron job not set up or not running
- **Fix**: Follow this guide to set up cron-job.org

### Cron job fails with 500 error
- **Cause**: Database or API error
- **Fix**:
  1. Check Vercel logs
  2. Check cron-job.org response body
  3. Verify Supabase is accessible

## Alternative: Vercel Cron (Paid Plans Only)

If you have Vercel Pro plan, you can use Vercel Cron instead:

1. Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notifications/send",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. Add `CRON_SECRET` to environment variables
3. Deploy

**Note**: Vercel Cron requires Pro plan ($20/month)

## Monitoring

### Check if cron job is running:
1. Go to https://console.cron-job.org/jobs
2. View execution history
3. Should see runs every 5 minutes

### Check notification logs:
1. Go to Vercel dashboard
2. Select your project
3. Go to **Logs** tab
4. Filter by `/api/notifications/send`
5. Check for errors

### Test notification manually:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://mirror-pwa.vercel.app/api/notifications/send
```

## Expected Response

**Success (no reminders due)**:
```json
{
  "sent": 0,
  "message": "No habits with reminders"
}
```

**Success (notifications sent)**:
```json
{
  "sent": 2,
  "errors": []
}
```

**Error (wrong secret)**:
```json
{
  "error": "Unauthorized"
}
```

## Summary

1. ✅ Generate `CRON_SECRET`
2. ✅ Add to Vercel environment variables
3. ✅ Redeploy app
4. ✅ Create cron job on cron-job.org
5. ✅ Set schedule: Every 5 minutes
6. ✅ Add Authorization header with Bearer token
7. ✅ Test and verify

After setup, notifications will be sent automatically based on habit reminder times!
