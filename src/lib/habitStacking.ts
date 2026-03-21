// Habit Stacking Suggestions Algorithm
import type { CheckIn, Habit } from '@/types'

export interface HabitStackingSuggestion {
  anchorHabit: string
  anchorHabitId: string
  suggestedHabit: string
  suggestedHabitId: string
  reason: string
  strength: 'strong' | 'moderate'
}

export function generateHabitStackingSuggestions(
  habits: Habit[],
  allCheckIns: Record<string, CheckIn[]>
): HabitStackingSuggestion[] {
  const suggestions: HabitStackingSuggestion[] = []
  
  // Find habits with high completion rates (potential anchors)
  const habitStats = habits.map(habit => {
    const checkIns = allCheckIns[habit.id] || []
    const completed = checkIns.filter(ci => ci.status === 'done' || ci.status === 'partial').length
    const rate = checkIns.length > 0 ? completed / checkIns.length : 0
    return { habit, rate, totalDays: checkIns.length }
  })
  
  // Filter for habits with at least 14 days of data
  const eligibleHabits = habitStats.filter(h => h.totalDays >= 14)
  if (eligibleHabits.length < 2) return []
  
  // Find strong anchor habits (>70% completion rate)
  const anchors = eligibleHabits.filter(h => h.rate >= 0.7)
  
  // Find struggling habits (<50% completion rate)
  const struggling = eligibleHabits.filter(h => h.rate < 0.5 && h.rate > 0)
  
  // Suggest stacking struggling habits onto anchor habits
  for (const anchor of anchors) {
    for (const weak of struggling) {
      if (anchor.habit.id === weak.habit.id) continue
      
      // Check if they have temporal correlation (done on same days)
      const anchorCheckIns = allCheckIns[anchor.habit.id] || []
      const weakCheckIns = allCheckIns[weak.habit.id] || []
      
      const anchorDates = new Set(
        anchorCheckIns
          .filter(ci => ci.status === 'done' || ci.status === 'partial')
          .map(ci => ci.date)
      )
      
      const weakDates = new Set(
        weakCheckIns
          .filter(ci => ci.status === 'done' || ci.status === 'partial')
          .map(ci => ci.date)
      )
      
      // Count overlap
      let overlap = 0
      for (const date of weakDates) {
        if (anchorDates.has(date)) overlap++
      }
      
      const overlapRate = weakDates.size > 0 ? overlap / weakDates.size : 0
      
      // If there's already some natural overlap, suggest stacking
      if (overlapRate >= 0.3 && overlapRate < 0.7) {
        const strength: 'strong' | 'moderate' = overlapRate >= 0.5 ? 'strong' : 'moderate'
        
        suggestions.push({
          anchorHabit: anchor.habit.name,
          anchorHabitId: anchor.habit.id,
          suggestedHabit: weak.habit.name,
          suggestedHabitId: weak.habit.id,
          reason: generateStackingReason(anchor.habit.name, weak.habit.name, anchor.rate, weak.rate),
          strength
        })
      } else if (overlapRate < 0.3) {
        // Low overlap - suggest pairing for improvement
        suggestions.push({
          anchorHabit: anchor.habit.name,
          anchorHabitId: anchor.habit.id,
          suggestedHabit: weak.habit.name,
          suggestedHabitId: weak.habit.id,
          reason: `Try doing ${weak.habit.name.toLowerCase()} right after ${anchor.habit.name.toLowerCase()}. You're consistent with ${anchor.habit.name.toLowerCase()} — use that momentum.`,
          strength: 'moderate'
        })
      }
    }
  }
  
  // Sort by strength and return top 3
  return suggestions
    .sort((a, b) => (b.strength === 'strong' ? 1 : 0) - (a.strength === 'strong' ? 1 : 0))
    .slice(0, 3)
}

function generateStackingReason(anchorName: string, weakName: string, anchorRate: number, weakRate: number): string {
  const anchorPercent = Math.round(anchorRate * 100)
  const weakPercent = Math.round(weakRate * 100)
  
  return `You do ${anchorName.toLowerCase()} ${anchorPercent}% of the time. Stack ${weakName.toLowerCase()} onto it to boost from ${weakPercent}%.`
}
