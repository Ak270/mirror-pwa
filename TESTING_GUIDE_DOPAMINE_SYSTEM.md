# Testing Guide: Dopamine & Living Progress System

**Test Data File:** `supabase/test_data_dopamine_system.sql`  
**Test User:** `test@mirror.app` / `testpassword123`  
**Timeline:** All notifications configured to trigger within 10 minutes for rapid testing

---

## 🚀 Quick Start

### 1. Run Migration & Test Data
```bash
# Apply the migration
supabase db push

# Load test data
psql $DATABASE_URL -f supabase/test_data_dopamine_system.sql
```

### 2. Login
- Email: `test@mirror.app`
- Password: `testpassword123`

---

## 📋 Test Scenarios (In Order)

### ✅ TEST 1: Living Progress Ring (5 minutes)

**What to test:**
1. Go to Dashboard
2. You should see **7 total habits** (2 already logged today)
3. **Current state:** 28% completion → Should show **"Starting"** label with purple color (#7C72FF)
4. Ring should have slow pulse animation

**Actions:**
1. Log 1 more habit → Should cross 30% threshold
   - Watch for threshold animation
   - New Groq message should appear below ring
   - Message should reference actual habit names

2. Log 2 more habits → Should cross 50% threshold
   - Label changes to **"Halfway"**
   - Color shifts to #9E82FF
   - New specific message generated

3. Log remaining 2 habits → 100% completion
   - **Color flood animation** (green #10B981)
   - **Particle burst** effect
   - Message: "You showed up today" (witnessing language)

**What to verify:**
- [ ] Ring color changes at each threshold
- [ ] Pulse animation speed varies by state
- [ ] Groq messages are specific (mention habit names, not just counts)
- [ ] 100% triggers celebration animation
- [ ] No exclamation marks in any messages

**Expected timeline:** Immediate visual feedback, Groq calls ~2-3 seconds each

---

### ✅ TEST 2: Re-entry Banner (2 minutes)

**What to test:**
The "Reading" habit has a 4-day gap (last check-in was 5 days ago).

**Actions:**
1. Refresh dashboard
2. **Re-entry banner should appear** at top:
   - "You're back. 4 days — and you came back anyway."
   - "That's the only thing that matters right now."
   - "Pick one habit. Just one."

**What to verify:**
- [ ] Banner appears on dashboard load
- [ ] X button dismisses banner
- [ ] Banner stores dismissal in localStorage
- [ ] After logging any habit, banner auto-dismisses
- [ ] Banner won't reappear for 7 days after dismissal

**Expected timeline:** Immediate on page load

---

### ✅ TEST 3: Grace Day Indicator & Usage (3 minutes)

**What to test:**
"Morning Workout" has 32-day streak and 1 banked grace day.

**Setup:**
1. Go to habit detail page for "Morning Workout"
2. Note the 32-day streak

**Actions:**
1. **Simulate missing yesterday:**
   - Manually delete yesterday's check-in from database, OR
   - Wait until tomorrow and don't log it

2. Return to dashboard
3. **Grace day pill should appear** on "Morning Workout" card:
   - Amber pill: "Grace day available"
   - Amber border on card

4. Click the pill
5. **Modal should appear:**
   - "Spend your earned grace day?"
   - "Your streak stays at Day 32"
   - Shows remaining grace days after use
   - Two buttons: "Let it go" / "Protect my streak"

6. Click "Protect my streak"

**What to verify:**
- [ ] Grace day pill appears when yesterday is missing
- [ ] Modal shows correct streak number
- [ ] "Protect my streak" creates check-in for yesterday
- [ ] `banked_grace_days` decrements from 1 to 0
- [ ] Streak preserved at 32 days
- [ ] Pill disappears after use

**Expected timeline:** Immediate UI response, API call ~1 second

---

### ✅ TEST 4: Forgiveness Mode (2 minutes)

**What to test:**
"Yoga" habit missed yesterday but is within forgiveness window (before midnight).

**Actions:**
1. Go to dashboard
2. Find "Yoga" habit card

**What to verify:**
- [ ] Card has **amber left border** (3px)
- [ ] Shows "Grace day" pill at top-right
- [ ] Streak text shows "Tonight is still today" in amber color
- [ ] If you log it today, streak continues from 7 days
- [ ] `shouldShowForgiveness()` function returns true

**Note:** Forgiveness window is from yesterday's `day_end_time` to today's `day_end_time` (default 22:00).

**Expected timeline:** Immediate visual indicator

---

### ✅ TEST 5: Leave Habit - Day 1 Letter Delivery (5 minutes)

**What to test:**
"Quit Smoking" is a leave habit with a Day 1 letter written.

**Setup:**
The habit has 5 days of successful check-ins and `day1_letter_delivered = false`.

**Actions:**
1. Go to Log page
2. Find "Quit Smoking"
3. Click "Had a moment" (slip button)
4. Add optional note: "Was at a party, everyone was smoking"
5. Submit

**What to verify:**
- [ ] **Full-screen dark overlay appears** immediately after slip
- [ ] Title: "You wrote this on Day 1." (italic, serif font)
- [ ] User's exact letter text displayed verbatim (no AI rewrite)
- [ ] Letter text matches: "Hey. I know today is hard. When I wrote this..."
- [ ] Button: "I read it"
- [ ] After clicking, overlay dismisses
- [ ] `day1_letter_delivered` set to `true` in database
- [ ] Letter will NEVER be delivered again for this habit

**Expected timeline:** Immediate overlay on slip submission

---

### ✅ TEST 6: Temperature Display for Leave Habits (1 minute)

**What to test:**
"Quit Smoking" should show temperature visualization instead of regular streak.

**Actions:**
1. Go to habit detail page for "Quit Smoking"
2. Look for temperature display

**What to verify:**
- [ ] Shows thermometer icon
- [ ] Color is **orange** (#F97316) for Day 5 (warm)
- [ ] Label shows "Day 5" and "Warm"
- [ ] As days increase, color cools: red→orange→yellow→lime→green→cyan→blue

**Color progression:**
- Days 1-3: Red (Hot)
- Days 4-7: Orange (Warm) ← **Current state**
- Days 8-21: Yellow (Cooling)
- Days 22-60: Lime (Cool)
- Days 61-90: Green (Cold)
- Days 91-180: Cyan (Frozen)
- Days 181+: Blue (Ice)

**Expected timeline:** Immediate display

---

### ✅ TEST 7: Variable Reward Distribution (10 minutes)

**What to test:**
Check-in responses should follow 50/30/20 distribution.

**Actions:**
1. Log **10 different check-ins** across various habits
2. Track which response type you get:
   - **Normal response** (warm, brief confirmation)
   - **Pattern surprise** (specific insight about a pattern)
   - **Silence** (no notification at all)

**What to verify:**
- [ ] Approximately 50% get normal responses
- [ ] Approximately 30% get pattern surprises (if patterns exist)
- [ ] Approximately 20% get no notification
- [ ] **IMPORTANT:** If you log an `honest_slip`, it should ALWAYS get a response (never silenced)

**Pattern surprises to look for:**
1. "Day of Week Breakthrough" - "You've held on every Monday for weeks. Monday used to be the hard day."
2. "Personal Best Approach" - "One more day and this becomes your longest [habit] streak ever."
3. "Quiet Consistency" - "[Habit] — 85% over 30 days. You built that quietly."

**Expected timeline:** Each check-in response within 2-3 seconds

---

### ✅ TEST 8: Identity Language Verification (3 minutes)

**What to test:**
All UI text should use identity language, not performance language.

**Actions:**
1. Go through Log page, Dashboard, Vault
2. Check button labels and messages

**What to verify:**
- [ ] Check-in button says "I showed up" (not "Done")
- [ ] Partial button says "Part of it" (not "Partial")
- [ ] Slip button says "Had a moment" (not "Slip" or "Failed")
- [ ] Pending habits show "Whenever you're ready" (not "Still pending")
- [ ] Log page shows "[N] more when you're ready" (not "[N] left to log")
- [ ] Slip note modal asks "What was going on?" (not "Why did you slip?")
- [ ] No forbidden words anywhere: failed, missed, broke, relapsed, struggling

**Expected timeline:** Immediate visual verification

---

### ✅ TEST 9: Compound Interest View (2 minutes)

**What to test:**
Habit detail pages should show long-term progress meaning.

**Actions:**
1. Go to "Morning Workout" detail page (32 days logged)
2. Scroll to "What you're building" section

**What to verify:**
- [ ] Shows total times logged: **32**
- [ ] Shows projection: "At this pace: [~365] workouts this year"
- [ ] Shows meaningful insight (Groq-generated)
- [ ] For leave habits, shows "[N] days free" and units not consumed
- [ ] Progress bar visualization for current streak

**Expected timeline:** Immediate display, Groq call ~2 seconds

---

### ✅ TEST 10: Habit Intent Classification (3 minutes)

**What to test:**
New habit creation flow should ask START vs LEAVE.

**Actions:**
1. Click "New Habit" button
2. **Intent selection should appear first:**
   - Two cards: "START ↗️" (green) and "LEAVE 🚪" (amber)

3. Select **LEAVE**
4. Form should show additional fields:
   - **Addiction level slider** (1-10)
   - **Origin anchor** textarea
   - **Day 1 letter** textarea

5. Fill out:
   - Name: "Coffee After 2pm"
   - Addiction level: 6
   - Origin anchor: "I couldn't sleep for weeks. I need my nights back."
   - Day 1 letter: "You know why you're doing this. Sleep matters more."

6. Submit

**What to verify:**
- [ ] Intent selection appears before other fields
- [ ] LEAVE selection shows addiction slider
- [ ] Slider shows contextual message based on level
- [ ] Origin anchor has helpful placeholder
- [ ] Day 1 letter has example text
- [ ] Habit saves with `intent='leave'`, `addiction_level=6`
- [ ] Letter and anchor stored in database

**Expected timeline:** Immediate form flow

---

## 🔧 Advanced Testing (Optional)

### TEST 11: Urge Surfing Notification (Requires cron setup)

**What to test:**
"Quit Smoking" has `vulnerability_hour = 14` (2pm). Urge surfing should trigger at 12:30pm.

**Setup required:**
```javascript
// Create a test cron job that runs every minute
// Check if current time is 90 min before vulnerability_hour
// Send notification if true
```

**What to verify:**
- [ ] Notification sent at 12:30pm (90 min before 2pm)
- [ ] Title: "Mirror"
- [ ] Body: Groq-generated urge surfing message
- [ ] Actions: ["I waited", "I didn't"]
- [ ] Clicking "I waited" logs as partial victory
- [ ] Not sent again within 48 hours

**Expected timeline:** Requires scheduled task setup

---

### TEST 12: Unexpected Weekly Message (Requires cron setup)

**What to test:**
Random weekly message based on detected patterns.

**Setup required:**
```javascript
// Call /api/ai/unexpected-weekly once
// Should detect "Longest Ever" pattern for Morning Workout (32 days = best streak)
```

**What to verify:**
- [ ] API returns a pattern-based message
- [ ] Message is specific (mentions habit name and actual numbers)
- [ ] Message is witnessing, not praising
- [ ] No exclamation marks
- [ ] Logged in `unexpected_messages_log` table
- [ ] Won't send same pattern again for 4 weeks

**Expected timeline:** API call ~3 seconds

---

## 📊 Database Verification Queries

### Check Grace Days
```sql
SELECT name, current_streak, banked_grace_days, grace_days_earned_total, last_grace_day_earned_at
FROM habits 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@mirror.app')
  AND name = 'Morning Workout';
```

### Check Day 1 Letter Status
```sql
SELECT name, intent, addiction_level, day1_letter_delivered, 
       LEFT(day1_letter, 50) as letter_preview
FROM habits 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@mirror.app')
  AND name = 'Quit Smoking';
```

### Check Vulnerability Hour
```sql
SELECT name, vulnerability_hour, 
       (SELECT COUNT(*) FROM check_ins 
        WHERE habit_id = h.id AND status = 'honest_slip') as total_slips
FROM habits h
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@mirror.app')
  AND name = 'Quit Smoking';
```

### Check Re-entry Detection
```sql
SELECT h.name, MAX(c.created_at) as last_checkin,
       EXTRACT(DAY FROM NOW() - MAX(c.created_at)) as days_since
FROM habits h
LEFT JOIN check_ins c ON c.habit_id = h.id
WHERE h.user_id = (SELECT id FROM auth.users WHERE email = 'test@mirror.app')
  AND h.name = 'Reading'
GROUP BY h.id, h.name;
```

---

## ✅ Success Criteria

### Critical (Must Pass)
- [ ] Living progress ring shows all 8 states correctly
- [ ] Re-entry banner appears after 3+ day absence
- [ ] Day 1 letter delivers on first slip (and only once)
- [ ] Grace day can be spent to preserve streak
- [ ] Forgiveness mode shows amber indicator
- [ ] No forbidden words in any UI text
- [ ] Variable reward distribution roughly matches 50/30/20

### Important (Should Pass)
- [ ] Temperature display shows correct color for leave habits
- [ ] Compound interest view calculates projections
- [ ] Intent classification flow works for new habits
- [ ] Pattern surprises detect at least 1 pattern type

### Nice to Have (May Require Additional Setup)
- [ ] Urge surfing notifications (needs cron)
- [ ] Unexpected weekly messages (needs cron)
- [ ] Origin anchor notifications (needs cron)

---

## 🐛 Common Issues & Fixes

### Issue: Re-entry banner doesn't appear
**Fix:** Check localStorage for `mirror_reentry_last_shown`. Clear it and refresh.

### Issue: Grace day pill doesn't show
**Fix:** Verify `banked_grace_days > 0` and yesterday's check-in is actually missing.

### Issue: Day 1 letter doesn't trigger
**Fix:** Check `day1_letter_delivered` is `false` and this is the FIRST slip.

### Issue: Groq messages not appearing
**Fix:** Check `GROQ_API_KEY` is set. Check rate limits in `groq_rate_limits` table.

### Issue: Living ring stuck at 0%
**Fix:** Verify habits exist and some are logged today. Check `total > 0` condition.

---

## 📞 Support

If tests fail, check:
1. Migration 005 applied successfully
2. Test data loaded without errors
3. Environment variables set (especially `GROQ_API_KEY`)
4. Browser console for errors
5. Network tab for failed API calls

**All tests should complete within 30-40 minutes total.**

---

**Happy Testing! 🎯**
