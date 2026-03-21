# Quick Cron Job Setup (5 Minutes)

## Why Notifications Aren't Working

Test notifications work because you manually trigger them. Automatic notifications need a **cron job** to check every 5 minutes and send reminders.

## Setup Steps

### 1. Generate Secret (30 seconds)

Run in terminal:
```bash
openssl rand -base64 32
```

Copy the output (e.g., `K7mP9xQ2vN8wR5tY1uI3oA6sD4fG7hJ0`)

### 2. Add to Vercel (1 minute)

1. Go to: https://vercel.com/dashboard
2. Select your Mirror project
3. **Settings** → **Environment Variables**
4. Click **Add New**:
   - Name: `CRON_SECRET`
   - Value: (paste your secret)
   - All environments
5. **Save**
6. **Redeploy** (click "Redeploy" button)

### 3. Create Cron Job (2 minutes)

1. Go to: https://console.cron-job.org/jobs
2. Sign up (free)
3. Click **"Create cronjob"**

**Configuration**:
```
Title: Mirror Notifications

URL: https://mirror-pwa.vercel.app/api/notifications/send

Method: POST

Headers:
  Authorization: Bearer YOUR_CRON_SECRET_HERE
  (Replace YOUR_CRON_SECRET_HERE with the secret from step 1)

Schedule: */5 * * * *
(Every 5 minutes)

Timezone: Asia/Kolkata (or your timezone)

Active hours: 07:00 - 22:00
```

4. **Save**

### 4. Test (1 minute)

1. In cron-job.org, click **"Run now"**
2. Check response:
   - ✅ Success: `{"sent": 0, "message": "..."}`
   - ❌ Error 401: Check your CRON_SECRET

### 5. Verify

1. Set a reminder on a habit (5 minutes from now)
2. Wait for notification
3. Should arrive at -15, -10, -5, or 0 minutes before reminder

## Done!

Notifications will now be sent automatically every 5 minutes based on your habit reminder times.

---

## Troubleshooting

**401 Unauthorized**
- Check `CRON_SECRET` matches in both Vercel and cron-job.org
- Format must be: `Bearer YOUR_SECRET` (with space after Bearer)

**No notifications received**
- Make sure habit has reminder time set
- Don't log the habit today
- Wait for the reminder time
- Check cron-job.org execution history

**Test notification works but auto doesn't**
- Cron job not set up yet (follow steps above)
- Cron job paused (check cron-job.org dashboard)

---

See `CRON_JOB_SETUP.md` for detailed guide.
