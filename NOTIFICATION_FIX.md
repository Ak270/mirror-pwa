# Notification & Widget Fixes

## Issues Fixed

### 1. Cron Notifications Not Working ✅

**Problem**: Test notifications worked, but cron notifications failed.

**Root Cause**: Different payload format between test and cron notifications.

**Solution**: Updated cron notification to use same simple format as test:
- Changed icon/badge from `.png` to `.svg`
- Simplified payload structure
- Removed duplicate `tag` property
- Removed `actions` array (not supported on all platforms)

**Changes Made**:
```javascript
// Before (complex payload)
{
  title: "...",
  body: "...",
  icon: '/icons/icon-192.png',  // Wrong format
  badge: '/icons/badge-72.png',
  data: { url: "..." },
  actions: [...],  // Not supported everywhere
  tag: "...",
  tag: "...",  // Duplicate!
  renotify: true
}

// After (simple, compatible payload)
{
  title: "...",
  body: "...",
  icon: '/icons/icon-192.svg',  // Correct format
  badge: '/icons/badge-72.svg',
  url: "...",
  tag: "...",
  data: { habit_id, habit_name }
}
```

### 2. Widget "Unauthorized" Error ⚠️

**Problem**: Widget showing "Invalid data: {"error":"Unauthorized"}"

**Cause**: API token in widget script is placeholder `YOUR_API_TOKEN_HERE`

**Solution**: Update the widget script with your actual API token

#### How to Fix Widget:

1. **Get your API token**:
   - Open Mirror app: https://mirror-pwa.vercel.app
   - Go to **Profile** → **Mobile Setup**
   - Copy the API token shown

2. **Update Scriptable widget**:
   - Open Scriptable app
   - Find "MirrorWidget" script
   - Edit line 6:
   ```javascript
   // Replace this:
   const API_TOKEN = "YOUR_API_TOKEN_HERE"
   
   // With your actual token:
   const API_TOKEN = "eyJhbGci..."
   ```

3. **Save and refresh**:
   - Save the script
   - Remove widget from home screen
   - Re-add it
   - Should now show your habits

## Deploy the Notification Fix

```bash
# Commit changes
git add .
git commit -m "Fix cron notifications to use same format as test"
git push

# Deploy to Vercel
vercel --prod
```

## Test After Deployment

### Test Cron Endpoint:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://mirror-pwa.vercel.app/api/notifications/send
```

Expected response:
```json
{
  "sent": 0,
  "message": "No habits with reminders due now"
}
```

### Test with Actual Reminder:

1. Set a habit reminder for 5 minutes from now
2. Don't log it today
3. Wait for notification
4. Should receive notification at -15, -10, -5, or 0 minutes

## Summary

✅ **Notification payload fixed** - Now uses same format as working test notifications
✅ **Build successful** - Ready to deploy
⚠️ **Widget needs API token** - Update script with your actual token from Profile page

After deploying, cron notifications should work exactly like test notifications!
