export type CategoryId = 'break_free' | 'build_up' | 'rhythm' | 'mind_spirit'

export type CheckInStatus = 'done' | 'partial' | 'skip' | 'honest_slip'

export type HabitType = 'build' | 'break' | 'rhythm'

export type HabitFrequency = 'daily' | 'weekdays' | '3x_week' | '2x_week' | 'weekly' | 'custom'

export interface Category {
  id: CategoryId
  display_name: string
  icon_emoji: string
  tagline: string
  short_description: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  category_id: CategoryId
  habit_type: HabitType
  icon_emoji: string
  why_anchor: string | null
  goal_value: number | null
  goal_unit: string | null
  frequency: HabitFrequency
  reminder_time: string | null
  display_type: 'binary' | 'counter' | 'streak'
  is_vault: boolean
  archived: boolean
  // AI Companion fields
  check_in_interval_minutes: number | null
  daily_reduction_goal: number | null
  daily_reduction_unit: string | null
  reminder_interval_minutes: number | null
  reminder_start_time: string | null
  reminder_end_time: string | null
  daily_target: number | null
  daily_target_unit: string | null
  yesterday_baseline: number | null
  // Dopamine & Living Progress fields
  intent: 'start' | 'leave' | null
  addiction_level: number | null
  origin_anchor: string | null
  day1_letter: string | null
  day1_letter_delivered: boolean | null
  vulnerability_hour: number | null
  banked_grace_days: number | null
  grace_days_earned_total: number | null
  last_grace_day_earned_at: string | null
  created_at: string
  updated_at: string
}

export interface DailyQuantityLog {
  id: string
  user_id: string
  habit_id: string
  date: string
  entries: Array<{ time: string; amount: number; unit: string; groq_reaction?: string }>
  running_total: number
  daily_target: number | null
  goal_met: boolean
  created_at: string
  updated_at: string
}

export interface NotificationConversation {
  id: string
  user_id: string
  habit_id: string | null
  date: string
  sent_at: string
  groq_message: string | null
  user_action: string | null
  user_text_reply: string | null
  groq_follow_up: string | null
  running_total_at_time: number | null
  notification_type: string | null
  created_at: string
}

export interface CheckIn {
  id: string
  habit_id: string
  user_id: string
  date: string
  status: CheckInStatus
  note: string | null
  quantity: number | null
  quantifiable_value: number | null
  quantifiable_unit: string | null
  created_at: string
}

export interface HabitWithStatus extends Habit {
  today_status: CheckInStatus | null
  current_streak: number
  best_streak: number
  check_ins?: CheckIn[]
}

export interface Reflection {
  id: string
  user_id: string
  week_start: string
  prompt: string
  response: string
  mood_score: number | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  timezone: string
  onboarding_completed: boolean
  selected_categories: CategoryId[]
  day_start_time: string | null
  day_end_time: string | null
  energy_peak_time: string | null
  energy_dip_time: string | null
  created_at: string
}

export interface StreakData {
  current_streak: number
  best_streak: number
  last_check_in_date: string | null
}

export interface NotificationSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface CorrelationResult {
  habit_a_id: string
  habit_a_name: string
  habit_b_id: string
  habit_b_name: string
  correlation_coefficient: number
  sample_size: number
  is_significant: boolean
  confidence: 'weak' | 'low' | 'medium' | 'high'
  direction: 'positive' | 'negative' | 'none'
  rate_when_a_done: number
  rate_when_a_not_done: number
  insight_copy: string
}

export interface HeatmapDay {
  date: string
  status: CheckInStatus | null
}

export interface VaultHabit {
  id: string
  name: string
  category_id: CategoryId
  icon_emoji: string
  why_anchor: string | null
  frequency: HabitFrequency
  created_at: string
  check_ins: Array<{ date: string; status: CheckInStatus }>
}

export const CATEGORIES: Category[] = [
  {
    id: 'break_free',
    display_name: 'Break Free',
    icon_emoji: '🔓',
    tagline: 'Working on reducing something',
    short_description: 'Reduce habits that no longer serve you, privately and without judgment.',
  },
  {
    id: 'build_up',
    display_name: 'Build Up',
    icon_emoji: '🌱',
    tagline: 'Growing something new',
    short_description: 'Build consistency in things that matter to you.',
  },
  {
    id: 'rhythm',
    display_name: 'Rhythm',
    icon_emoji: '🌙',
    tagline: 'Living in better time',
    short_description: 'Align your body and routines with your natural clock.',
  },
  {
    id: 'mind_spirit',
    display_name: 'Mind & Spirit',
    icon_emoji: '🧘',
    tagline: 'Quiet daily intentions',
    short_description: 'Tend to your inner life with gentle daily practice.',
  },
]

export const CATEGORY_COLORS: Record<CategoryId, { bg: string; text: string; border: string }> = {
  break_free: { bg: 'bg-slip-light', text: 'text-slip', border: 'border-slip/30' },
  build_up: { bg: 'bg-success-light', text: 'text-success', border: 'border-success/30' },
  rhythm: { bg: 'bg-accent-light', text: 'text-brand', border: 'border-accent/30' },
  mind_spirit: { bg: 'bg-accent-light', text: 'text-brand', border: 'border-accent/30' },
}

export const CHECK_IN_LABELS: Record<CategoryId, Record<CheckInStatus, string>> = {
  build_up: {
    done: 'I showed up',
    partial: 'Part of it',
    skip: 'Skip today',
    honest_slip: 'Had a moment',
  },
  break_free: {
    done: 'I held on today',
    partial: 'Mostly held on',
    skip: 'Taking a break from tracking',
    honest_slip: 'I had a moment',
  },
  rhythm: {
    done: 'I showed up',
    partial: 'Part of it',
    skip: 'Skip today',
    honest_slip: 'Had a moment',
  },
  mind_spirit: {
    done: 'I showed up',
    partial: 'Part of it',
    skip: 'Skip today',
    honest_slip: 'Had a moment',
  },
}
