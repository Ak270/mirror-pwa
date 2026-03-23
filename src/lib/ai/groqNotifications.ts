/**
 * Universal Groq Notification System
 * Based on mirror_groq_prompt_system.json
 * 
 * One universal prompt architecture that works for ANY habit.
 * Groq gets real user data injected. Output is always short, specific, never generic.
 */

import { getGroqClient } from './groq'
import type { Habit, CheckIn } from '@/types'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

const UNIVERSAL_SYSTEM_PROMPT = `You are Mirror — a silent companion, not a coach. You write push notification messages for people changing hard things. RULES: (1) Max 10 words. (2) Never cheer. No 'great job', 'let's go', 'you've got this', 'keep it up'. (3) Use the numbers you are given — they make it personal. (4) Match tone to intent: LEAVE habits = quiet, grounding, fact-based. START habits = forward, identity-building. (5) Never repeat an opening word used in recent_messages. (6) Output format: JSON only. { "title": "max 5 words", "body": "max 10 words" }`

interface NotificationData {
  habit_name: string
  intent: 'start' | 'leave'
  streak: number
  best_streak: number
  days_since_start: number
  addiction_level?: number
  
  quantifiable?: {
    today_count: number
    daily_goal: number
    yesterday_total?: number
    unit: string
    percent_complete: number
  }
  
  timing: {
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'
    hour: number
    day_of_week: string
    is_vulnerability_hour: boolean
  }
  
  history: {
    slip_count_last_7_days: number
    completion_rate_last_7_days: number
    yesterday_same_time_count?: number
    last_slip_days_ago?: number
    consecutive_good_days: number
    worst_day_of_week?: string
    recent_messages: string[]
  }
  
  personal?: {
    origin_anchor?: string
    day1_letter_available: boolean
    feeling_score_yesterday?: number
  }
}

type NotificationType = 
  | 'quantifiable_progress'
  | 'streak_motivation_start'
  | 'streak_motivation_leave'
  | 'close_to_best_streak'
  | 'after_slip'
  | 're_entry_after_absence'
  | 'morning_anchor_leave'
  | 'vulnerability_window'
  | 'end_of_day_incomplete'

async function callGroq(userMessage: string): Promise<{ title: string; body: string } | null> {
  try {
    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: UNIVERSAL_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.9, // High temp for variability
      max_tokens: 60,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed.title || !parsed.body) return null
    
    // Validate word counts
    const titleWords = String(parsed.title).split(' ').length
    const bodyWords = String(parsed.body).split(' ').length
    
    if (titleWords > 5 || bodyWords > 10) {
      console.warn('[Groq] Response exceeded word limits, regenerating...')
      return null // Will retry once
    }
    
    return { 
      title: String(parsed.title), 
      body: String(parsed.body) 
    }
  } catch (err) {
    console.error('[Groq] Call failed:', err)
    return null
  }
}

export async function generateNotification(
  type: NotificationType,
  data: NotificationData
): Promise<{ title: string; body: string } | null> {
  
  // 20% silence for start habits on successful check-ins (not slips, not leave habits)
  if (type === 'quantifiable_progress' && data.intent === 'start' && Math.random() < 0.2) {
    return null
  }
  
  const userMessage = buildPrompt(type, data)
  let result = await callGroq(userMessage)
  
  // Retry once if invalid
  if (!result) {
    result = await callGroq(userMessage)
  }
  
  // Check for repetition in recent messages
  if (result && data.history.recent_messages.includes(result.body)) {
    result = await callGroq(userMessage)
  }
  
  return result
}

function buildPrompt(type: NotificationType, data: NotificationData): string {
  const recentMsgs = data.history.recent_messages.join(', ')
  
  switch (type) {
    case 'quantifiable_progress':
      return `Habit: ${data.habit_name}. Goal today: ${data.quantifiable?.daily_goal} ${data.quantifiable?.unit}. Done so far: ${data.quantifiable?.today_count}. Yesterday total: ${data.quantifiable?.yesterday_total || 0}. Time: ${data.timing.time_of_day}. Recent notification bodies to avoid repeating: ${recentMsgs}. Percent complete: ${data.quantifiable?.percent_complete}%. Rules: if percent_complete < 30 → early momentum; if 30-60 → acknowledge what's done and what remains with the specific numbers; if 61-89 → proximity pull, name exact gap; if 90-99 → one word away energy; if 100 → witness completion. Compare to yesterday if different. No cheerleading. Output JSON only.`
    
    case 'streak_motivation_start':
      return `Habit: ${data.habit_name}. Intent: START. Current streak: ${data.streak} days. Best ever streak: ${data.best_streak} days. Time: ${data.timing.time_of_day}. Day of week: ${data.timing.day_of_week}. Consecutive good days: ${data.history.consecutive_good_days}. Completion rate last 7 days: ${data.history.completion_rate_last_7_days}%. Recent notification bodies to avoid: ${recentMsgs}. Rules: if streak = 0 → today is day 1, maximum forward energy, starting energy is highest it will ever be; if streak 1-6 → building identity, short and specific; if streak 7-29 → momentum language, reference the specific number; if streak 30-89 → identity solidifying, 'you are someone who...'; if streak 90+ → quiet witness, they've already proven it. If today is worst_day_of_week: acknowledge it. Never say 'keep it up'. Output JSON only.`
    
    case 'streak_motivation_leave':
      return `Habit: ${data.habit_name}. Intent: LEAVE. Current streak: ${data.streak} days. Addiction level: ${data.addiction_level}/10. Slip count last 7 days: ${data.history.slip_count_last_7_days}. Last slip: ${data.history.last_slip_days_ago} days ago. Time: ${data.timing.time_of_day}. Is vulnerability hour: ${data.timing.is_vulnerability_hour}. Consecutive good days: ${data.history.consecutive_good_days}. Recent notification bodies to avoid: ${recentMsgs}. Rules: if streak 0 and day just started → morning anchor, Day 1 energy; if streak 1-3 → acknowledge the hardest days physiologically (the body is adjusting); if streak 4-7 → habit loop psychology (the pull is the loop, not the need); if streak 8-21 → identity shift happening; if streak 22+ → quiet, earned, witnessing. If is_vulnerability_hour → urge surfing or presence, never pressure. If slip_count_last_7_days >= 3 → gently name the pattern without judgment. Output JSON only.`
    
    case 'close_to_best_streak':
      return `Habit: ${data.habit_name}. Intent: ${data.intent}. Current streak: ${data.streak}. Best streak ever: ${data.best_streak}. Time: ${data.timing.time_of_day}. Recent messages to avoid: ${recentMsgs}. If streak = best_streak - 1 → proximity to personal record energy. If streak = best_streak → they just tied their record. If streak = best_streak + 1 → new record, witness it specifically. Output JSON only.`
    
    case 'after_slip':
      return `Habit: ${data.habit_name}. Intent: ${data.intent}. Streak before slip: ${data.streak}. Addiction level if leave: ${data.addiction_level}. Quantifiable: today_count=${data.quantifiable?.today_count}, yesterday_total=${data.quantifiable?.yesterday_total}, unit=${data.quantifiable?.unit}. Slip count last 7 days: ${data.history.slip_count_last_7_days}. Time: ${data.timing.time_of_day}. Recent messages to avoid: ${recentMsgs}. Rules: NEVER use failed, disappointed, broke, again, weak. If quantifiable AND today_count < yesterday_total → LEAD with 'X vs Y yesterday — lower' before anything else. If leave habit AND streak >= 7 before slip → acknowledge what was built, not what was lost. If slip_count >= 3 this week → gently name the pattern, ask one open question. Always end on open future. Output JSON only.`
    
    case 'morning_anchor_leave':
      return `Habit: ${data.habit_name}. Intent: LEAVE. Streak: ${data.streak}. Addiction level: ${data.addiction_level}. origin_anchor: ${data.personal?.origin_anchor}. Time: morning. consecutive_good_days: ${data.history.consecutive_good_days}. Recent messages to avoid: ${recentMsgs}. Generate a morning anchor: short, grounding, identity-based. If origin_anchor exists: 50% chance use it as the body with title 'You wrote this.' If streak = 0 → Day 1 energy. If streak > 0 → witness what they've held. Never motivational. Just present. Output JSON only.`
    
    case 'vulnerability_window':
      return `Habit: ${data.habit_name}. Intent: LEAVE. Current hour: ${data.timing.hour}. Streak: ${data.streak}. Addiction level: ${data.addiction_level}. Recent messages to avoid: ${recentMsgs}. Generate a vulnerability window check-in: acknowledge the time without naming the craving. Options: (a) urge surfing — the pull peaks in 90 seconds; (b) quiet presence — just 'this hour'; (c) redirect — name a replacement behavior pattern if available. No pressure. No shame. Just presence. Output JSON only.`
    
    case 'end_of_day_incomplete':
      return `Habit: ${data.habit_name}. Intent: ${data.intent}. Streak: ${data.streak}. If quantifiable: today_count=${data.quantifiable?.today_count}, daily_goal=${data.quantifiable?.daily_goal}, unit=${data.quantifiable?.unit}, percent_complete=${data.quantifiable?.percent_complete}. Time: evening. Recent messages to avoid: ${recentMsgs}. Generate end-of-day message: gentle, not guilt-inducing. If quantifiable and > 50% done → proximity energy. If quantifiable and < 50% → ask how the day went, partial counts. If leave habit → check-in, not reminder. If start habit → one last chance energy. Output JSON only.`
    
    default:
      return `Habit: ${data.habit_name}. Generate a brief, warm notification. Max 10 words. Output JSON only.`
  }
}

// Helper to build notification data from database records
export async function buildNotificationData(
  habit: Habit,
  checkIns: CheckIn[],
  profile: { day_start_time: string; day_end_time: string }
): Promise<NotificationData> {
  const now = new Date()
  const hour = now.getHours()
  const today = now.toISOString().split('T')[0]
  
  // Calculate time of day
  const timeOfDay = 
    hour < 12 ? 'morning' :
    hour < 17 ? 'afternoon' :
    hour < 21 ? 'evening' : 'night'
  
  // Get today's check-ins
  const todayCheckIns = checkIns.filter(c => c.date === today)
  const todayQuantity = todayCheckIns.reduce((sum, c) => sum + (c.quantity || 0), 0)
  
  // Get yesterday's data
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = yesterday.toISOString().split('T')[0]
  const yesterdayCheckIns = checkIns.filter(c => c.date === yesterdayDate)
  const yesterdayQuantity = yesterdayCheckIns.reduce((sum, c) => sum + (c.quantity || 0), 0)
  
  // Calculate slip stats
  const last7Days = checkIns.filter(c => {
    const checkInDate = new Date(c.date)
    const daysAgo = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysAgo <= 7
  })
  const slipCount = last7Days.filter(c => c.status === 'honest_slip').length
  const completionRate = last7Days.length > 0 
    ? (last7Days.filter(c => c.status === 'done').length / last7Days.length) * 100 
    : 0
  
  // Find last slip
  const lastSlip = checkIns.find(c => c.status === 'honest_slip')
  const lastSlipDaysAgo = lastSlip 
    ? Math.floor((now.getTime() - new Date(lastSlip.date).getTime()) / (1000 * 60 * 60 * 24))
    : undefined
  
  // Calculate consecutive good days
  let consecutiveGoodDays = 0
  const sortedCheckIns = [...checkIns].sort((a, b) => b.date.localeCompare(a.date))
  for (const checkIn of sortedCheckIns) {
    if (checkIn.status === 'done') {
      consecutiveGoodDays++
    } else {
      break
    }
  }
  
  // Get recent notification messages (would come from notification_conversations table)
  const recentMessages: string[] = [] // TODO: Fetch from database
  
  return {
    habit_name: habit.name,
    intent: habit.intent || 'start',
    streak: habit.current_streak || 0,
    best_streak: habit.best_streak || 0,
    days_since_start: Math.floor((now.getTime() - new Date(habit.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    addiction_level: habit.addiction_level,
    
    quantifiable: habit.goal_value ? {
      today_count: todayQuantity,
      daily_goal: habit.goal_value,
      yesterday_total: yesterdayQuantity,
      unit: habit.goal_unit || 'times',
      percent_complete: (todayQuantity / habit.goal_value) * 100
    } : undefined,
    
    timing: {
      time_of_day: timeOfDay,
      hour,
      day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
      is_vulnerability_hour: habit.vulnerability_hour === hour
    },
    
    history: {
      slip_count_last_7_days: slipCount,
      completion_rate_last_7_days: completionRate,
      yesterday_same_time_count: yesterdayQuantity,
      last_slip_days_ago: lastSlipDaysAgo,
      consecutive_good_days: consecutiveGoodDays,
      worst_day_of_week: undefined, // TODO: Calculate from patterns
      recent_messages: recentMessages
    },
    
    personal: {
      origin_anchor: habit.origin_anchor,
      day1_letter_available: !!habit.day1_letter && !habit.day1_letter_delivered,
      feeling_score_yesterday: undefined // TODO: Fetch from daily_feelings
    }
  }
}
