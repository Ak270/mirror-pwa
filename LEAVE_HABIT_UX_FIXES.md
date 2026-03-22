# Leave Habit UX Fixes - Implementation Summary

**Date:** March 22, 2026  
**Issues Identified:** Modal button overlap, incorrect progress logic for leave habits, missing quantity input, need for device-based day boundaries

---

## 🐛 Issues Fixed

### **1. Modal Button Hidden Behind Navigation** ✅
**Problem:** Submit button in slip note modal was covered by bottom navigation bar.

**Fix:** Added `pb-24` (bottom padding) to modal container in `CheckInButton.tsx`

```tsx
// Before
<div className="bg-white rounded-t-card shadow-hover max-w-lg w-full p-6 animate-slide-up">

// After  
<div className="bg-white rounded-t-card shadow-hover max-w-lg w-full p-6 pb-24 animate-slide-up">
```

**File:** `src/components/habits/CheckInButton.tsx:119`

---

### **2. Leave Habit Specific Check-In UI** ✅
**Problem:** "Quit Smoking" used same UI as build habits - no quantity input, wrong language.

**Solution:** Created dedicated `LeaveHabitCheckIn` component with:
- **Two buttons:** "I held on today" vs "I had a moment"
- **Quantity input:** "How many?" (e.g., 3 cigarettes)
- **Context note:** "What was going on?"
- **Identity language:** Not "failed" or "slipped"

**File Created:** `src/components/habits/LeaveHabitCheckIn.tsx`

**Features:**
- Quantity field with number input
- Optional note field
- "Skip details" option
- Warm confirmation messages
- Bottom padding to prevent nav overlap

---

### **3. Time-Based Progress Ring for Leave Habits** ✅
**Problem:** 100% completion ring doesn't make sense for leave habits. If user doesn't respond, it shows 100% but that doesn't mean they smoked.

**Solution:** Created `TimeBasedProgressRing` that shows **time progress through the day**, not completion.

**File Created:** `src/components/dashboard/TimeBasedProgressRing.tsx`

**How it works:**
```
User's day: 5am - 10pm (17 hours)
Current time: 1pm (8 hours elapsed)
Progress: 47% (8/17 hours)
```

**States:**
| Time Progress | Color | Label | Message |
|--------------|-------|-------|---------|
| 0-25% | Purple | "Day just started" | "Everything is still possible" |
| 25-50% | Light purple | "Morning strength" | "Xh to go" |
| 50-75% | Lighter purple | "Afternoon focus" | "Xh remaining" |
| 75-100% | Lightest purple | "Final stretch" | "Xh until reset" |

**Special states:**
- **If "held on" logged:** Green ring, "Holding strong"
- **If "had moment" logged:** Orange ring, "One moment doesn't define the whole day"

**Key difference:**
- Build habits: Ring fills as you complete habits (action-based)
- Leave habits: Ring fills as time passes (time-based)

**Why this matters:**
- At 1pm, if user smoked, they can still log it and see "Day continues"
- At 10pm, if no log, ring shows 100% but that means "day is ending" not "you succeeded"
- User MUST actively log "I held on" to mark success

---

### **4. Device-Based Day Boundary Detection** ✅
**Problem:** Manual day start/end times don't reflect actual user behavior.

**Solution:** Created `DeviceDayBoundaryDetector` that learns from device usage patterns.

**File Created:** `src/lib/deviceDayBoundaries.ts`

**How it works:**
1. **Tracks device activity:**
   - First screen unlock of the day → Wake time
   - Last activity before 4+ hour gap → Sleep time
   - App opens, visibility changes

2. **Analyzes 7-day rolling average:**
   - Calculates median wake time
   - Calculates median sleep time
   - Determines confidence (high/medium/low)

3. **Adapts automatically:**
   - User wakes at 5am most days → Day starts at 5am
   - User sleeps at 11pm most days → Day ends at 11pm
   - Falls back to 6am-10pm if insufficient data

**Confidence levels:**
- **High:** < 30 min standard deviation (consistent schedule)
- **Medium:** < 1 hour standard deviation
- **Low:** > 1 hour standard deviation (use defaults)

**Usage:**
```typescript
import { getDeviceDayBoundaryDetector } from '@/lib/deviceDayBoundaries'

const detector = getDeviceDayBoundaryDetector()
const { dayStart, dayEnd, confidence } = detector.getCurrentDayBoundaries()

// dayStart: Date (e.g., today at 5:23am)
// dayEnd: Date (e.g., today at 10:47pm)
// confidence: 'high' | 'medium' | 'low'
```

**Auto-tracking hook:**
```typescript
// In root layout
import { useDeviceActivityTracking } from '@/lib/deviceDayBoundaries'

export default function RootLayout() {
  useDeviceActivityTracking() // Automatically logs app opens and screen locks
  // ...
}
```

---

## 🎯 Leave Habit User Flow (NEW)

### **Morning (5am - Day Start)**
1. User wakes up, opens app
2. Device detector logs "screen_unlock"
3. Dashboard shows time-based ring at 0%
4. Message: "Day just started. Everything is still possible."

### **Afternoon (1pm - Had a moment)**
1. User smoked a cigarette
2. Opens app, taps "I had a moment"
3. Modal appears:
   - "How many?" → User enters "1"
   - "What was going on?" → "Was stressed at work"
4. Submits
5. Ring turns orange: "One moment doesn't define the whole day"
6. Time progress continues (now at 47%)

### **Evening (9pm - Holding strong)**
1. User opens app
2. Taps "I held on today"
3. Ring turns green: "Holding strong"
4. Shows: "1h left in your day"
5. Streak continues

### **Night (10pm - Day Reset)**
1. Day ends at 10pm (user's detected sleep time)
2. If no log: Day resets, no assumption made
3. If "held on" logged: Streak increments
4. If "had moment" logged: Streak resets, but temperature cools

---

## 🔔 Proactive Notifications for Leave Habits

**Not yet implemented - Next steps:**

### **1. Vulnerability Window Notifications**
Based on historical slip patterns:
```
User slipped at 2pm on 5 different days
→ Send notification at 12:30pm: "The urge peaks in 90 seconds. Can you wait?"
```

### **2. Morning Motivation**
At day start (detected wake time):
```
"Day 6. You're building something."
```

### **3. Evening Check-in Reminder**
2 hours before day end if no log:
```
"How was today? Just checking in."
```

### **4. Replacement Behavior Suggestions**
When user logs "had moment":
```
"Last time you went for a walk instead. Want to try that?"
```

---

## 📊 Data Schema Updates Needed

### **Add to `check_ins` table:**
```sql
ALTER TABLE check_ins ADD COLUMN quantity INTEGER;
ALTER TABLE check_ins ADD COLUMN quantity_unit TEXT;
```

### **Update `habits` table:**
Already has from migration 005:
- `intent` ('start' | 'leave')
- `addiction_level` (1-10)
- `vulnerability_hour` (0-23)
- `replacement_behaviors` (JSONB)

---

## 🔧 Integration Steps

### **Step 1: Update Log Page**
Detect leave habits and use `LeaveHabitCheckIn` instead of `CheckInButton`:

```tsx
// In log page
import LeaveHabitCheckIn from '@/components/habits/LeaveHabitCheckIn'

{habit.intent === 'leave' ? (
  <LeaveHabitCheckIn
    habitId={habit.id}
    habitName={habit.name}
    habitIcon={habit.icon_emoji}
    addictionLevel={habit.addiction_level || 5}
    onStatusChange={handleLeaveHabitChange}
    currentStatus={todayStatus}
  />
) : (
  <CheckInButton
    habitId={habit.id}
    habitName={habit.name}
    categoryId={habit.category_id}
    currentStatus={todayStatus}
    onStatusChange={handleStatusChange}
  />
)}
```

### **Step 2: Update Dashboard**
Use `TimeBasedProgressRing` for leave habits:

```tsx
// In dashboard
import TimeBasedProgressRing from '@/components/dashboard/TimeBasedProgressRing'

{leaveHabits.length > 0 && (
  <div className="mb-6">
    <h2 className="text-sm font-semibold text-brand mb-3">Breaking Free</h2>
    {leaveHabits.map(habit => (
      <TimeBasedProgressRing
        key={habit.id}
        habitName={habit.name}
        habitIcon={habit.icon_emoji}
        dayStartTime={userDayStart}
        dayEndTime={userDayEnd}
        lastCheckInStatus={habit.todayStatus}
      />
    ))}
  </div>
)}
```

### **Step 3: Enable Device Tracking**
In root layout:

```tsx
// src/app/layout.tsx
import { useDeviceActivityTracking } from '@/lib/deviceDayBoundaries'

export default function RootLayout({ children }) {
  useDeviceActivityTracking()
  
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### **Step 4: Update Check-in Handler**
Handle leave habit specific data:

```typescript
async function handleLeaveHabitChange(
  status: 'held_on' | 'had_moment',
  quantity?: number,
  note?: string
) {
  const checkInData = {
    habit_id: habitId,
    date: today,
    status: status === 'held_on' ? 'done' : 'honest_slip',
    quantity: quantity,
    quantity_unit: 'cigarettes', // or from habit config
    note: note
  }
  
  await supabase.from('check_ins').insert(checkInData)
  
  // If had_moment, update replacement_behaviors if user did something instead
  // If held_on, increment streak
}
```

---

## ✅ Testing Checklist

### **Modal Fix**
- [ ] Open slip note modal on mobile
- [ ] Verify buttons are fully visible above navigation bar
- [ ] Test on different screen sizes

### **Leave Habit Check-In**
- [ ] Create "Quit Smoking" habit with intent='leave'
- [ ] Go to log page
- [ ] Verify "I held on today" and "I had a moment" buttons appear
- [ ] Tap "I had a moment"
- [ ] Enter quantity (e.g., 2)
- [ ] Enter note
- [ ] Submit
- [ ] Verify check-in created with quantity and note

### **Time-Based Progress Ring**
- [ ] Dashboard shows time ring for leave habits
- [ ] Ring progress matches time of day (not completion %)
- [ ] At 5am (day start): Ring at 0%, "Day just started"
- [ ] At 1pm (midday): Ring at ~47%, "Morning strength"
- [ ] After logging "held on": Ring turns green
- [ ] After logging "had moment": Ring turns orange
- [ ] Message updates correctly

### **Device Day Boundaries**
- [ ] Open app in morning → Activity logged
- [ ] Check localStorage for 'mirror_device_activity'
- [ ] After 3+ days of usage, check detected boundaries
- [ ] Verify confidence level increases with consistent schedule
- [ ] Test fallback to 6am-10pm with no data

---

## 🚀 Next Steps (Priority Order)

1. **Add quantity columns to database** (5 min)
2. **Integrate LeaveHabitCheckIn in log page** (15 min)
3. **Integrate TimeBasedProgressRing in dashboard** (15 min)
4. **Enable device activity tracking in root layout** (5 min)
5. **Test with "Quit Smoking" test data** (20 min)
6. **Implement proactive notifications** (2-3 hours)
7. **Add replacement behavior tracking** (1 hour)

---

## 📝 Key Insights

### **Why time-based progress matters:**
- **Build habits:** Success = taking action → Action-based ring makes sense
- **Leave habits:** Success = NOT taking action → Time-based ring makes sense

### **Why quantity matters:**
- "I smoked 1 cigarette" vs "I smoked a whole pack" are very different
- Reduction is progress even if streak breaks
- Pattern detection: "You used to smoke 10/day, now it's 2/day"

### **Why device boundaries matter:**
- Night shift worker: Day is 8pm-12pm, not 6am-10pm
- College student: Day is 10am-2am, not 6am-10pm
- Automatic detection removes friction and increases accuracy

---

**All files created and ready for integration!** 🎯
