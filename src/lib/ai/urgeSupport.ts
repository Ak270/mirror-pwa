import { createClient } from '@/lib/supabase/server'

/**
 * Calculate vulnerability hour for a leave habit based on historical slip patterns
 */
export async function calculateVulnerabilityHour(habitId: string): Promise<number | null> {
  const supabase = await createClient()
  
  const { data: slips } = await supabase
    .from('check_ins')
    .select('created_at')
    .eq('habit_id', habitId)
    .eq('status', 'honest_slip')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!slips || slips.length < 3) return null

  // Count slips by hour
  const hourCounts: Record<number, number> = {}
  slips.forEach(slip => {
    const hour = new Date(slip.created_at).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  // Find hour with most slips
  let maxHour = 0
  let maxCount = 0
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxHour = parseInt(hour)
    }
  })

  // Only return if we have at least 3 slips in that hour
  return maxCount >= 3 ? maxHour : null
}

/**
 * Check if current time is within vulnerability window (90 min before vulnerability hour)
 */
export function isInVulnerabilityWindow(vulnerabilityHour: number | null): boolean {
  if (vulnerabilityHour === null) return false
  
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  
  // Calculate 90 minutes before vulnerability hour
  let windowStartHour = vulnerabilityHour - 2
  let windowStartMinutes = 30
  
  if (windowStartHour < 0) {
    windowStartHour += 24
  }
  
  // Check if we're in the window
  if (currentHour === windowStartHour && currentMinutes >= windowStartMinutes) return true
  if (currentHour === vulnerabilityHour - 1) return true
  if (currentHour === vulnerabilityHour && currentMinutes < 30) return true
  
  return false
}

/**
 * Generate urge surfing notification message
 */
export async function generateUrgeSurfingMessage(habitName: string): Promise<string> {
  // Simple template - in production would call Groq
  const templates = [
    `The urge peaks in 90 seconds. Can you wait?`,
    `This feeling will pass. It always does.`,
    `90 seconds. That's all you need to ride this out.`,
    `The pull is strong right now. It won't last.`,
    `You've waited through this before. You can do it again.`
  ]
  
  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * Check if we should send origin anchor notification
 */
export async function shouldSendOriginAnchor(
  habitId: string,
  vulnerabilityHour: number | null,
  originAnchor: string | null
): Promise<boolean> {
  if (!originAnchor || !vulnerabilityHour) return false
  if (!isInVulnerabilityWindow(vulnerabilityHour)) return false
  
  const supabase = await createClient()
  
  // Check if we've sent this in the last 48 hours
  const { data: recentNotifications } = await supabase
    .from('notification_conversations')
    .select('created_at')
    .eq('habit_id', habitId)
    .like('message_text', '%You wrote this%')
    .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .limit(1)

  return !recentNotifications || recentNotifications.length === 0
}

/**
 * Get withdrawal curve support level based on addiction level and days since start
 */
export function getWithdrawalSupport(addictionLevel: number, daysSinceStart: number): {
  checkInFrequencyHours: number
  tone: string
  urgeSurfingEnabled: boolean
} {
  // Day 1-3 for high addiction
  if (daysSinceStart <= 3 && addictionLevel >= 7) {
    return {
      checkInFrequencyHours: 2,
      tone: 'physiological acknowledgment — "The body is adjusting. This discomfort is temporary and real."',
      urgeSurfingEnabled: true
    }
  }
  
  // Day 4-7
  if (daysSinceStart <= 7) {
    return {
      checkInFrequencyHours: addictionLevel >= 7 ? 3 : 4,
      tone: 'psychological acknowledgment — "The habit loop is still firing. That\'s normal. You don\'t have to follow it."',
      urgeSurfingEnabled: true
    }
  }
  
  // Day 8-21
  if (daysSinceStart <= 21) {
    return {
      checkInFrequencyHours: addictionLevel >= 7 ? 4 : 6,
      tone: 'identity shift — "You\'re becoming someone who..." language',
      urgeSurfingEnabled: addictionLevel >= 4
    }
  }
  
  // Day 22+
  return {
    checkInFrequencyHours: addictionLevel >= 7 ? 6 : 12,
    tone: 'witnessing + reinforcement of new identity',
    urgeSurfingEnabled: false
  }
}
