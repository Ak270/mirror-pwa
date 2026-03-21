# Android PWA Widget - Known Limitations

## Why Android Widgets Are Not Visible

Android PWA widgets are an **experimental feature** with strict requirements that often prevent them from working:

### Requirements (All Must Be Met)

1. **Chrome Version**: Must be Chrome 120 or higher (released December 2023)
2. **Android Version**: Android 12+ recommended
3. **PWA Installation**: App must be installed as PWA (not just opened in browser)
4. **HTTPS**: Must be served over HTTPS (localhost won't work)
5. **Manifest Configuration**: Correct widget definition in manifest.json
6. **Device Support**: Not all Android devices support PWA widgets

### Current Status

❌ **Android PWA widgets are NOT reliably working** because:
- Feature is experimental and not widely supported
- Many Android devices don't show PWA widgets even with Chrome 120+
- Widget picker may not list PWA widgets
- Chrome may silently fail to register widgets

### Recommended Alternative: Use iOS Scriptable Widget

The iOS Scriptable widget is **fully functional and reliable**:
- ✅ Works on all iOS versions with Scriptable app
- ✅ Fully customizable
- ✅ Auto-refreshes every 15 minutes
- ✅ Shows all your habits with status
- ✅ Easy to set up

## Android Widget Troubleshooting

If you still want to try Android widgets:

### Step 1: Verify Chrome Version
```
Chrome → Menu → Settings → About Chrome
Must be version 120 or higher
```

### Step 2: Install as PWA (Critical)
1. Open https://mirror-pwa.vercel.app in Chrome
2. Tap menu (⋮) → "Install app" or "Add to Home Screen"
3. **Important**: Must use "Install app", not just bookmark
4. Confirm installation
5. App icon should appear on home screen

### Step 3: Check Widget Availability
1. Long-press on home screen
2. Tap "Widgets"
3. Scroll through widget list
4. Look for "Mirror" or "Mirror Habits"

**If widget doesn't appear**:
- Uninstall and reinstall the PWA
- Restart Chrome
- Restart your device
- Check if other PWA widgets work (test with another PWA)

### Step 4: Verify Manifest
The widget should be defined in manifest.json:
```json
{
  "widgets": [
    {
      "name": "Mirror Habits",
      "short_name": "Habits",
      "description": "View and track your daily habits",
      "tag": "mirror-habits",
      "template": "/widget-template.json",
      "data": "https://mirror-pwa.vercel.app/api/habits/widget",
      "type": "application/json",
      "auth": true
    }
  ]
}
```

## Why This Is Difficult

Android PWA widgets are:
1. **Not standardized** - Each browser/device implements differently
2. **Poorly documented** - Limited official documentation
3. **Experimental** - May be removed or changed
4. **Inconsistent** - Works on some devices, not others
5. **Silent failures** - No error messages when it doesn't work

## Recommended Solution

**Use the iOS Scriptable widget instead**, which:
- Works reliably on iOS
- Has better customization
- Provides clear error messages
- Auto-refreshes automatically
- Is well-documented

**For Android users**:
- Use the web app directly (add to home screen)
- Enable push notifications for reminders
- Use the mobile-optimized web interface

## Technical Details

### Why PWA Widgets Fail

1. **Browser Support**: Only Chrome 120+ on Android supports PWA widgets
2. **OS Integration**: Requires Android 12+ for best support
3. **Installation Method**: Must be installed via "Install app", not "Add to Home Screen"
4. **Manifest Parsing**: Chrome may reject manifest if any field is invalid
5. **Service Worker**: Must have active service worker
6. **HTTPS Only**: Will not work on HTTP or localhost

### Current Implementation Status

Our implementation is correct according to spec:
- ✅ Manifest.json has valid widget definition
- ✅ Widget template JSON is valid
- ✅ Service worker handles widget events
- ✅ API endpoint returns correct data
- ✅ Authentication is configured

**The issue is browser/device support, not our code.**

## Conclusion

**Android PWA widgets are not recommended** due to:
- Unreliable device support
- Experimental status
- Silent failures
- Limited debugging tools

**Use iOS Scriptable widget** for reliable widget functionality.

For Android users, the web app provides the same functionality with better reliability.
