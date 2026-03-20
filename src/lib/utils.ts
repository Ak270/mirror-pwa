import { format, parseISO, startOfWeek } from 'date-fns'
import type { CategoryId, CheckInStatus, HabitFrequency } from '@/types'

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function getGreeting(firstName: string | null, timeOfDay: ReturnType<typeof getTimeOfDay>): string {
  const greetings = {
    morning: firstName ? `Good morning, ${firstName}.` : 'Good morning.',
    afternoon: firstName ? `Good afternoon, ${firstName}.` : 'Good afternoon.',
    evening: firstName ? `Good evening, ${firstName}.` : 'Good evening.',
    night: firstName ? `Good evening, ${firstName}.` : 'Good evening.',
  }
  return greetings[timeOfDay]
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE, d MMMM')
}

export function toISODateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function getCurrentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function formatStreakLabel(streak: number): string {
  if (streak === 0) return 'Start today'
  return `${streak} day${streak === 1 ? '' : 's'}`
}

export function getStatusColor(status: CheckInStatus | null): string {
  if (!status) return 'border-brand/15'
  switch (status) {
    case 'done': return 'border-success/20'
    case 'partial': return 'border-success/20'
    case 'skip': return 'border-gray-200'
    case 'honest_slip': return 'border-slip/25'
  }
}

export function getStatusBg(status: CheckInStatus | null): string {
  if (!status) return 'bg-white'
  switch (status) {
    case 'done': return 'bg-white'
    case 'partial': return 'bg-white'
    case 'skip': return 'bg-white'
    case 'honest_slip': return 'bg-white'
  }
}

export function getCategoryIcon(categoryId: CategoryId): string {
  const icons: Record<CategoryId, string> = {
    break_free: '🔓',
    build_up: '🌱',
    rhythm: '🌙',
    mind_spirit: '🧘',
  }
  return icons[categoryId]
}

export function getCategoryColor(categoryId: CategoryId): string {
  const colors: Record<CategoryId, string> = {
    break_free: '#FEF3DC',
    build_up: '#E0F5EF',
    rhythm: '#E8E7FF',
    mind_spirit: '#E8E7FF',
  }
  return colors[categoryId]
}

export function getFrequencyLabel(frequency: HabitFrequency): string {
  const labels: Record<HabitFrequency, string> = {
    daily: 'Every day',
    weekdays: 'Weekdays',
    '3x_week': '3× per week',
    '2x_week': '2× per week',
    weekly: 'Once a week',
    custom: 'Custom',
  }
  return labels[frequency]
}

export function sanitizeCopy(text: string): string {
  const forbidden = ['failed', 'missed', 'broke', 'bad day', 'wrong', 'lazy', 'excuses', 'relapsed', 'struggling', 'problem']
  let clean = text
  forbidden.forEach(word => {
    const regex = new RegExp(word, 'gi')
    clean = clean.replace(regex, '...')
  })
  return clean
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}
