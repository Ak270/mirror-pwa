'use client'

import { useEffect, useState } from 'react'

interface CompoundInterestViewProps {
  habitName: string
  habitType: 'start' | 'leave'
  currentStreak: number
  totalLogged: number
  createdAt: string
  dailyAverage?: number
  dailyUnit?: string
}

export default function CompoundInterestView({
  habitName,
  habitType,
  currentStreak,
  totalLogged,
  createdAt,
  dailyAverage,
  dailyUnit
}: CompoundInterestViewProps) {
  const [meaningfulInsight, setMeaningfulInsight] = useState<string>('')

  useEffect(() => {
    // Calculate compound metrics
    const created = new Date(createdAt)
    const now = new Date()
    const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    const currentDayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))

    let projectedYearly = 0
    if (daysSinceCreation > 0) {
      projectedYearly = Math.floor((totalLogged / daysSinceCreation) * 365)
    }

    // Generate insight based on habit type
    if (habitType === 'leave' && dailyAverage && dailyUnit) {
      const totalAvoided = currentStreak * dailyAverage
      setMeaningfulInsight(`${currentStreak} days without ${habitName}. Approximately ${Math.floor(totalAvoided)} ${dailyUnit} not consumed.`)
    } else {
      setMeaningfulInsight(`${totalLogged} times you showed up for ${habitName}. At this pace: ${projectedYearly} this year.`)
    }
  }, [habitName, habitType, currentStreak, totalLogged, createdAt, dailyAverage, dailyUnit])

  return (
    <div className="mirror-card p-5 mb-6">
      <h3 className="text-sm font-semibold text-brand mb-4">What you're building</h3>
      
      <div className="space-y-4">
        {/* Primary metric */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-brand font-mono">{totalLogged}</span>
          <span className="text-sm text-muted">
            {habitType === 'leave' ? 'days free' : 'times logged'}
          </span>
        </div>

        {/* Meaningful insight */}
        <p className="text-sm text-brand/80 leading-relaxed">
          {meaningfulInsight}
        </p>

        {/* Streak visualization */}
        {currentStreak >= 7 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted uppercase tracking-wider">Current run</span>
              <span className="text-sm font-semibold text-brand">Day {currentStreak}</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand to-accent transition-all duration-500"
                style={{ width: `${Math.min(100, (currentStreak / 100) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Time invested for start habits */}
        {habitType === 'start' && totalLogged >= 10 && (
          <div className="text-xs text-muted italic">
            Each time you showed up, you chose this over something else. That's {totalLogged} decisions.
          </div>
        )}

        {/* Freedom earned for leave habits */}
        {habitType === 'leave' && currentStreak >= 14 && (
          <div className="text-xs text-muted italic">
            Two weeks ago, this controlled your day. Now you control it.
          </div>
        )}
      </div>
    </div>
  )
}
