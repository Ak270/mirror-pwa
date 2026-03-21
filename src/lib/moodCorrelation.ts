// Mood × Habit Correlation Analysis
import type { CheckIn, Reflection } from '@/types'

export interface MoodHabitCorrelation {
  habitName: string
  coefficient: number
  strength: 'weak' | 'moderate' | 'strong'
  direction: 'positive' | 'negative'
  insight: string
}

export function calculateMoodHabitCorrelation(
  reflections: Reflection[],
  checkIns: CheckIn[],
  habitName: string
): MoodHabitCorrelation | null {
  // Filter reflections with mood scores
  const moodData = reflections.filter(r => r.mood_score !== null)
  if (moodData.length < 4) return null // Need at least 4 weeks of data
  
  // For each reflection week, calculate habit completion rate
  const pairs: Array<{ mood: number; completion: number }> = []
  
  for (const reflection of moodData) {
    const weekStart = new Date(reflection.week_start)
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000)
    
    // Get check-ins for this week
    const weekCheckIns = checkIns.filter(ci => {
      const ciDate = new Date(ci.date)
      return ciDate >= weekStart && ciDate < weekEnd
    })
    
    if (weekCheckIns.length === 0) continue
    
    const completed = weekCheckIns.filter(ci => ci.status === 'done' || ci.status === 'partial').length
    const completionRate = completed / weekCheckIns.length
    
    pairs.push({
      mood: reflection.mood_score!,
      completion: completionRate
    })
  }
  
  if (pairs.length < 4) return null
  
  // Calculate Pearson correlation
  const n = pairs.length
  const sumMood = pairs.reduce((sum, p) => sum + p.mood, 0)
  const sumCompletion = pairs.reduce((sum, p) => sum + p.completion, 0)
  const sumMoodSq = pairs.reduce((sum, p) => sum + p.mood * p.mood, 0)
  const sumCompletionSq = pairs.reduce((sum, p) => sum + p.completion * p.completion, 0)
  const sumProduct = pairs.reduce((sum, p) => sum + p.mood * p.completion, 0)
  
  const numerator = n * sumProduct - sumMood * sumCompletion
  const denominator = Math.sqrt(
    (n * sumMoodSq - sumMood * sumMood) * (n * sumCompletionSq - sumCompletion * sumCompletion)
  )
  
  if (denominator === 0) return null
  
  const coefficient = numerator / denominator
  const absCoeff = Math.abs(coefficient)
  
  const strength: 'weak' | 'moderate' | 'strong' = 
    absCoeff >= 0.5 ? 'strong' : absCoeff >= 0.3 ? 'moderate' : 'weak'
  const direction: 'positive' | 'negative' = coefficient >= 0 ? 'positive' : 'negative'
  
  // Generate insight based on correlation
  let insight = ''
  if (direction === 'positive' && strength === 'strong') {
    insight = `${habitName} strongly correlates with better mood. When you do this habit, you tend to feel better.`
  } else if (direction === 'positive' && strength === 'moderate') {
    insight = `${habitName} may improve your mood. There's a moderate positive connection.`
  } else if (direction === 'negative' && strength === 'strong') {
    insight = `${habitName} correlates with lower mood scores. Consider if this habit serves you.`
  } else if (direction === 'negative' && strength === 'moderate') {
    insight = `${habitName} shows a moderate negative correlation with mood. Worth exploring why.`
  } else {
    insight = `${habitName} shows a weak correlation with mood. More data may reveal patterns.`
  }
  
  return {
    habitName,
    coefficient,
    strength,
    direction,
    insight
  }
}
