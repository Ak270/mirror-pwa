# Deployment Checklist - Fix Notifications & Widget

## Issues to Fix

### 1. ❌ Notifications Still Show "from Mirror"
**Cause**: AI-powered notification code is written but **not deployed to production**

**Current (old code on Vercel)**:
```
Title: Test
Body: from Mirror - Test in 5 minutes
```

**Expected (new code, not deployed yet)**:
```
Title: Test
Body: Hey! Get ready, starting in 5 minutes 🚀
```

### 2. ❌ Widget Shows "Unauthorized" After First Use
**Cause**: Supabase JWT tokens expire after 1 hour by default

**Current behavior**:
- First load: Works ✅
- After 1 hour: "Unauthorized" ❌

**Solution**: Use refresh tokens or extend token expiry

## Fix Steps

### Step 1: Deploy AI Notification Code

The AI-powered notification code is already written in your local files but needs to be deployed:

```bash
# Check current branch
git status

# Add all changes
git add .

# Commit
git commit -m "Add AI-powered dynamic notifications and fix timezone"

# Push to GitHub
git push origin main

# Deploy to Vercel
vercel --prod
```

**Verify deployment**:
```bash
# Test the endpoint
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://mirror-pwa.vercel.app/api/notifications/send
```

### Step 2: Fix Widget Token Expiry

The widget uses a JWT token that expires. We need to either:

**Option A: Extend token expiry (Quick fix)**
1. Go to Supabase Dashboard
2. Authentication → Settings
3. JWT Expiry: Change from 3600 (1 hour) to 2592000 (30 days)
4. Save

**Option B: Implement token refresh in widget (Better, but complex)**
- Requires OAuth flow in Scriptable
- Not recommended for iOS widget

**Recommended: Option A** - Extend JWT expiry to 30 days

### Step 3: Update Widget Script

After extending token expiry, get a fresh token:

1. Go to https://mirror-pwa.vercel.app/profile
2. Scroll to "Mobile Setup"
3. Copy the new API token
4. Update Scriptable widget line 6:
   ```javascript
   const API_TOKEN = "YOUR_NEW_TOKEN_HERE"
   ```

### Step 4: Test Everything

**Test Notifications**:
1. Set a habit reminder for 5 minutes from now
2. Wait for notification
3. Should see AI-generated message like:
   - "Almost time! Get ready 🚀"
   - "Let's go! Time to start 💪"

**Test Widget**:
1. Open Scriptable widget
2. Should show your habits
3. Wait 1 hour
4. Should still work (no "Unauthorized")

## Current Status

### ✅ Code Written (Local)
- AI-powered notifications
- IST timezone support
- Grace period for missed cron runs
- Widget Bearer token auth

### ❌ Not Deployed Yet
- Changes are only in local files
- Production still running old code
- Need to deploy to see changes

### ⚠️ Token Expiry Issue
- JWT tokens expire after 1 hour
- Need to extend in Supabase settings
- Or get fresh token every hour (not practical)

## Quick Commands

```bash
# Deploy everything
git add .
git commit -m "Deploy AI notifications and fixes"
git push
vercel --prod

# Test after deployment
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://mirror-pwa.vercel.app/api/notifications/send

# Should return AI-generated notifications
```

## Expected Results After Deployment

**Notifications**:
```
Title: Gym workout
Body: Hey buddy, get ready for the gym! 💪

Title: Reading
Body: Your 12-day streak is waiting! Grab your book 📚

Title: Meditation
Body: Time to find your center 🧘
```

**Widget**:
- Works on first load ✅
- Works after 1 hour ✅ (if token expiry extended)
- Shows habits correctly ✅

## Summary

1. **Deploy the code** - Changes are written but not live
2. **Extend JWT expiry** - Fix widget "Unauthorized" error
3. **Get fresh token** - Update widget with new token
4. **Test** - Verify notifications are AI-generated

The code is ready, just needs deployment! 🚀
