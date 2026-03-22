/**
 * Device-based Day Boundary Detection
 * 
 * Detects user's actual wake/sleep times from device usage patterns
 * instead of using arbitrary midnight reset or manual settings.
 * 
 * This is more accurate because it adapts to the user's actual behavior.
 */

interface DeviceActivity {
  timestamp: Date
  type: 'screen_unlock' | 'app_open' | 'screen_lock'
}

interface DayBoundaries {
  dayStart: Date
  dayEnd: Date
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Analyzes device activity patterns to detect day boundaries
 * 
 * Strategy:
 * 1. Track first screen unlock of the day (likely wake time)
 * 2. Track last significant activity before long gap (likely sleep time)
 * 3. Use 7-day rolling average for stability
 * 4. Fall back to 6am-10pm if insufficient data
 */
export class DeviceDayBoundaryDetector {
  private activityLog: DeviceActivity[] = []
  private readonly STORAGE_KEY = 'mirror_device_activity'
  private readonly MAX_LOG_DAYS = 7
  private readonly SLEEP_GAP_THRESHOLD_HOURS = 4 // 4+ hours of inactivity = sleep

  constructor() {
    this.loadActivityLog()
  }

  /**
   * Log device activity event
   */
  logActivity(type: DeviceActivity['type']) {
    const activity: DeviceActivity = {
      timestamp: new Date(),
      type
    }

    this.activityLog.push(activity)
    this.pruneOldActivity()
    this.saveActivityLog()
  }

  /**
   * Get current day boundaries based on device usage patterns
   */
  getCurrentDayBoundaries(): DayBoundaries {
    const patterns = this.analyzePatterns()

    if (patterns.confidence === 'low') {
      // Fall back to sensible defaults
      return this.getDefaultBoundaries()
    }

    return patterns
  }

  /**
   * Analyze activity patterns to determine wake/sleep times
   */
  private analyzePatterns(): DayBoundaries {
    if (this.activityLog.length < 10) {
      return this.getDefaultBoundaries()
    }

    const dailyPatterns = this.groupByDay()
    const wakeTimesMs: number[] = []
    const sleepTimesMs: number[] = []

    for (const [date, activities] of Object.entries(dailyPatterns)) {
      if (activities.length < 3) continue // Need sufficient data

      // Find first activity of the day (wake time)
      const firstActivity = activities[0]
      const wakeTime = new Date(firstActivity.timestamp)
      wakeTimesMs.push(wakeTime.getHours() * 3600000 + wakeTime.getMinutes() * 60000)

      // Find last activity before long gap (sleep time)
      const sleepTime = this.detectSleepTime(activities)
      if (sleepTime) {
        sleepTimesMs.push(sleepTime.getHours() * 3600000 + sleepTime.getMinutes() * 60000)
      }
    }

    if (wakeTimesMs.length < 3 || sleepTimesMs.length < 3) {
      return this.getDefaultBoundaries()
    }

    // Calculate median wake and sleep times
    const medianWakeMs = this.median(wakeTimesMs)
    const medianSleepMs = this.median(sleepTimesMs)

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    dayStart.setTime(dayStart.getTime() + medianWakeMs)

    const dayEnd = new Date(now)
    dayEnd.setHours(0, 0, 0, 0)
    dayEnd.setTime(dayEnd.getTime() + medianSleepMs)

    // Determine confidence based on data consistency
    const wakeStdDev = this.standardDeviation(wakeTimesMs)
    const sleepStdDev = this.standardDeviation(sleepTimesMs)
    const avgStdDev = (wakeStdDev + sleepStdDev) / 2

    let confidence: 'high' | 'medium' | 'low'
    if (avgStdDev < 1800000) { // < 30 min std dev
      confidence = 'high'
    } else if (avgStdDev < 3600000) { // < 1 hour std dev
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    return { dayStart, dayEnd, confidence }
  }

  /**
   * Detect sleep time by finding last activity before long gap
   */
  private detectSleepTime(activities: DeviceActivity[]): Date | null {
    for (let i = activities.length - 1; i > 0; i--) {
      const current = activities[i]
      const next = activities[i - 1]
      
      const gapMs = current.timestamp.getTime() - next.timestamp.getTime()
      const gapHours = gapMs / (1000 * 60 * 60)

      if (gapHours >= this.SLEEP_GAP_THRESHOLD_HOURS) {
        return next.timestamp
      }
    }

    return activities[activities.length - 1]?.timestamp || null
  }

  /**
   * Group activities by calendar day
   */
  private groupByDay(): Record<string, DeviceActivity[]> {
    const grouped: Record<string, DeviceActivity[]> = {}

    for (const activity of this.activityLog) {
      const dateKey = activity.timestamp.toISOString().split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(activity)
    }

    // Sort each day's activities by timestamp
    for (const dateKey in grouped) {
      grouped[dateKey].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }

    return grouped
  }

  /**
   * Get default boundaries when insufficient data
   */
  private getDefaultBoundaries(): DayBoundaries {
    const now = new Date()
    
    const dayStart = new Date(now)
    dayStart.setHours(6, 0, 0, 0)

    const dayEnd = new Date(now)
    dayEnd.setHours(22, 0, 0, 0)

    return {
      dayStart,
      dayEnd,
      confidence: 'low'
    }
  }

  /**
   * Remove activity older than MAX_LOG_DAYS
   */
  private pruneOldActivity() {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - this.MAX_LOG_DAYS)

    this.activityLog = this.activityLog.filter(
      activity => activity.timestamp >= cutoff
    )
  }

  /**
   * Save activity log to localStorage
   */
  private saveActivityLog() {
    if (typeof window === 'undefined') return

    try {
      const serialized = JSON.stringify(
        this.activityLog.map(a => ({
          timestamp: a.timestamp.toISOString(),
          type: a.type
        }))
      )
      localStorage.setItem(this.STORAGE_KEY, serialized)
    } catch (error) {
      console.error('Failed to save activity log:', error)
    }
  }

  /**
   * Load activity log from localStorage
   */
  private loadActivityLog() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return

      const parsed = JSON.parse(stored)
      this.activityLog = parsed.map((a: any) => ({
        timestamp: new Date(a.timestamp),
        type: a.type
      }))

      this.pruneOldActivity()
    } catch (error) {
      console.error('Failed to load activity log:', error)
      this.activityLog = []
    }
  }

  /**
   * Calculate median of array
   */
  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(variance)
  }
}

// Singleton instance
let detectorInstance: DeviceDayBoundaryDetector | null = null

export function getDeviceDayBoundaryDetector(): DeviceDayBoundaryDetector {
  if (!detectorInstance) {
    detectorInstance = new DeviceDayBoundaryDetector()
  }
  return detectorInstance
}

/**
 * Hook to track app usage automatically
 * Call this in your root layout or app component
 */
export function useDeviceActivityTracking() {
  if (typeof window === 'undefined') return

  const detector = getDeviceDayBoundaryDetector()

  // Log app open
  detector.logActivity('app_open')

  // Track visibility changes
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      detector.logActivity('screen_unlock')
    } else {
      detector.logActivity('screen_lock')
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}
