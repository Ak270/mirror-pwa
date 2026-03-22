# Mirror — Complete Analysis Report
Generated: March 2026 | Arjun + Dr. Chen perspective
Files read: 25 source files

---

## 1. Executive Summary

Mirror's core philosophy — "you are your own highest authority" — is the most psychologically sound premise in the habit tracking market. The language system is genuinely excellent: `CHECK_IN_LABELS` (`src/types/index.ts:197`) gives break-free habits their own vocabulary, and `SYSTEM_IDENTITY` (`src/lib/ai/prompts.ts:1`) correctly bans shame-triggering words. The vault uses SHA-256 hashing and IndexedDB — real security, not theater. But Mirror treats every interaction as a context-free event. It doesn't know if Arjun is tapping "I had a moment" at 2am for the fifth time this week, returning after a 4-day absence, or standing in his known vulnerability window. The single biggest risk: Mirror has all the data it needs to feel like a companion — `check_ins.created_at` timestamps, `slip_note` text, `notification_conversations` logs — and is currently using none of it that way.

---

## 2. What's Working (Keep and Protect)

### 2.1 Category-Specific Check-In Language
**Technical:** `CHECK_IN_LABELS` at `src/types/index.ts:197-222`. `break_free` gets "I held on today" / "I had a moment today." `mind_spirit` gets "I showed up" / "Not quite today."
**Arjun:** When he taps at 2am and sees "I had a moment today" instead of "Failed," the app named what happened without making it bigger. He doesn't close Mirror feeling worse. That is rare.
**Dr. Chen:** Applied shame-resilience theory. "I had a moment today" is an event description, not a verdict. The `break_free` labels correctly avoid the word "slip" entirely — for addiction-adjacent behaviors that word carries clinical weight.
**Protect this.** Any refactor collapsing these labels costs more psychologically than it saves technically.

### 2.2 The 1-Day Forgiveness Window
**Technical:** `FORGIVENESS_DAYS = 1` in `src/lib/streak.ts:4`. Streak breaks only if `daysSinceLast > FORGIVENESS_DAYS + 1`.
**Dr. Chen:** Loss aversion around streaks cuts both ways — if the loss happens, users often don't return. One day grace is minimum viable compassion.
**Critical gap:** `shouldShowForgiveness()` at `streak.ts:78-82` detects when a streak is on grace. It is **never called anywhere in the UI**. Silent grace creates false confidence. Explicit grace creates intentional action.

### 2.3 The Vault — Real Security
**Technical:** `vault.ts:24` uses `crypto.subtle.digest('SHA-256')`. Data lives in IndexedDB only. 10 failed attempts → 24h lockout at line 73.
**Dr. Chen:** Privacy is a precondition for honesty. The vault architecture creates the psychological safety for the most vulnerable habits to be acknowledged at all.

### 2.4 The `sanitizeCopy()` Safety Net
**Technical:** `src/lib/utils.ts:96-104` scans AI output for forbidden words (`'failed', 'missed', 'relapsed'`...) and replaces with `'...'`. Applied in `src/lib/ai/client.ts:42-48` to all AI responses.
**Needs additions:** `['giving up', 'lost control', 'yet again', 'once more', 'how many times']`

### 2.5 The Slip Note Modal
**Technical:** `CheckInButton.tsx:117-148`. Optional bottom sheet. Placeholder: `"I was tired... I forgot... I chose not to..."`. Submitting and skipping both proceed equally.
**Arjun:** "I chose not to" removes the fiction that slips are always accidents. More honest than most apps are willing to be.
**Gap:** `slip_note` data is stored but never surfaced back to the user.

### 2.6 Background AI Insight Loading
**Technical:** `dashboard/page.tsx:56-59` fetches insight after habits load. Page renders immediately.
**Dr. Chen:** Correct loading psychology. Primary task (habit status) first. Secondary emotional layer (insight) second.

### 2.7 Onboarding Voice
**Technical:** `onboarding/page.tsx:148-155`. "No judgment. No proof required. No shame for honest days. You are the only authority on your own life."
**Dr. Chen:** Motivational interviewing's fundamental stance in 18 words. The best copy in the codebase.

---

## 3. What's Broken or Missing (Critical Gaps)

### 3.1 Zero Temporal Intelligence — The 2am Vulnerability
**The gap:** `check_ins.created_at` records exactly when every slip happened. **No code in the entire codebase reads this field for analysis.**
**Arjun:** He slips at 2am. Tomorrow the insight says "2 completed, 1 slip" — the same sentence as if he slipped at 2pm. Mirror saw nothing different.
**Dr. Chen:** Time of day a slip occurs is among the most predictive variables in addiction research. If 80% of Arjun's No Porn slips happen between 11pm and 2am, that is a specific clinical intervention window.
**Fix:** Query `check_ins.created_at` for `honest_slip` statuses per habit. Calculate most common slip hour. If current time is within 90 minutes of that window, fire a proactive check-in notification. The cron infrastructure exists. The data is already collected.

### 3.2 `shouldShowForgiveness()` Is Never Called
**The gap:** `src/lib/streak.ts:78-82` exports `shouldShowForgiveness()`. Never imported or used anywhere.
**Arjun:** His streak shows 7 days but yesterday he forgot to log. He has no idea the streak is on grace. If he forgets tomorrow, it dies with no warning.
**Fix:** In `src/components/habits/HabitCard.tsx`, call `shouldShowForgiveness()` and show an amber "grace day" indicator. One import, one conditional render.

### 3.3 Reflect Page AI Function Exists But Is Never Called
**The gap:** `reflect/page.tsx:10-17` uses a hardcoded array of 6 generic questions. `getReflectionPrompt()` in `src/lib/ai/client.ts:119-132` exists, accepts habit summary data, and generates contextual questions. **It is never called from the reflect page.**
**Arjun:** He had 4 slips on No Smoking this week. The prompt asks "What showed up for you this week that surprised you?" — identical to what a perfect-week user gets.
**Fix:** In `loadData()` in `reflect/page.tsx`, compute week's habit completion rates and call `getReflectionPrompt()`. Three lines.

### 3.4 The Re-entry Problem
**The gap:** No code path handles a user returning after 3+ days. They see all habits with broken streaks, null status, no acknowledgment of the gap.
**Arjun:** He hasn't opened Mirror in 4 days. He knows. He feels guilt before the app opens. The dashboard confirms it: 0/N logged, streaks at 0. He closes it again. This is how users permanently churn.
**Dr. Chen:** Re-entry moments are statistically high-motivation windows — but only if guilt friction is removed first. The worst design is a guilt inventory on re-entry.
**Fix in `dashboard/page.tsx`:**
```typescript
const lastActivity = habits.flatMap(h => h.check_ins ?? [])
  .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
const daysSince = lastActivity
  ? differenceInCalendarDays(new Date(), parseISO(lastActivity.created_at)) : null
if (daysSince && daysSince > 2) setShowReentryBanner(true)
```
Card copy: *"You're back. [N] days — and you came back anyway. That's the only thing that matters. Pick one habit. Just one."*

### 3.5 Daily Insight Is Context-Blind
**The gap:** `src/lib/ai/client.ts:100`. Prompt sends only counts: `"Today's habits: X completed, Y slips, Z skipped"`. The AI knows "1 slip" but not which habit or at what time. Cannot be specific.
**Fix:** Pass habit names (not just counts) into the insight prompt — especially which habits slipped and the streak of the most consistent habit. The `/api/ai/insight` route at line 25-28 already fetches habit names but strips them to counts before calling AI.

### 3.6 No Past-Date Logging
**The gap:** `habits.ts:102` hardcodes `format(new Date(), 'yyyy-MM-dd')`. No mechanism to log a habit for yesterday.
**Arjun:** He forgets to log No Smoking Wednesday. Thursday he can't go back. Streak breaks for a habit he actually maintained.
**Fix:** Accept optional `date` parameter in `logCheckIn()`. Add "Log for yesterday" option on the habit detail page.

### 3.7 Vault Slip Language Is Inconsistent
**The gap:** `vault/page.tsx:247` renders slip button as literal `'Slip'`. Main app uses `CHECK_IN_LABELS.break_free.honest_slip = 'I had a moment today'`. The most private space uses the bluntest label.
**Fix:** Import `CHECK_IN_LABELS` in `vault/page.tsx`. One import, one reference.

### 3.8 Vault Has No Streak Display
**The gap:** Vault habits show no streak. For No Porn on day 6, Arjun opens the vault and sees no evidence of the 6 days he fought for.
**Dr. Chen:** "Day 6" is identity-building, not performance-scoring. The vault's silence removes the only positive feedback in the most vulnerable habit category.
**Fix:** Compute streak from `habit.check_ins` (already loaded) and display "Day X" below habit name.

### 3.9 Check-In Confirmation Is Pattern-Blind
**The gap:** `client.ts:72` knows `currentStreak` but not how many consecutive slips have happened this week. AI generates the same response for a first slip as for a fifth.
**Dr. Chen:** A first slip after 14 days needs reassurance. A fifth consecutive slip needs gentle pattern-naming: "Three times this week. Something's shifted. No judgment — just noticing."
**Fix:** Pass `consecutive_slips` (count of `honest_slip` in last 7 days for this habit) into the prompt.

### 3.10 Raw `alert()` on Onboarding Error
**The gap:** `onboarding/page.tsx:98`: `alert('Database error: ${error.message}\n\nPlease run the SQL migration...')`
**Dr. Chen:** The first failure a new user encounters permanently shapes their expectation of the product.
**Fix:** Inline error state: "Something went sideways on our end. Tap here to try again."

---

## 4. The Language Audit

### Flagged Strings — Replace These

| File | Current | Issue | Replacement |
|------|---------|-------|-------------|
| `log/page.tsx:103` | `"${n} left to log."` | Countdown pressure | `"${n} more when you're ready."` |
| `log/page.tsx:55` | `"Something is better than nothing."` | Backhanded | `"You still showed up."` |
| `CheckInButton.tsx:120` | `"Why did you slip?"` | Accusatory + stigma | `"What was going on?"` |
| `CheckInButton.tsx:143` | `"Log slip"` | Repeats "slip" at shame moment | `"Note it"` |
| `dashboard/page.tsx:163` | `"Still pending"` | Guilt signal | `"Whenever you're ready"` |
| `vault/page.tsx:247` | `"Slip"` (button) | Harshest in most private space | `"Had a moment"` |
| `vault/page.tsx:45` | `"Too many attempts. Vault will unlock in 24 hours."` | Cold security tone | `"Take a break. The vault will be here in 24 hours."` |
| `types/index.ts` | `build_up.done: "Done"` | No identity weight | `"I showed up"` |
| `types/index.ts` | `build_up.partial: "Partial"` | Clinical | `"Part of it"` |
| `types/index.ts` | `rhythm.honest_slip: "Off track today"` | Spatial failure | `"Different day today"` |
| `onboarding/page.tsx:98` | `alert('Database error...')` | Raw technical error | Inline retry state |

### Strings That Are Excellent — Protect Them
- `"No judgment. No proof required. No shame for honest days."` — `onboarding/page.tsx:150`
- `"You are the only authority on your own life."` — `onboarding/page.tsx:153`
- `"I was tired... I forgot... I chose not to..."` — `CheckInButton.tsx:126`
- `"Noted. Yesterday is yesterday."` — `log/page.tsx:54`
- `"Mirror never judges the struggle, only supports the intention."` — `vault/page.tsx:173`
- `"Mirror does not reward performance — it rewards honesty."` — `app/page.tsx:165`
- `"Today is still open."` + `"No rush."` — `dashboard/page.tsx:143,148`

---

## 5. The Notification System Audit

### What Exists
`src/lib/ai/notifications.ts` has six well-designed generator functions. `generateBreakFreeCheckin()` correctly passes `current_time_label` and asks for warmth. `generateSlipReaction()` says "If reduction vs yesterday → lead with celebration of the specific number." Action labels `['Still holding 💪', 'Had a moment']` are psychologically correct. This is the best AI writing in the codebase.

### Missing Notification Types

| Missing | Why It Matters |
|---------|---------------|
| Re-entry after 3+ days | "You're back. Just one thing today." |
| Vulnerability window alert | "This is usually a harder hour for [habit]. How are you?" |
| Consecutive slip acknowledgment | "Three times this week. Something's different. No pressure — just noticing." |
| Forgiveness mode alert | "Your streak is being held for one more day. Log today." |
| Day 1 restart (midnight after slip) | "New day. You're at Day 1." |

### Timing Analysis
**Current:** Purely calendar-driven — `reminder_time` or `check_in_interval_minutes`.
**Missing:** Pattern-driven timing from `check_ins.created_at` analysis.

**Dr. Chen's three optimal intervention windows:**
1. **6:30-7:30am** — identity window; brain most receptive to behavioral intention right after waking
2. **2:00-4:00pm** — energy dip; highest vulnerability for break habits
3. **User's identified slip time minus 90 minutes** — only achievable via `created_at` analysis

Only window #1 is currently reachable.

### End-of-Day Fallback Fix
Current (`notifications.ts:226`): `"${n} habits still unlogged. How did the rest of the day go?"` — leads with guilt inventory.
Replace with: `"How did today feel? Log whenever you're ready — or skip it if it wasn't your day."`

---

## 6. The Break-Free Habit Experience

### Full UX Flow

**Creation:** `HabitForm.tsx:253-292`. "How many yesterday? (helps Mirror celebrate progress)" is excellent framing. **Good.**
**Gap:** No disclosure that break-free notifications show "Checking in" as title (not the habit name). Discretion is built in but undocumented.

**The 2am slip UX:**
1. Opens app. Taps 🌙 on No Porn
2. Sees "I had a moment today" ✅
3. Bottom sheet: **"Why did you slip?"** ❌ → should be "What was going on?"
4. Placeholder: "I was tired... I forgot... I chose not to..." ✅
5. Taps **"Log slip"** ❌ → should be "Note it"
6. Confirmation: "Noted. Yesterday is yesterday." ✅
7. App has zero awareness this is 2am vs 2pm ❌

**Recovery morning:** Streak shows 0. No "Day 1" framing. No acknowledgment today is a fresh start.
**Dr. Chen:** "A slip is the day before the next streak starts." Showing 0 frames loss. Showing "Day 1" frames beginning.

**Vault break-free:** Most vulnerable habits, most private space, least support — no streaks, inconsistent labels, no AI, no notifications. This is the most important gap in the product.

---

## 7. Data That Exists But Isn't Being Used

| Data | Stored In | Currently Used | Should Be Used For |
|------|-----------|---------------|-------------------|
| `check_ins.created_at` | Supabase | Nothing | Time-of-day slip analysis, vulnerability window |
| `check_ins.slip_note` | Supabase | Stored only | "You mentioned stress 4 times this week" |
| `reflections.mood_score` | Supabase | Display only | Correlate with habit completion rates |
| `notification_conversations.user_action` | Supabase | Stored only | Understand which actions users actually tap |
| `habits.best_streak` | Computed | Habit detail only | Not passed to AI prompts |
| `check_ins.quantifiable_value` history | Supabase | Single-day | Trend line, personal best |

**Most immediately actionable:** `check_ins.created_at`. One SQL GROUP BY gives "most common hour for honest_slip per habit per user." Enables the highest-impact feature in the roadmap.

---

## 8. The Re-entry Problem

No code detects returning users. Middleware routes to `/dashboard`. Dashboard shows all habits unlogged, streaks at 0. Implicit message: "Look at everything you didn't do."

**Recommended card above habit list:**
> "You're back.  
> [N] days — and you came back anyway.  
> That's the only thing that matters. Pick one habit. Just one."

Dismiss on first log. Don't show again for 7 days.

---

## 9. The Privacy Architecture (Vault)

| Mechanism | Implementation | Status |
|-----------|---------------|--------|
| PIN hashing | SHA-256 via `crypto.subtle` (`vault.ts:24`) | ✅ Secure |
| Brute force | 10 attempts → 24h lockout (`vault.ts:73`) | ✅ Adequate |
| Storage | IndexedDB only | ✅ Privacy-correct |
| Server separation | `is_vault: true` habits never hit Supabase | ✅ Clean |
| Auto-lock | Session-based only | ⚠️ Add 5-min inactivity lock |
| New device | Data permanently lost | ⚠️ **Undisclosed to user** |

**Critical gap:** No warning that vault data is permanently lost on device change. Fix: add one-time disclosure on first vault setup.

---

## 10. Feature Completeness Matrix

| Feature | Implemented | Works Correctly | Psych Sound | Priority |
|---------|-------------|-----------------|-------------|----------|
| Category-specific check-in labels | ✅ | ✅ | ✅ | — |
| Streak forgiveness | ✅ | ✅ | ✅ | — |
| Forgiveness mode UI indicator | ❌ (fn exists) | — | — | High |
| Vault SHA-256 + IndexedDB | ✅ | ✅ | ✅ | — |
| Vault streak display | ❌ | — | — | High |
| Vault consistent language | ❌ | — | — | Low (quick fix) |
| Re-entry handling | ❌ | — | — | **Critical** |
| Time-of-day slip analysis | ❌ | — | — | **Critical** |
| Vulnerability window notifications | ❌ | — | — | **Critical** |
| Past-date logging | ❌ | — | — | Medium |
| AI daily insight (specific) | ✅ | ⚠️ Context-blind | ⚠️ | High |
| AI check-in confirmation | ✅ | ✅ | ⚠️ Pattern-blind | Medium |
| AI reflect prompts | ❌ (fn exists) | — | — | High |
| Consecutive slip detection | ❌ | — | — | High |
| Correlation panel (Phi) | ✅ | ✅ | ✅ | — |
| Failure pattern insights | ✅ | ✅ | ✅ | — |
| Milestone celebrations | ✅ | ✅ | ✅ | — |
| Risk warning banner | ✅ | ✅ | ✅ | — |
| Weekly reflection | ✅ | ⚠️ Generic prompts | ⚠️ | High |
| Notification delivery (SW) | ✅ | ✅ | ✅ | — |

---

## 11. The Groq/AI Integration Audit

### Check-in Confirmation (`src/lib/ai/client.ts:70-72`)

**Current user prompt:**
```
"User logged habit '${habitName}' with status '${status}'. Current streak: ${currentStreak} days. Category: ${categoryId}. Reply with one warm sentence."
```

**Problem:** Knows streak after the slip (0), not the streak that was just broken. Knows nothing about consecutive slips this week.

**Improved user prompt:**
```
"User logged '${habitName}' (${categoryId}) as '${status}'.
Current streak: ${currentStreak}. Best streak ever: ${bestStreak} days.
Slips on this habit in the last 7 days: ${recentSlipCount}.
Time of day: ${timeOfDay}.
If recentSlipCount >= 3: gently name a pattern without judgment, ask what's going on.
If honest_slip broke a streak >= 14: acknowledge what was built, not what was lost.
Reply with one warm sentence (max 12 words). No emojis."
```

---

### Daily Insight (`src/lib/ai/client.ts:92-100`)

**Current user prompt:**
```
"Today's habits: ${completedHabits.length} completed, ${missedHabits.length} slips, ${skippedHabits.length} skipped out of ${totalHabits} total. Top habit: '${topHabit}'. Recent pattern: ${patternSummary}. Generate a daily insight."
```

**Problem:** Counts only. Cannot be specific. The AI insight is as generic as possible because the input is as generic as possible.

**Improved user prompt:**
```
"Today's habit log:
- Completed: ${completedHabits.join(', ') || 'none'}
- Slipped: ${slippedHabits.join(', ') || 'none'}
- Skipped: ${skippedHabits.join(', ') || 'none'}
Most consistent habit: '${topHabit}' (${topStreakDays} days).
Day of week: ${dayOfWeek}.
Generate one specific, warm, observational insight. Reference actual habit names. Max 2 sentences."
```

The `/api/ai/insight/route.ts:25-28` already fetches habit names but strips them to counts at line 45-58 before calling the AI. Pass the names through.

---

### Reflection Prompt (`src/lib/ai/client.ts:119-132`)

The function is correctly written and never called. `reflect/page.tsx:31` uses `REFLECTION_PROMPTS[promptIndex]` — a static array indexed by day of week. The AI version would say, for a week with 4 smoking slips: *"You kept showing up for Morning Workout even when No Smoking was hard. What made that different?"* The static version says whatever it says on a Wednesday. Call `getReflectionPrompt()` with actual week data.

---

### Break-Free Check-in (`notifications.ts:91-94`)

The best prompt in the codebase. Correctly passes time label, yesterday comparison, and requests warmth. One gap: it doesn't know the user's historical slip window. Add:
```
"If current_time is within 2 hours of the user's most common slip time, 
acknowledge the time: 'I know this time of night can be harder.'"
```

---

### Missing AI Touchpoints

| Missing | Impact | Where |
|---------|--------|-------|
| Re-entry welcome message | Critical | `dashboard/page.tsx` |
| Consecutive slip response | High | check-in confirmation when `recentSlips >= 3` |
| AI reflection prompt (unused fn) | High | `reflect/page.tsx` |
| "Day 1" restart framing | Medium | `HabitCard.tsx` when streak === 0 and yesterday was slip |
| Forgiveness mode message | Medium | `HabitCard.tsx` |
| Vulnerability window check-in | Critical | New notification type |

---

## 12. Technical Debt That Affects User Experience

### Unbounded Check-In Query
`habits.ts:52-58`: `getHabitsWithTodayStatus()` loads ALL check-ins for the user — no date filter, no row limit. A user with 6 habits × 2 years = 4,380+ rows loaded just to compute today's status.
**Fix:** Add `.gte('date', format(subDays(new Date(), 400), 'yyyy-MM-dd'))`.

### Full Refetch After Every Log
`dashboard/page.tsx:73`: After `handleStatusChange()`, it calls `await loadData()` — re-fetching all habits for a status update that was already applied optimistically at line 68.
**Fix:** Remove `await loadData()` from `handleStatusChange()`.

### `window.location.href` After Onboarding
`onboarding/page.tsx:106`: Hard redirect bypasses Next.js router. Causes full page reload on the most emotionally significant navigation.
**Fix:** `router.push('/dashboard')` and remove the 500ms artificial delay.

### `alert()` in Production
`onboarding/page.tsx:98, 109`: Native alert dialogs with raw database errors and SQL instructions shown to new users.
**Fix:** Inline error state with retry action.

### In-Memory Rate Limiting
`src/lib/ai/groq.ts`: Rate limiting is in-memory. On serverless functions (Vercel), each cold start resets the counter. Rate limits offer no protection under load.
**Fix:** Move rate limit tracking to Supabase or Redis.

---

## 13. The Competitor Gap Analysis

### What Mirror Can Do That No Other Habit App Can

1. **Private vault habits that never leave the device** — Habitica, Streaks, Notion, all sync everything to servers. Mirror's vault is architecturally unique.
2. **Category-specific compassionate language per habit** — Every other app uses the same "Done / Skip / Miss" vocabulary regardless of whether you're tracking meditation or addiction recovery.
3. **Proactive check-in notifications with action replies that never open the app** — The SW notification action handler (`sw.js:83-102`) fires-and-forgets the reply silently. This is sophisticated and uncommon.
4. **Anonymous trial with full functionality** — No email, no credit card, no account required to start.
5. **Phi-coefficient correlation between habits** — Most apps show no inter-habit analytics at all.

### What Other Apps Do That Mirror Still Can't

1. **Apple Health / Google Fit integration** — Automatic logging for workouts, steps, sleep. Mirror requires manual honesty.
2. **Habit scheduling by time window** — Streaks app lets you define habits that only count between 6am-10am. Mirror's frequency is day-based only.
3. **Shared accountability** — Habitica, Bereal for habits. Mirror is intentionally solo, but this limits social motivation for users who want it.
4. **Past-date logging** — Most apps allow editing the last 7 days. Mirror locks to today only.
5. **Export / backup** — No data export. No backup. No vault sync across devices.
6. **Widget with logging** — `MirrorWidget.js` exists in `/public` but the PWA widget API is Android-only and experimental. No iOS widget.

---

## 14. The 30-Day Roadmap

### Week 1: Highest Psychological Impact, Lowest Effort

| Day | Task | Effort | Impact |
|-----|------|--------|--------|
| 1 | Fix vault language: import `CHECK_IN_LABELS`, replace `'Slip'` button | 30 min | High |
| 1 | Fix `CheckInButton.tsx:120`: "Why did you slip?" → "What was going on?" | 10 min | High |
| 1 | Fix `CheckInButton.tsx:143`: "Log slip" → "Note it" | 5 min | Medium |
| 2 | Add vault streak display from `habit.check_ins` | 2 hrs | High |
| 2 | Wire `shouldShowForgiveness()` to amber indicator in `HabitCard.tsx` | 1 hr | High |
| 3 | Fix daily insight prompt to pass habit names, not just counts | 1 hr | High |
| 3 | Call `getReflectionPrompt()` from `reflect/page.tsx` | 1 hr | High |
| 4 | Build re-entry banner in `dashboard/page.tsx` | 3 hrs | Critical |
| 5 | Add past-date logging (optional `date` param to `logCheckIn()`) | 3 hrs | Medium |

### Week 2: Fix What's Broken

| Task | Effort | Impact |
|------|--------|--------|
| Query `check_ins.created_at` to identify per-habit slip hour patterns | 4 hrs | Critical |
| Add `.gte()` date filter to `getHabitsWithTodayStatus()` | 30 min | Performance |
| Remove `await loadData()` from `handleStatusChange()` | 15 min | Performance |
| Replace `alert()` with inline error state in `onboarding/page.tsx` | 1 hr | Critical UX |
| Add vault device-loss warning on first setup | 30 min | Medium |
| Add "Day 1" framing on habit cards when streak=0 and yesterday was slip | 1 hr | High |
| Pass `consecutive_slips` to check-in confirmation prompt | 2 hrs | High |

### Week 3: Build What's Missing

| Task | Effort | Impact |
|------|--------|--------|
| Build vulnerability window notification type | 1 day | Critical |
| Build "Checking in — you're back" re-entry notification | 3 hrs | Critical |
| Build consecutive slip notification ("Third time this week") | 3 hrs | High |
| Surface `slip_note` patterns back to user in reflect or graphs page | 1 day | High |
| Mood score correlation with habit completion in graphs page | 1 day | Medium |

### Week 4: Polish and The Features That Make People Tell Their Friends

| Task | Effort | Impact |
|------|--------|--------|
| Year heatmap (GitHub-style 52-week grid) | 1 day | Medium |
| Export data as CSV | 1 day | Medium/Trust |
| Vault "encrypted backup" via user-controlled passphrase + iCloud/Drive | 2 days | Critical for retention |
| Framer Motion micro-interactions on check-in | 1 day | Delight |
| "This time last month" comparison in insight | 1 day | Delight |
| Push notification that references a specific past slip note | 1 day | **The feature that makes people text friends** |

---

## 15. The One Thing

**If Mirror could only improve one thing in the next 7 days — the single change that would most prevent Arjun from deleting the app:**

### Build the Re-entry Banner

Here's why this beats everything else on the list:

Every other improvement (temporal analysis, vulnerability window, AI prompt improvements) requires data accumulation, cron infrastructure changes, or ML-adjacent work. They are real and important, but they take weeks to feel.

The re-entry banner takes one afternoon. It addresses the moment when users are most likely to delete the app permanently. It requires no new data — only the `check_ins.created_at` data already in the database. And it speaks directly to the core shame loop that kills habit apps:

> User slips → stops using app → feels guilty → opens app → sees evidence of absence → closes app → never opens again.

The banner breaks this loop with one sentence: **"You're back. That's the only thing that matters right now."**

### Exact Implementation

In `src/app/(app)/dashboard/page.tsx`, after `setHabits(habitsData)`:

```typescript
// Detect re-entry
if (habitsData.length > 0) {
  const allCIs = habitsData.flatMap(h => h.check_ins ?? [])
  if (allCIs.length > 0) {
    const mostRecent = allCIs.sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    )[0]
    const days = differenceInCalendarDays(
      new Date(), parseISO(mostRecent.created_at)
    )
    if (days > 2) {
      setReentryDays(days)
    }
  }
}
```

Then render above the habit list:

```tsx
{reentryDays && reentryDays > 2 && (
  <div className="mb-6 p-4 bg-accent-light border border-accent/20 rounded-card animate-fade-in">
    <p className="text-brand text-sm font-medium mb-1">
      You're back.
    </p>
    <p className="text-muted text-sm">
      {reentryDays} days — and you came back anyway.
      That's the only thing that matters right now.
    </p>
    <p className="text-xs text-muted mt-2">
      Pick one habit. Just one.
    </p>
  </div>
)}
```

Dismiss when the user logs their first habit of the session. Don't show again for 7 days (store last-shown date in localStorage).

This is not a feature. It is the difference between Mirror being an app Arjun uses when he's doing well and Mirror being the app he comes back to when he isn't. The second one is irreplaceable. The first one has fifty competitors.

---

*End of analysis. Total scope: 25 files read, ~4,200 lines of source code analyzed.*
