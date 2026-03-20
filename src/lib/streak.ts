import { differenceInCalendarDays, parseISO, subDays, format } from 'date-fns'
import type { CheckIn, CheckInStatus, StreakData } from '@/types'

const FORGIVENESS_DAYS = 1

function isCompleted(status: CheckInStatus): boolean {
  return status === 'done' || status === 'partial'
}

export function calculateStreak(checkIns: CheckIn[], today: Date = new Date()): StreakData {
  if (!checkIns.length) {
    return { current_streak: 0, best_streak: 0, last_check_in_date: null }
  }

  const todayStr = format(today, 'yyyy-MM-dd')
  const sorted = [...checkIns]
    .filter(c => isCompleted(c.status))
    .sort((a, b) => b.date.localeCompare(a.date))

  if (!sorted.length) {
    return { current_streak: 0, best_streak: 0, last_check_in_date: null }
  }

  const lastDate = sorted[0].date
  const daysSinceLast = differenceInCalendarDays(parseISO(todayStr), parseISO(lastDate))

  // If last completed check-in is older than forgiveness window, streak is broken
  if (daysSinceLast > FORGIVENESS_DAYS + 1) {
    return { current_streak: 0, best_streak: calculateBestStreak(sorted), last_check_in_date: lastDate }
  }

  let current = 0
  let best = 0
  let run = 0
  let prevDate: string | null = null

  for (const checkIn of sorted) {
    if (!prevDate) {
      run = 1
      prevDate = checkIn.date
      continue
    }
    const diff = differenceInCalendarDays(parseISO(prevDate), parseISO(checkIn.date))
    if (diff <= FORGIVENESS_DAYS + 1) {
      run++
    } else {
      break
    }
    prevDate = checkIn.date
  }

  current = run
  best = calculateBestStreak(sorted)

  return { current_streak: current, best_streak: Math.max(best, current), last_check_in_date: lastDate }
}

function calculateBestStreak(sorted: CheckIn[]): number {
  let best = 0
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInCalendarDays(parseISO(sorted[i - 1].date), parseISO(sorted[i].date))
    if (diff <= FORGIVENESS_DAYS + 1) {
      run++
    } else {
      best = Math.max(best, run)
      run = 1
    }
  }
  return Math.max(best, run)
}

export function getStreakMilestone(streak: number): number | null {
  const milestones = [7, 14, 21, 30, 60, 90, 180, 365]
  return milestones.find(m => m === streak) ?? null
}

export function shouldShowForgiveness(streak: number, lastDate: string | null, today: Date = new Date()): boolean {
  if (!lastDate || streak === 0) return false
  const diff = differenceInCalendarDays(today, parseISO(lastDate))
  return diff === FORGIVENESS_DAYS
}
