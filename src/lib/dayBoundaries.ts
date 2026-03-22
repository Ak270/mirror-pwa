/**
 * Day boundaries - Replace midnight reset with user-defined day start/end times
 * 
 * This respects personal schedules. Someone who goes to bed at 2am hasn't "missed"
 * a habit at 12:01am. Their day doesn't end until their day_start_time.
 */

import { parseISO, format, addDays, subDays } from 'date-fns'

export interface DayBoundaries {
  dayStartTime: string // HH:mm format, e.g. "06:00"
  dayEndTime: string // HH:mm format, e.g. "22:00"
}

/**
 * Get the user's "today" date based on their day_start_time
 * If current time is before day_start_time, "today" is actually yesterday's date
 */
export function getUserToday(dayStartTime: string = '06:00'): string {
  const now = new Date()
  const [startHour, startMinute] = dayStartTime.split(':').map(Number)
  
  const todayStart = new Date(now)
  todayStart.setHours(startHour, startMinute, 0, 0)
  
  // If current time is before day start, we're still in "yesterday"
  if (now < todayStart) {
    return format(subDays(now, 1), 'yyyy-MM-dd')
  }
  
  return format(now, 'yyyy-MM-dd')
}

/**
 * Get the user's "yesterday" date based on their day_start_time
 */
export function getUserYesterday(dayStartTime: string = '06:00'): string {
  const today = getUserToday(dayStartTime)
  return format(subDays(parseISO(today), 1), 'yyyy-MM-dd')
}

/**
 * Check if a given date is "today" for the user
 */
export function isUserToday(date: string, dayStartTime: string = '06:00'): boolean {
  return date === getUserToday(dayStartTime)
}

/**
 * Check if a given date is "yesterday" for the user
 */
export function isUserYesterday(date: string, dayStartTime: string = '06:00'): boolean {
  return date === getUserYesterday(dayStartTime)
}

/**
 * Get the start timestamp of the user's day
 */
export function getUserDayStart(dayStartTime: string = '06:00'): Date {
  const today = getUserToday(dayStartTime)
  const [hour, minute] = dayStartTime.split(':').map(Number)
  
  const dayStart = parseISO(today)
  dayStart.setHours(hour, minute, 0, 0)
  
  return dayStart
}

/**
 * Get the end timestamp of the user's day
 */
export function getUserDayEnd(dayStartTime: string = '06:00', dayEndTime: string = '22:00'): Date {
  const today = getUserToday(dayStartTime)
  const [hour, minute] = dayEndTime.split(':').map(Number)
  
  const dayEnd = parseISO(today)
  dayEnd.setHours(hour, minute, 0, 0)
  
  // If day end is before day start (e.g., day ends at 2am, starts at 6am)
  // then day end is actually tomorrow
  const [startHour] = dayStartTime.split(':').map(Number)
  if (hour < startHour) {
    return addDays(dayEnd, 1)
  }
  
  return dayEnd
}

/**
 * Calculate streak with user day boundaries
 * A streak breaks only if two consecutive "user days" have no log
 */
export function calculateStreakWithBoundaries(
  checkIns: Array<{ date: string }>,
  dayStartTime: string = '06:00'
): { currentStreak: number; bestStreak: number } {
  if (checkIns.length === 0) return { currentStreak: 0, bestStreak: 0 }

  const sortedCheckIns = [...checkIns].sort((a, b) => b.date.localeCompare(a.date))
  const userToday = getUserToday(dayStartTime)
  
  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0
  let expectedDate = userToday

  for (const checkIn of sortedCheckIns) {
    if (checkIn.date === expectedDate) {
      currentStreak++
      tempStreak++
      bestStreak = Math.max(bestStreak, tempStreak)
      expectedDate = format(subDays(parseISO(expectedDate), 1), 'yyyy-MM-dd')
    } else {
      // Gap detected - reset current streak but continue for best streak
      if (currentStreak > 0) {
        currentStreak = 0
      }
      tempStreak = 1
      expectedDate = format(subDays(parseISO(checkIn.date), 1), 'yyyy-MM-dd')
    }
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) }
}

/**
 * Get time of day label based on user's day boundaries
 */
export function getTimeOfDayLabel(
  dayStartTime: string = '06:00',
  dayEndTime: string = '22:00'
): 'morning' | 'afternoon' | 'evening' {
  const now = new Date()
  const currentHour = now.getHours()
  const [startHour] = dayStartTime.split(':').map(Number)
  const [endHour] = dayEndTime.split(':').map(Number)
  
  const morningEnd = startHour + 5 // 5 hours after day start
  const afternoonEnd = startHour + 11 // 11 hours after day start
  
  if (currentHour >= startHour && currentHour < morningEnd) return 'morning'
  if (currentHour >= morningEnd && currentHour < afternoonEnd) return 'afternoon'
  return 'evening'
}
