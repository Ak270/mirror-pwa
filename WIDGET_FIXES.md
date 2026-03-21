# Widget Fixes - iOS & Android

## Issues Fixed

### 1. iOS Scriptable Widget - "No data received"

**Problem**: Widget API was using cookie-based authentication only, but Scriptable sends Bearer token.

**Solution**: Updated `/api/habits/widget` route to support both authentication methods:
- Bearer token authentication for external widgets (iOS Scriptable)
- Cookie-based authentication for web requests

**Changes**:
- Added Bearer token detection in API route
- Created Supabase client with token in Authorization header
- Fixed field name from `icon` to `icon_emoji` to match database schema

### 2. Android PWA Widget - Not Visible

**Problem**: Android PWA widgets require:
- Chrome 120+ on Android
- Correct manifest.json configuration
- HTTPS deployment
- PWA must be installed

**Solution**: Updated manifest.json with proper widget configuration:
- Added `short_name` field
- Fixed `template` path to use absolute path
- Added full URL for `data` endpoint
- Added `auth: true` flag
- Added `multiple: false` to prevent duplicate widgets

**Important**: Android PWA widgets are **experimental** and only work on:
- Chrome 120+ on Android
- PWA must be installed to home screen
- App must be deployed on HTTPS (Vercel)

## Testing Instructions

### iOS Widget (Scriptable)

1. **Install Scriptable** from App Store (free)

2. **Download the widget script**:
   - Go to Mirror app → Profile → Mobile Setup
   - Download `MirrorWidget.js` or copy the script

3. **Configure the script**:
   ```javascript
   // Line 5: Replace with your API token
   const API_TOKEN = "eyJhbGci..."
   
   // Line 6: Replace with your deployed URL
   const API_URL = "https://mirror-pwa.vercel.app/api/habits/widget"
   ```

4. **Add to Scriptable**:
   - Open Scriptable
   - Tap `+` to create new script
   - Paste the entire script
   - Name it "MirrorWidget"
   - Tap ▶️ to test (should show preview)

5. **Add to Home Screen**:
   - Long-press on home screen
   - Tap `+` in top-left
   - Search for "Scriptable"
   - Choose Medium widget size
   - Add to home screen
   - Tap on widget → "Choose Script" → "MirrorWidget"

### Android Widget (PWA)

**Requirements**:
- Chrome 120 or higher on Android
- Mirror PWA installed to home screen
- HTTPS deployment (works on Vercel)

**Steps**:
1. Install Mirror as PWA:
   - Open https://mirror-pwa.vercel.app in Chrome
   - Tap menu → "Install app" or "Add to Home Screen"
   
2. Add widget:
   - Long-press on home screen
   - Tap "Widgets"
   - Scroll to find "Mirror" or "Mirror Habits"
   - Drag widget to home screen

**Note**: If widget doesn't appear in widget list:
- Check Chrome version (must be 120+)
- Ensure PWA is installed (not just bookmarked)
- Try reinstalling the PWA
- Android PWA widgets are experimental and may not work on all devices

## API Changes

### Widget API Endpoint: `/api/habits/widget`

**Authentication**: Now supports both methods
```javascript
// Method 1: Bearer Token (for iOS Scriptable)
headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}

// Method 2: Cookies (for web/PWA)
// Automatic with browser requests
```

**Response Format**:
```json
{
  "habits": [
    {
      "id": "uuid",
      "name": "Morning Walk",
      "icon": "🏃",
      "category_id": "rhythm",
      "display_type": "binary",
      "today_status": "done",
      "today_value": null,
      "today_unit": null,
      "current_streak": 7
    }
  ],
  "date": "2024-03-21",
  "user_id": "uuid"
}
```

## Known Limitations

### iOS Scriptable Widget
- ✅ Works on all iOS versions with Scriptable app
- ✅ Fully customizable
- ⚠️ Requires manual setup and API token
- ⚠️ Updates every 15 minutes (Scriptable limitation)

### Android PWA Widget
- ⚠️ Requires Chrome 120+ (released Dec 2023)
- ⚠️ Experimental feature, may not work on all devices
- ⚠️ Limited customization
- ⚠️ Requires HTTPS deployment
- ⚠️ Must be installed as PWA (not just opened in browser)

## Troubleshooting

### iOS Widget shows "No data received"

1. **Check API token**:
   - Go to Mirror → Profile → Mobile Setup
   - Copy the API token shown
   - Make sure it's pasted correctly in the script (line 5)

2. **Check API URL**:
   - Use your deployed URL: `https://mirror-pwa.vercel.app/api/habits/widget`
   - Don't use `localhost` - won't work from widget

3. **Test the API**:
   - Open the script in Scriptable
   - Tap ▶️ to run
   - Check console for errors

### Android Widget not appearing

1. **Check Chrome version**:
   - Open Chrome → Menu → Settings → About Chrome
   - Must be version 120 or higher

2. **Reinstall PWA**:
   - Uninstall Mirror PWA from home screen
   - Open in Chrome browser
   - Install again via "Install app"

3. **Check deployment**:
   - Widget only works with HTTPS URLs
   - Localhost won't work for Android widgets

4. **Alternative**:
   - Use the iOS Scriptable widget approach
   - Or use the web app directly

## Files Modified

- `src/app/api/habits/widget/route.ts` - Added Bearer token auth support
- `public/manifest.json` - Fixed Android widget configuration
- `public/MirrorWidget.js` - iOS Scriptable widget (already created)

## Next Steps

1. Deploy to Vercel (required for both widgets)
2. Test iOS widget with your API token
3. Test Android widget on Chrome 120+ device
4. Update profile page instructions if needed
