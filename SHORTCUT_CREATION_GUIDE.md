# Create Mirror Quick Log Shortcut - Step by Step

## 🎯 Goal
Create an iOS Shortcut that logs your next pending habit with one tap from the lock screen.

## 📱 Step-by-Step Instructions

### Part 1: Create the Shortcut

1. **Open Shortcuts app** on your iPhone or Mac

2. **Create new shortcut**
   - Tap the **+** button
   - Name it: **"Mirror Quick Log"**

3. **Add Action 1: Text Input**
   - Search for "Ask for Input"
   - Add it
   - Configure:
     - Prompt: `Enter your Mirror API token`
     - Input Type: Text
     - Default Answer: (leave empty)
   - Tap the variable name and rename to: `apiToken`

4. **Add Action 2: Get Next Habit**
   - Search for "Get Contents of URL"
   - Add it
   - Configure:
     - URL: `https://mirror-pwa.vercel.app/api/habits/next-pending`
     - Method: GET
     - Show More (expand advanced options)
     - Headers: Add New Field
       - Key: `Authorization`
       - Value: Type `Bearer ` (with space), then insert variable `apiToken`
   - Tap the result variable and rename to: `response`

5. **Add Action 3: Check if All Done**
   - Search for "Get Dictionary Value"
   - Add it
   - Configure:
     - Get: `all_done`
     - from: `response`
   - Rename result to: `allDone`

6. **Add Action 4: If All Done**
   - Search for "If"
   - Add it
   - Configure:
     - If `allDone` equals `true`

7. **Add Action 5: Show All Done Message**
   - Inside the If block, search for "Show Notification"
   - Add it
   - Configure:
     - Title: `🪞 All Done!`
     - Body: `All habits logged today ✓`

8. **Add Action 6: Stop if All Done**
   - Inside the If block, search for "Stop Shortcut"
   - Add it
   - Tap "End If" to close the If block

9. **Add Action 7: Get Habit Details**
   - Search for "Get Dictionary Value"
   - Add it (outside the If block)
   - Configure:
     - Get: `next_habit`
     - from: `response`
   - Rename result to: `habit`

10. **Add Action 8: Get Habit Name**
    - Search for "Get Dictionary Value"
    - Add it
    - Configure:
      - Get: `name`
      - from: `habit`
    - Rename result to: `habitName`

11. **Add Action 9: Get Habit Icon**
    - Search for "Get Dictionary Value"
    - Add it
    - Configure:
      - Get: `icon_emoji`
      - from: `habit`
    - Rename result to: `habitIcon`

12. **Add Action 10: Get Habit ID**
    - Search for "Get Dictionary Value"
    - Add it
    - Configure:
      - Get: `id`
      - from: `habit`
    - Rename result to: `habitId`

13. **Add Action 11: Show Logging Notification**
    - Search for "Show Notification"
    - Add it
    - Configure:
      - Title: Tap and insert `habitIcon`, then space, then insert `habitName`
      - Body: `Logging...`

14. **Add Action 12: Log the Habit**
    - Search for "Get Contents of URL"
    - Add it
    - Configure:
      - URL: `https://mirror-pwa.vercel.app/api/habits/checkin`
      - Method: POST
      - Show More (expand advanced options)
      - Headers: Add New Field
        - Key: `Authorization`
        - Value: Type `Bearer ` (with space), then insert variable `apiToken`
      - Request Body: JSON
      - Add two fields:
        - Key: `habit_id`, Value: insert `habitId`
        - Key: `status`, Value: type `done` (as text)

15. **Add Action 13: Show Success**
    - Search for "Show Notification"
    - Add it
    - Configure:
      - Title: `✓ Logged`
      - Body: Insert `habitName` then type ` marked as done`

16. **Save the shortcut**
    - Tap "Done"

### Part 2: Test the Shortcut

1. **Run the shortcut** from Shortcuts app
2. **Enter your API token** when prompted (get it from Mirror → Profile)
3. **Check if it works**:
   - Should show your next habit
   - Should log it
   - Should show confirmation

### Part 3: Share via iCloud

1. **Tap ••• on the shortcut**
2. **Tap Share icon** (square with arrow)
3. **Select "Copy iCloud Link"**
4. **Save this link** - you'll need it for the profile page

Example link: `https://www.icloud.com/shortcuts/abc123def456`

### Part 4: Update Profile Page

1. **Open** `src/app/(app)/profile/page.tsx`
2. **Find** the line with:
   ```tsx
   href="https://www.icloud.com/shortcuts/CREATE_YOUR_SHORTCUT_LINK"
   ```
3. **Replace** with your actual iCloud link:
   ```tsx
   href="https://www.icloud.com/shortcuts/abc123def456"
   ```
4. **Save and deploy**

### Part 5: Add to Lock Screen

1. **Go to your lock screen**
2. **Long-press** anywhere
3. **Tap "Customize"**
4. **Select** the lock screen to edit
5. **Tap** on the widget area (below the time)
6. **Tap "Add Widget"**
7. **Scroll to Shortcuts**
8. **Select "Mirror Quick Log"**
9. **Tap outside** to save
10. **Done** - you'll see the Mirror icon on your lock screen

## 🎨 Shortcut Flow Diagram

```
User taps lock screen icon
    ↓
Ask for API token (first time only)
    ↓
GET /api/habits/next-pending
    Headers: Authorization: Bearer XXX
    ↓
Check if all_done = true
    ↓
If yes → Show "All Done!" → Stop
    ↓
If no → Get habit details (name, icon, id)
    ↓
Show notification: "[icon] [name] - Logging..."
    ↓
POST /api/habits/checkin
    Headers: Authorization: Bearer XXX
    Body: { habit_id: XXX, status: "done" }
    ↓
Show notification: "✓ Logged - [name] marked as done"
    ↓
Done (total time: ~1-2 seconds)
```

## 🔧 Troubleshooting

**"Invalid token" error:**
- Make sure you copied the full API token from Profile page
- Token should start with `eyJ...`

**"No response" error:**
- Check your internet connection
- Verify the API URL is correct
- Check if Mirror app is deployed and running

**Shortcut doesn't appear on lock screen:**
- Make sure you're on iOS 16 or later
- Try removing and re-adding the widget
- Restart your phone

**"All Done" shows but I have pending habits:**
- Check if habits are archived
- Check if habits are in vault
- Verify habits are not already logged today

## 📊 What Gets Logged

The shortcut logs to Vercel with these prefixes:
- `[NEXT-PENDING]` - When fetching next habit
- Check Vercel logs to see usage

## 🎉 Success!

Once set up, you can:
- Tap the Mirror icon on your lock screen
- Instantly log your next pending habit
- Get confirmation notification
- Never unlock your phone
- Never open any app

**Total interaction: 1 tap, ~1 second**

This is the fastest way to log habits on any platform!
