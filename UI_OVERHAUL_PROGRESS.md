# Mirror UI Overhaul v2.0 — Progress Tracker

## ✅ Completed (Step 1-2)

### 1. Typography System
- ✅ Replaced Fraunces with DM Serif Display
- ✅ Added DM Sans and DM Mono to layout.tsx
- ✅ Created CSS variables in globals.css:
  - `--font-display`: DM Serif Display for headings
  - `--font-body`: DM Sans for body text
  - `--font-mono`: JetBrains Mono for streak numbers

### 2. Color System
- ✅ Updated globals.css with warm minimalism palette:
  - Background: `#F7F6F3` (warm off-white)
  - Surface: `#FFFFFF` (cards)
  - Brand: `#2D2D7B` (kept existing)
  - Success: `#0D9E75` with soft variant `#E8F7F2`
  - Amber: `#D97706` (replaces old slip color) with soft variant `#FEF3C7`
  - Text hierarchy: primary `#1A1A2E`, secondary `#6B7280`, tertiary `#9CA3AF`
  - Streak fire: `#EF4444`
- ✅ Updated Tailwind config with all new semantic colors
- ✅ Added dark mode palette (ready for toggle implementation)
- ✅ New shadow system: warm, subtle shadows instead of harsh purple tints

## 🚧 In Progress

### Next: Critical Fixes (High Impact, Quick Wins)

The implementation order prioritizes fixes that solve actual user pain points observed in screenshots:

## 📋 Implementation Queue

### Phase 1: Critical Fixes (Do These Next)
1. **fix_04**: Tab truncation → Icon-only habit selector
   - File: `src/app/(app)/graphs/page.tsx`
   - Impact: Prevents embarrassing truncation like "No Porn/Masturb..."
   - Effort: 30 min

2. **fix_01**: Show pending habit on dashboard
   - File: `src/app/(app)/dashboard/page.tsx`
   - Impact: User immediately sees which habit needs logging
   - Effort: 45 min

3. **fix_05**: Fix correlations threshold
   - File: `src/components/graphs/CorrelationPanel.tsx`
   - Impact: Fixes broken feature (69 days of data shows "no patterns")
   - Effort: 1 hour
   - Changes: Lower Pearson threshold 0.3→0.2, use Phi coefficient, show top 3 always

### Phase 2: Visual Redesign
4. **fix_02**: Redesign HabitCard
   - File: `src/components/habits/HabitCard.tsx`
   - Changes:
     - Category-colored left border
     - Streak badge with gradient background for 30+ days
     - Larger streak numbers in JetBrains Mono
     - New checkbox states with animations
     - Subtle shadow on done cards
   - Effort: 2 hours

5. **dash_01 + dash_03**: Dashboard typography & AI card
   - Files: `src/app/(app)/dashboard/page.tsx`
   - Changes:
     - Greeting in DM Serif Display 32px
     - Completion ring with gradient stroke
     - AI insight card with warm styling
   - Effort: 1 hour

### Phase 3: New Components
6. **WeeklyReviewCard**
   - File: `src/components/dashboard/WeeklyReviewCard.tsx` (new)
   - Shows Sunday 8pm with Groq-generated weekly summary
   - Effort: 1.5 hours

7. **StreakMilestoneOverlay**
   - File: `src/components/ui/StreakMilestoneOverlay.tsx` (new)
   - Full-screen celebration for milestone streaks
   - Effort: 2 hours

8. **fix_03**: Heatmap improvements
   - File: `src/components/graphs/HeatmapCalendar.tsx`
   - Break-free slips visually smaller
   - Trend overlay toggle
   - Month labels
   - Effort: 1.5 hours

9. **graph_06**: Year heatmap view
   - File: `src/app/(app)/graphs/page.tsx`
   - GitHub-style 52-week grid
   - Virtualized rendering
   - Effort: 2 hours

### Phase 4: Advanced Features
10. **FailurePatternInsight**
    - File: `src/components/graphs/FailurePatternInsight.tsx` (new)
    - Analyzes slip patterns client-side
    - Effort: 2 hours

11. **RiskWarningBanner**
    - File: `src/components/dashboard/RiskWarningBanner.tsx` (new)
    - Predictive warnings based on day-of-week patterns
    - Effort: 1.5 hours

12. **Micro-interactions**
    - Add Framer Motion animations throughout
    - Checkbox scale, ring fill, greeting fade-in
    - Effort: 2 hours

13. **Dark mode toggle**
    - File: `src/app/(app)/profile/page.tsx`
    - Sun/moon toggle with smooth transition
    - Effort: 1 hour

## 📊 Estimated Total Time
- Phase 1 (Critical): 2.25 hours
- Phase 2 (Visual): 3 hours
- Phase 3 (Components): 7 hours
- Phase 4 (Advanced): 6.5 hours
- **Total: ~19 hours of focused development**

## 🎯 Success Metrics
After implementation, verify:
- [ ] No truncated habit names anywhere in UI
- [ ] Pending habits immediately visible on dashboard
- [ ] Correlations show for users with 14+ days of data
- [ ] Streak badges appear for 7, 30, 60, 90+ day habits
- [ ] Dark mode toggle works smoothly
- [ ] All fonts load correctly (DM Serif Display, DM Sans, JetBrains Mono)
- [ ] Warm color palette applied throughout
- [ ] Animations feel smooth on mobile (60fps)

## 🔧 Technical Notes
- Framer Motion already installed — use for all animations
- No schema changes needed — purely frontend work
- Test on 375px mobile viewport (iPhone SE)
- CSS linter warnings about `@tailwind` are false positives — ignore
- All new components must handle empty states
- Sensitive habit names never appear in shareable content

## 📝 Files Modified So Far
1. `src/app/layout.tsx` — DM Serif Display font import
2. `src/app/globals.css` — Color system + font variables
3. `tailwind.config.ts` — Semantic color tokens

## 🚀 Ready to Continue
Foundation is complete. Starting with fix_04 (tab truncation) next as it's the quickest high-impact fix.
