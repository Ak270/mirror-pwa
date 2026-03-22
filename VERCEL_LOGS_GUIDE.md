# How to Check Vercel Logs for AI Notifications

## 📊 Logging Added

I've added comprehensive logging to track AI notification generation:

### Log Prefixes
- `[CRON]` - Cron job execution flow
- `[GROQ]` - Groq AI API calls and responses
- `[NOTIFICATION]` - Notification generation process

### What Gets Logged

**1. Cron Job Start/End**
```
[CRON] ========== Notification cron job started ==========
[CRON] ✅ Authorization verified
[CRON] Current time: 14:30 IST
[CRON] ✅ Within notification window
[CRON] Found 3 habits with reminders
```

**2. AI Generation Process**
```
[NOTIFICATION] Generating AI message for habit: Gym workout, phase: final_reminder, streak: 5
[GROQ] Calling Groq API for habit: Gym workout
[GROQ] Response received in 342ms: Almost time! Get pumped, we start in 5 🔥
[GROQ] ✅ Using AI-generated message: "Almost time! Get pumped, we start in 5 🔥"
[NOTIFICATION] Final message for Gym workout: "Almost time! Get pumped, we start in 5 🔥" (AI: true)
```

**3. Fallback Messages**
```
[GROQ] ⚠️ AI message invalid (length: 150), using fallback
[NOTIFICATION] Final message for Test: "Test in 5 minutes" (AI: false)
```

**4. Errors**
```
[GROQ] ❌ AI notification generation failed for Reading:
[GROQ] Error details: { message: "API key invalid", stack: "..." }
```

**5. Summary**
```
[CRON] ========== Notification cron job completed ==========
[CRON] Summary: 2 notifications sent, 0 errors, duration: 1250ms
```

## 🔍 How to Check Logs on Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your **Mirror** project

2. **Open Logs Tab**
   - Click **Logs** in the top navigation
   - Or go directly to: https://vercel.com/[your-username]/mirror-pwa/logs

3. **Filter Logs**
   - **Time range**: Select "Last hour" or "Last 24 hours"
   - **Function**: Select `/api/notifications/send`
   - **Search**: Type `[GROQ]` to see only AI-related logs

4. **View Real-time Logs**
   - Click **"Live"** toggle to see logs as they come in
   - Useful when testing notifications

### Method 2: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# View logs in real-time
vercel logs --follow

# Filter for notification endpoint
vercel logs --follow | grep "notifications/send"

# Filter for Groq AI logs
vercel logs --follow | grep "\[GROQ\]"
```

### Method 3: Function Logs (Detailed)

1. Go to Vercel Dashboard → **Functions**
2. Find `/api/notifications/send`
3. Click on it to see:
   - Invocation count
   - Error rate
   - Duration
   - Individual invocation logs

## 📝 Example Log Output

### Successful AI Notification

```
[CRON] ========== Notification cron job started ==========
[CRON] ✅ Authorization verified
[CRON] Current time: 14:45 IST
[CRON] ✅ Within notification window
[CRON] Found 2 habits with reminders

[NOTIFICATION] Generating AI message for habit: Gym workout, phase: final_reminder, streak: 12
[GROQ] Calling Groq API for habit: Gym workout
[GROQ] Response received in 287ms: Almost time! Protect that 12-day streak 💪
[GROQ] ✅ Using AI-generated message: "Almost time! Protect that 12-day streak 💪"
[NOTIFICATION] Final message for Gym workout: "Almost time! Protect that 12-day streak 💪" (AI: true)

[NOTIFICATION] Generating AI message for habit: Reading, phase: time_now, streak: 3
[GROQ] Calling Groq API for habit: Reading
[GROQ] Response received in 312ms: Time to read! Let's go 📚
[GROQ] ✅ Using AI-generated message: "Time to read! Let's go 📚"
[NOTIFICATION] Final message for Reading: "Time to read! Let's go 📚" (AI: true)

[CRON] ========== Notification cron job completed ==========
[CRON] Summary: 2 notifications sent, 0 errors, duration: 1450ms
```

### Failed AI Generation (Fallback Used)

```
[NOTIFICATION] Generating AI message for habit: Test, phase: early_reminder, streak: 0
[GROQ] Calling Groq API for habit: Test
[GROQ] ❌ AI notification generation failed for Test: Error: API key invalid
[GROQ] Error details: { message: "API key invalid", stack: "..." }
[NOTIFICATION] Final message for Test: "Test in 15 minutes" (AI: false)
```

## 🎯 What to Look For

### ✅ AI Working Correctly
- `[GROQ] ✅ Using AI-generated message`
- `(AI: true)` in final message log
- Response time < 500ms
- No error messages

### ⚠️ AI Fallback (Not Working)
- `[GROQ] ❌ AI notification generation failed`
- `(AI: false)` in final message log
- Error details showing API key or network issues

### 🔍 Debugging Steps

**If you see `(AI: false)`:**

1. **Check GROQ_API_KEY**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify `GROQ_API_KEY` is set correctly
   - Should start with `gsk_`

2. **Check Error Message**
   - Look for `[GROQ] Error details:` in logs
   - Common errors:
     - "API key invalid" → Wrong key
     - "Rate limit exceeded" → Too many requests
     - "Network timeout" → Groq API down

3. **Check Response Time**
   - If > 1000ms, might be timing out
   - Groq should respond in 200-500ms

## 📊 Quick Log Searches

### See all AI-generated messages
```
Search: [GROQ] ✅ Using AI-generated message
```

### See all failures
```
Search: [GROQ] ❌
```

### See summary of each cron run
```
Search: [CRON] Summary
```

### See timing information
```
Search: Response received in
```

## 🚀 Testing AI Notifications

1. **Set a reminder** for 5 minutes from now
2. **Don't log** the habit today
3. **Watch logs** in Vercel Dashboard (Live mode)
4. **Look for**:
   - `[GROQ] Calling Groq API`
   - `[GROQ] Response received`
   - `[GROQ] ✅ Using AI-generated message`
5. **Check your phone** for notification

## 📱 Log Locations

### Vercel Dashboard
- **URL**: https://vercel.com/[username]/mirror-pwa/logs
- **Best for**: Quick checks, filtering, real-time monitoring

### Vercel CLI
- **Command**: `vercel logs --follow`
- **Best for**: Development, debugging, continuous monitoring

### Function Details
- **URL**: https://vercel.com/[username]/mirror-pwa/functions
- **Best for**: Performance metrics, error rates, invocation history

## 💡 Pro Tips

1. **Use Live Mode** when testing to see logs in real-time
2. **Filter by time** to narrow down to your test window
3. **Search for habit name** to track specific habit notifications
4. **Check duration** - AI calls should be < 500ms
5. **Look for `(AI: true)`** to confirm AI is working

## 🎉 Success Indicators

When AI notifications are working, you'll see:
```
✅ [GROQ] Response received in 287ms
✅ [GROQ] ✅ Using AI-generated message
✅ (AI: true)
✅ No error messages
✅ Duration < 500ms
```

When they're not working:
```
❌ [GROQ] ❌ AI notification generation failed
❌ (AI: false)
❌ Error details in logs
❌ Fallback message used
```

---

**After deployment, check logs to verify AI notifications are working!**
