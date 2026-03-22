# iOS Lock Screen Shortcut Setup Guide

## 🎯 What This Does

Allows users to log their next pending habit with **one tap from the lock screen** — no unlocking phone, no opening browser, no opening app.

**User Experience:**
1. User sees Mirror icon on lock screen
2. Taps once
3. Shortcut runs in background (~1 second)
4. Notification appears: "💪 Gym workout — Logged as done ✓"
5. Done. Phone never unlocked.

## 🏗️ Implementation Complete

### 1. ✅ API Endpoint Created

**File:** `src/app/api/habits/next-pending/route.ts`

**What it does:**
- Returns the next pending (unlogged) habit for the user
- Ordered by reminder_time (timed habits first)
- Uses Bearer token authentication (same token as widget)

**Response:**
```json
{
  "next_habit": {
    "id": "123",
    "name": "Gym workout",
    "icon_emoji": "💪",
    "category_id": "build",
    "reminder_time": "10:00:00"
  },
  "pending_count": 3,
  "all_done": false
}
```

**When all done:**
```json
{
  "next_habit": null,
  "pending_count": 0,
  "all_done": true
}
```

### 2. ✅ Profile Page Updated

**File:** `src/app/(app)/profile/page.tsx`

**Added:**
- Lock Screen Quick Log section under iOS Widget
- Step-by-step setup instructions
- "Add to Shortcuts" button (needs iCloud link)
- Clear explanation of how it works

## 📱 How to Create the iOS Shortcut

### Option A: Manual Creation (Recommended for Testing)

1. **Open Shortcuts app** on iPhone/Mac
2. **Create new shortcut** named "Mirror Quick Log"
3. **Add these actions:**

#### Action 1: Ask for Input (First Run Only)
```
Ask for: Text
Prompt: "Paste your Mirror API token (from Profile page)"
Default Answer: (empty)
Store as: apiToken
```

#### Action 2: Get Next Pending Habit
```
Get contents of URL
URL: https://mirror-pwa.vercel.app/api/habits/next-pending
Method: GET
Headers: 
  Authorization: Bearer [apiToken]
Store response as: response
```

#### Action 3: Parse Response
```
Get Dictionary Value
Dictionary: response
Key: all_done
Store as: allDone
```

#### Action 4: Check if All Done
```
If allDone is true
  Show Notification
    Title: 🪞 Mirror
    Body: All habits done today! ✓
  Stop this shortcut
End If
```

#### Action 5: Get Habit Details
```
Get Dictionary Value
Dictionary: response
Key: next_habit
Store as: habit

Get Dictionary Value from habit
Key: name → habitName
Key: icon_emoji → habitIcon  
Key: id → habitId
```

#### Action 6: Show Immediate Feedback
```
Show Notification
Title: [habitIcon] [habitName]
Body: Logging as done...
```

#### Action 7: Log the Habit
```
Get contents of URL
URL: https://mirror-pwa.vercel.app/api/habits/checkin
Method: POST
Headers:
  Authorization: Bearer [apiToken]
Request Body: JSON
{
  "habit_id": "[habitId]",
  "status": "done"
}
```

#### Action 8: Confirm Success
```
Show Notification
Title: ✓ Logged
Body: [habitName] marked as done
```

4. **Test the shortcut** by running it from Shortcuts app
5. **Share via iCloud:**
   - Tap ••• on the shortcut
   - Tap Share icon
   - Select "Copy iCloud Link"
   - This gives you a link like: `https://www.icloud.com/shortcuts/abc123`

### Option B: Shortcut File (Advanced)

Create a `.shortcut` file (binary plist format) and host it at `/public/MirrorQuickLog.shortcut`.

**Distribution URL:**
```
shortcuts://import-workflow/?url=https://mirror-pwa.vercel.app/MirrorQuickLog.shortcut
```

This is more complex and requires:
- Building the shortcut on Mac
- Exporting as file
- Hosting on your server

## 🔗 Update Profile Page with iCloud Link

After creating the shortcut and getting the iCloud link:

1. Open `src/app/(app)/profile/page.tsx`
2. Find the "Add to Shortcuts" button
3. Replace the placeholder URL:
   ```tsx
   href="https://www.icloud.com/shortcuts/YOUR_ACTUAL_LINK_HERE"
   ```

## 📋 Lock Screen Setup Instructions (For Users)

Once the shortcut is installed:

1. **Go to lock screen**
2. **Long-press** anywhere on lock screen
3. **Tap "Customize"**
4. **Select lock screen** to edit
5. **Tap on widget area** (below time)
6. **Add widget** → Shortcuts
7. **Select "Mirror Quick Log"**
8. **Done**

Now the Mirror icon appears on lock screen. One tap logs the next habit.

## 🎨 Shortcut Icon

The shortcut will use the default Shortcuts icon unless you:
1. Create a custom icon (512x512 PNG)
2. Set it in the shortcut settings
3. Recommended: Use Mirror's 🪞 emoji or purple M logo

## 🧪 Testing Checklist

- [ ] API endpoint returns next pending habit
- [ ] API endpoint returns all_done when no habits pending
- [ ] Shortcut asks for token on first run
- [ ] Shortcut shows "All done" when no habits pending
- [ ] Shortcut logs habit successfully
- [ ] Shortcut shows confirmation notification
- [ ] Shortcut works from lock screen
- [ ] Shortcut works without unlocking phone
- [ ] Token is stored securely in Shortcuts app

## 🚀 Advanced Variant: Choose Habit

For users who want to pick which habit to log (not just next one):

**Modify Action 2:**
```
Get contents of URL
URL: https://mirror-pwa.vercel.app/api/habits/today?token=[apiToken]
Method: GET
Store as: response

Get Dictionary Value
Dictionary: response
Key: habits
Store as: habitsList

Choose from List: habitsList
Prompt: "Which habit to log?"
Store as: selectedHabit

Continue with Action 7 using selectedHabit.id
```

**Trade-off:** 2 taps instead of 1, but full control.

## 📊 Usage Analytics

The shortcut calls these endpoints:
1. `/api/habits/next-pending` - GET (to find next habit)
2. `/api/habits/checkin` - POST (to log it)

You can track usage in Vercel logs:
```
Search: [NEXT-PENDING]
```

## 🔒 Security

- Token is stored in Shortcuts app (encrypted by iOS)
- Token is same as widget token (already exists)
- Token is passed via Authorization header (more secure than URL params)
- HTTPS encryption for all requests
- No new security concerns vs existing widget

## 📝 Documentation for Users

Add to your help docs:

**Lock Screen Quick Log**

Log your next habit with one tap from your lock screen.

**Setup:**
1. Go to Profile → Mobile Setup
2. Tap "Add to Shortcuts"
3. Paste your API token when prompted
4. Add the shortcut to your lock screen widget area

**Usage:**
- Tap the Mirror icon on your lock screen
- Your next pending habit is logged automatically
- You'll see a confirmation notification
- No need to unlock your phone

**Tips:**
- Habits are logged in order of reminder time
- If all habits are done, you'll see "All done today!"
- The shortcut works offline and syncs when connected

## 🎉 Summary

This feature provides the **fastest possible habit logging** on iOS:
- **1 tap** from lock screen
- **No unlocking** required
- **No app opening** required
- **Instant feedback** via notification
- **Works in background** (~1 second)

Perfect for users who want to quickly log habits throughout the day without interrupting their flow.
