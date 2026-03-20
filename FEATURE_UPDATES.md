# Mirror PWA - Feature Updates

## ✅ Completed Features

### 1. Icon Tooltips on Hover
- **Status**: ✅ Complete
- **Files Modified**:
  - `src/components/habits/HabitForm.tsx`
  - `src/app/onboarding/page.tsx`
- **Changes**: 
  - Converted emoji arrays to objects with `{ emoji, label }` structure
  - Added `title` attribute to all emoji buttons
  - Labels: Exercise, Reading, Meditation, Hydration, Sleep, Nutrition, Strength, Writing, Goals, Creativity, Music, Growth, Freedom, Medicine, Rest, Walking, Cleaning, Plants

### 2. Habit Name Autocomplete
- **Status**: ✅ Complete
- **File Modified**: `src/components/habits/HabitForm.tsx`
- **Changes**:
  - Added dropdown suggestions when typing habit name
  - Suggestions include: Morning walk, Evening walk, Cycling, Running, Gym workout, Yoga, Meditation, Reading, Studying, Writing, Drink water, Healthy eating, No sugar, No caffeine, Sleep early, Wake up early, Journaling, Gratitude practice
  - Filters suggestions based on user input
  - Click to select from dropdown

### 3. iOS & Android Setup Instructions
- **Status**: ✅ Complete
- **File Modified**: `src/app/(app)/profile/page.tsx`
- **Changes**:
  - Added comprehensive mobile setup section
  - **iOS Instructions**: Safari → Share → Add to Home Screen
  - **Android Instructions**: Chrome → Menu → Add to Home screen
  - Included API token section for advanced users (iOS Shortcuts, Tasker)
  - Clear step-by-step instructions for both platforms

### 4. Database Schema for Quantifiable Check-ins
- **Status**: ✅ Complete
- **Files Modified**:
  - `supabase/migrations/001_init.sql`
  - `src/types/index.ts`
- **Changes**:
  - Added `quantifiable_value NUMERIC` column to `check_ins` table
  - Added `quantifiable_unit TEXT` column to `check_ins` table
  - Updated TypeScript `CheckIn` interface with new fields
  - Supports tracking measurable progress (e.g., "5km", "1 hour", "10 pages")

---

## 🚧 Remaining Features to Implement

### 5. Quantifiable Check-in Input UI
- **Status**: ⏳ Pending
- **Files to Modify**:
  - `src/components/habits/CheckInButton.tsx`
  - `src/lib/habits.ts` (update `logCheckIn` function)
- **Requirements**:
  - Add optional input field when marking habit as "done"
  - Support different unit types: distance (km, miles), time (minutes, hours), count (pages, reps)
  - Save `quantifiable_value` and `quantifiable_unit` to database
  - Example: "Morning walk done → 5km today"

### 6. Quantifiable Data Visualization
- **Status**: ⏳ Pending
- **Files to Create/Modify**:
  - `src/components/graphs/QuantifiableChart.tsx` (new component)
  - `src/app/(app)/habits/[id]/page.tsx` (add chart to habit detail)
- **Requirements**:
  - Bar chart showing quantifiable progress over time
  - Time range filters: Last 7 days, Last 30 days, Last 90 days, All time
  - Display total, average, and trend
  - Example: "Total walk this week: 25km, Average: 5km/day"
  - Use Recharts library (already installed)

### 7. 15-Minute Reminder Notifications
- **Status**: ⏳ Pending
- **Files to Modify**:
  - `src/app/api/notifications/send/route.ts`
  - `src/lib/notifications.ts`
- **Requirements**:
  - Check habits with `reminder_time` set
  - Send notification 15 minutes before scheduled time
  - Notification copy: "Mirror reminder: [Habit name] in 15 minutes"
  - Only send if habit not yet logged today
  - Respect quiet hours (7am-10pm)

---

## 📋 Implementation Priority

1. **High Priority**: Quantifiable check-in input UI (enables core feature)
2. **Medium Priority**: Quantifiable data visualization (shows value of tracking)
3. **Low Priority**: 15-minute reminder notifications (nice-to-have enhancement)

---

## 🔧 Next Steps

### To enable quantifiable check-ins:

1. **Update `logCheckIn` function** in `src/lib/habits.ts`:
   ```typescript
   export async function logCheckIn(
     supabase: SupabaseClient,
     userId: string,
     habitId: string,
     status: CheckInStatus,
     quantifiableValue?: number,
     quantifiableUnit?: string
   )
   ```

2. **Modify `CheckInButton` component** to show optional input after selecting "done":
   - Add state for `quantifiableValue` and `quantifiableUnit`
   - Show input field conditionally
   - Pass values to `onStatusChange` callback

3. **Create `QuantifiableChart` component**:
   - Use Recharts `BarChart` or `AreaChart`
   - Fetch check-ins with `quantifiable_value IS NOT NULL`
   - Calculate totals and averages
   - Display trend line

4. **Update notification cron**:
   - Query habits with `reminder_time` set
   - Calculate 15-minute window
   - Send targeted notifications

---

## 🗄️ Database Migration Required

**IMPORTANT**: Run the updated SQL migration in Supabase SQL Editor:
```sql
-- Add quantifiable fields to existing check_ins table
ALTER TABLE check_ins 
ADD COLUMN IF NOT EXISTS quantifiable_value NUMERIC,
ADD COLUMN IF NOT EXISTS quantifiable_unit TEXT;
```

Or run the full migration: `supabase/migrations/001_init.sql`

---

## 🎨 Design Consistency

All new features follow Mirror's design system:
- **Colors**: Brand (#2D2D7B), Accent (#6C63FF), Success (#0D9E75)
- **Typography**: Fraunces (display), DM Sans (body), DM Mono (code)
- **Components**: Use existing `mirror-card`, `mirror-btn-primary`, `mirror-input` classes
- **Animations**: Subtle transitions (150-300ms)
- **Mobile-first**: Responsive design with Tailwind breakpoints

---

## 📝 Notes

- Icon tooltips improve UX by showing what each emoji represents
- Habit name autocomplete speeds up habit creation
- iOS/Android instructions make PWA installation clear for all users
- Quantifiable tracking enables data-driven habit improvement
- All changes maintain backward compatibility with existing data
