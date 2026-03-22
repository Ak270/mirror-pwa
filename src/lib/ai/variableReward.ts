import { createClient } from '@/lib/supabase/server'

export type ResponseType = 'normal' | 'pattern_surprise' | 'silence'

/**
 * Variable reward distribution:
 * - 50% normal warm response
 * - 30% pattern surprise insight
 * - 20% silence (no notification)
 * 
 * EXCEPTION: Always respond to honest_slip - never silence
 */
export function selectResponseType(status: string): ResponseType {
  // NEVER silence a slip
  if (status === 'honest_slip') {
    const rand = Math.random()
    return rand < 0.625 ? 'normal' : 'pattern_surprise' // 62.5% normal, 37.5% pattern
  }

  const rand = Math.random()
  if (rand < 0.5) return 'normal'
  if (rand < 0.8) return 'pattern_surprise'
  return 'silence'
}

interface PatternSurprise {
  id: string
  message: string
  detected: boolean
}

/**
 * Pattern surprise engine - detects specific patterns user doesn't know about
 */
export async function detectPatternSurprise(
  userId: string,
  habitId: string,
  habitName: string,
  currentStreak: number,
  bestStreak: number,
  createdAt: string
): Promise<PatternSurprise | null> {
  const supabase = await createClient()
  const today = new Date()
  const dayOfWeek = today.getDay()

  // Pattern 1: Day of week breakthrough
  const fourWeeksAgo = new Date(today)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const { data: recentSlips } = await supabase
    .from('check_ins')
    .select('date, created_at')
    .eq('habit_id', habitId)
    .eq('status', 'honest_slip')
    .gte('created_at', fourWeeksAgo.toISOString())

  if (recentSlips && recentSlips.length >= 2) {
    const slipsOnThisDay = recentSlips.filter(s => {
      const slipDate = new Date(s.created_at)
      return slipDate.getDay() === dayOfWeek
    })

    // Check if this day used to be hard but hasn't been for 2+ weeks
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const recentSlipsOnThisDay = slipsOnThisDay.filter(s => 
      new Date(s.created_at) > twoWeeksAgo
    )

    if (slipsOnThisDay.length >= 2 && recentSlipsOnThisDay.length === 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return {
        id: 'day_of_week_breakthrough',
        message: `You've held on every ${dayNames[dayOfWeek]} for weeks. ${dayNames[dayOfWeek]} used to be the hard day.`,
        detected: true
      }
    }
  }

  // Pattern 2: Personal best approach
  if (currentStreak === bestStreak - 1 && bestStreak > 7) {
    return {
      id: 'personal_best_approach',
      message: `One more day and this becomes your longest ${habitName} streak ever.`,
      detected: true
    }
  }

  // Pattern 3: Since date milestone
  const created = new Date(createdAt)
  const daysSinceCreation = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  const milestones = [7, 14, 21, 30, 60, 90]
  
  if (milestones.includes(daysSinceCreation)) {
    const createdFormatted = created.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    return {
      id: 'since_date_milestone',
      message: `You've been doing this since ${createdFormatted}. That's longer than most things people start.`,
      detected: true
    }
  }

  // Pattern 4: Quiet consistency (30+ day streak, no milestone notification in 14 days)
  if (currentStreak >= 30) {
    const { data: recentNotifications } = await supabase
      .from('notification_conversations')
      .select('created_at')
      .eq('habit_id', habitId)
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .like('message_text', '%Day%')
      .limit(1)

    if (!recentNotifications || recentNotifications.length === 0) {
      return {
        id: 'quiet_consistency',
        message: `${habitName} — ${currentStreak} days. You built that quietly. No fanfare. Just you showing up.`,
        detected: true
      }
    }
  }

  return null
}

/**
 * Get support description based on addiction level
 */
export function getSupportDescription(addictionLevel: number): string {
  if (addictionLevel <= 3) return "Mirror will check in gently. You've got this."
  if (addictionLevel <= 6) return "Mirror will check in more often, especially in harder moments."
  if (addictionLevel <= 9) return "Mirror will be with you closely, especially the first week."
  return "Mirror will support you fully. Consider also speaking with a professional — this is hard, and you don't have to do it alone."
}

/**
 * Calculate check-in interval based on addiction level and days since start
 */
export function getCheckInInterval(addictionLevel: number, daysSinceStart: number): number {
  // Day 1-3 for high addiction
  if (daysSinceStart <= 3 && addictionLevel >= 7) return 2 // every 2 hours
  
  // Day 4-7
  if (daysSinceStart <= 7) {
    if (addictionLevel >= 7) return 3
    if (addictionLevel >= 4) return 4
    return 6
  }
  
  // Day 8-21
  if (daysSinceStart <= 21) {
    if (addictionLevel >= 7) return 4
    return 6
  }
  
  // Day 22+
  return addictionLevel >= 7 ? 6 : 12
}
