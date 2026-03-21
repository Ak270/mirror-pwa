# iOS Widget Update Instructions

## Your Widget Should Now Work!

The API is returning your habits correctly:
- ✅ "Drink water" 💧 (completed today, 1-day streak)
- ✅ "Wake up early" 🌙 (not done yet)

## How to Update Your Widget

### Option 1: Re-download the Script (Recommended)

1. **Download updated script**:
   - Go to https://mirror-pwa.vercel.app/profile
   - Scroll to "Mobile Setup"
   - Download the updated `MirrorWidget.js`

2. **Replace in Scriptable**:
   - Open Scriptable app
   - Find your "MirrorWidget" script
   - Tap to edit
   - Select all (long-press → Select All)
   - Paste the new script
   - Save

3. **Refresh widget**:
   - Long-press the widget on home screen
   - Tap "Edit Widget"
   - Tap outside to save
   - Widget should refresh and show your habits

### Option 2: Manual Update

If you don't want to re-download, just update these lines in your existing script:

**Line 33-39** - Replace with:
```javascript
const data = await req.loadJSON()

if (!data) {
  throw new Error("No response from server")
}

if (!data.habits || !Array.isArray(data.habits)) {
  throw new Error(`Invalid data: ${JSON.stringify(data).substring(0, 100)}`)
}

console.log(`Loaded ${data.habits.length} habits`)
```

**Line 146-149** - Add after `widget.url = ...`:
```javascript
// Set refresh interval (15 minutes)
widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000)
```

## Widget Auto-Refresh

The widget will now automatically refresh every 15 minutes to show your latest habit status.

## Troubleshooting

### Widget still shows "No habits yet"

1. **Force refresh the widget**:
   - Remove widget from home screen
   - Re-add it from Scriptable widgets
   - Select "MirrorWidget" script

2. **Run script in Scriptable app**:
   - Open Scriptable
   - Tap ▶️ on MirrorWidget
   - Check console for errors
   - Should show: "Loaded 2 habits"

3. **Verify API token**:
   - Make sure line 5 has your correct token
   - Token should start with: `eyJhbGci...`

### Widget shows error

Check the error message:
- **"No response from server"** - Check internet connection
- **"Invalid data"** - Check API URL is correct
- **"Unauthorized"** - Check API token is correct

## Expected Widget Display

Your widget should show:
```
🪞 Mirror                    Sat, Mar 21

💧 Drink water                      ✓
🌙 Wake up early                    ○

2/2 today                  Tap to open
```

- ✓ = Completed today
- ○ = Not done yet
- 🔥 = Streak indicator (if >0 days)

## Android Widget Status

❌ **Android PWA widgets are not working** due to:
- Experimental browser feature
- Limited device support
- Chrome 120+ requirement
- Inconsistent implementation

**Recommendation**: Use the iOS Scriptable widget (fully functional) or access the web app directly on Android.

See `ANDROID_WIDGET_LIMITATIONS.md` for details.

## Next Steps

1. Update your widget script (Option 1 or 2 above)
2. Force refresh the widget
3. Widget should now display your 2 habits
4. Widget auto-refreshes every 15 minutes

---

**Your widget is ready to use!** The API is working correctly and returning your habits.
