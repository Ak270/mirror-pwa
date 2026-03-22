'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { HabitWithStatus, CheckIn } from '@/types'

interface RiskWarningBannerProps {
  habits: HabitWithStatus[]
  allCheckIns: Record<string, CheckIn[]>
}

export default function RiskWarningBanner({ habits, allCheckIns }: RiskWarningBannerProps) {
  const [riskHabit, setRiskHabit] = useState<{ habit: HabitWithStatus; slipRate: number; dayName: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const today = new Date()
    const dayOfWeek = (today.getDay() + 6) % 7 // Mon=0, Sun=6
    const dismissKey = `mirror-risk-warning-${today.toISOString().split('T')[0]}`
    
    if (localStorage.getItem(dismissKey)) {
      setDismissed(true)
      return
    }

    // Find habit with highest slip risk TODAY
    let maxRisk = 0
    let riskiestHabit: { habit: HabitWithStatus; slipRate: number; dayName: string } | null = null

    for (const habit of habits) {
      // Skip if already logged today
      if (habit.today_status !== null) continue
      
      // Skip if streak > 60 (high confidence habit)
      if (habit.current_streak > 60) continue

      const checkIns = allCheckIns[habit.id] || []
      
      // Get last 8 occurrences of this day of week
      const sameDayCheckIns = checkIns.filter(ci => {
        const ciDate = new Date(ci.date)
        const ciDayOfWeek = (ciDate.getDay() + 6) % 7
        return ciDayOfWeek === dayOfWeek
      }).slice(0, 8)

      if (sameDayCheckIns.length < 4) continue

      const slips = sameDayCheckIns.filter(ci => ci.status === 'honest_slip' || ci.status === 'skip').length
      const slipRate = (slips / sameDayCheckIns.length) * 100

      if (slipRate > 60 && slipRate > maxRisk) {
        maxRisk = slipRate
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        riskiestHabit = {
          habit,
          slipRate,
          dayName: dayNames[dayOfWeek],
        }
      }
    }

    setRiskHabit(riskiestHabit)
  }, [habits, allCheckIns])

  function handleDismiss() {
    const today = new Date()
    const dismissKey = `mirror-risk-warning-${today.toISOString().split('T')[0]}`
    localStorage.setItem(dismissKey, 'true')
    setDismissed(true)
  }

  if (dismissed || !riskHabit) return null

  const { habit, slipRate, dayName } = riskHabit

  return (
    <div className="mb-6 p-4 bg-amber-soft border-l-[3px] border-l-amber rounded-card animate-slide-up">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-brand text-sm mb-1">
            Watch out — {dayName}s are tough for {habit.name}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            You've slipped on {Math.round(slipRate)}% of recent {dayName}s. 
            Set a reminder or prep ahead to break the pattern.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-tertiary hover:text-brand transition-colors p-1 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
