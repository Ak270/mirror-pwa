'use client'

import { useMemo } from 'react'
import { Calendar, RefreshCw, Link2 } from 'lucide-react'
import type { CheckIn } from '@/types'

interface FailurePatternInsightProps {
  habitName: string
  checkIns: CheckIn[]
  allHabits?: Array<{ id: string; name: string }>
  allCheckIns?: Record<string, CheckIn[]>
}

export default function FailurePatternInsight({ 
  habitName, 
  checkIns,
  allHabits = [],
  allCheckIns = {},
}: FailurePatternInsightProps) {
  const patterns = useMemo(() => {
    if (checkIns.length < 14) return null

    const slips = checkIns.filter(ci => ci.status === 'honest_slip' || ci.status === 'skip')
    if (slips.length === 0) return null

    // Day of week analysis
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const daySlips = new Array(7).fill(0)
    const dayTotals = new Array(7).fill(0)

    checkIns.forEach(ci => {
      const date = new Date(ci.date)
      const dayIndex = (date.getDay() + 6) % 7
      dayTotals[dayIndex]++
      if (ci.status === 'honest_slip' || ci.status === 'skip') {
        daySlips[dayIndex]++
      }
    })

    const dayRates = daySlips.map((slips, i) => ({
      day: dayNames[i],
      rate: dayTotals[i] > 0 ? (slips / dayTotals[i]) * 100 : 0,
      total: dayTotals[i],
    }))

    const worstDay = dayRates.reduce((max, curr) => curr.rate > max.rate ? curr : max)

    // Weekend vs weekday
    const weekendSlips = daySlips[5] + daySlips[6]
    const weekendTotal = dayTotals[5] + dayTotals[6]
    const weekdaySlips = daySlips.slice(0, 5).reduce((a, b) => a + b, 0)
    const weekdayTotal = dayTotals.slice(0, 5).reduce((a, b) => a + b, 0)

    const weekendRate = weekendTotal > 0 ? (weekendSlips / weekendTotal) * 100 : 0
    const weekdayRate = weekdayTotal > 0 ? (weekdaySlips / weekdayTotal) * 100 : 0

    // Recovery analysis
    let recoveryDays: number[] = []
    let currentGap = 0
    let inSlipStreak = false

    for (let i = checkIns.length - 1; i >= 0; i--) {
      const ci = checkIns[i]
      if (ci.status === 'honest_slip' || ci.status === 'skip') {
        if (!inSlipStreak && currentGap > 0) {
          recoveryDays.push(currentGap)
        }
        inSlipStreak = true
        currentGap = 0
      } else if (ci.status === 'done' || ci.status === 'partial') {
        inSlipStreak = false
        currentGap++
      }
    }

    const avgRecovery = recoveryDays.length > 0
      ? Math.round(recoveryDays.reduce((a, b) => a + b, 0) / recoveryDays.length)
      : 0

    // Cascade analysis (if other habits provided)
    let cascadeInsights: Array<{ habitName: string; probability: number }> = []
    
    if (allHabits.length > 0 && Object.keys(allCheckIns).length > 0) {
      const slipDates = new Set(slips.map(s => s.date))
      
      for (const otherHabit of allHabits) {
        const otherCIs = allCheckIns[otherHabit.id] || []
        if (otherCIs.length < 14) continue

        const otherSlipsOnSameDays = otherCIs.filter(ci => 
          slipDates.has(ci.date) && (ci.status === 'honest_slip' || ci.status === 'skip')
        ).length

        if (slipDates.size > 0) {
          const probability = (otherSlipsOnSameDays / slipDates.size) * 100
          if (probability > 40) {
            cascadeInsights.push({ habitName: otherHabit.name, probability })
          }
        }
      }

      cascadeInsights.sort((a, b) => b.probability - a.probability)
      cascadeInsights = cascadeInsights.slice(0, 2)
    }

    return {
      worstDay,
      weekendRate,
      weekdayRate,
      avgRecovery,
      cascadeInsights,
      totalSlips: slips.length,
      slipRate: (slips.length / checkIns.length) * 100,
    }
  }, [checkIns, allHabits, allCheckIns])

  if (!patterns || patterns.totalSlips === 0) return null

  return (
    <div className="mirror-card p-5 mt-5">
      <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">Failure patterns</p>
      
      <div className="space-y-4">
        {/* Worst day */}
        {patterns.worstDay.rate > 0 && (
          <div className="flex items-start gap-3 p-3 bg-surface rounded-btn border-l-2 border-amber">
            <Calendar className="w-4 h-4 text-amber flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand mb-1">Your hardest day</p>
              <p className="text-xs text-text-secondary">
                <strong className="text-brand">{patterns.worstDay.day}</strong> — {Math.round(patterns.worstDay.rate)}% slip rate
                {patterns.worstDay.rate > 50 && ' (consider setting a reminder for this day)'}
              </p>
            </div>
          </div>
        )}

        {/* Weekend vs weekday */}
        {Math.abs(patterns.weekendRate - patterns.weekdayRate) > 15 && (
          <div className="flex items-start gap-3 p-3 bg-surface rounded-btn border-l-2 border-accent">
            <Calendar className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand mb-1">Weekend vs weekday</p>
              <p className="text-xs text-text-secondary">
                {patterns.weekendRate > patterns.weekdayRate ? (
                  <>Weekends are harder ({Math.round(patterns.weekendRate)}% vs {Math.round(patterns.weekdayRate)}%)</>
                ) : (
                  <>Weekdays are harder ({Math.round(patterns.weekdayRate)}% vs {Math.round(patterns.weekendRate)}%)</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Recovery speed */}
        {patterns.avgRecovery > 0 && (
          <div className="flex items-start gap-3 p-3 bg-surface rounded-btn border-l-2 border-success">
            <RefreshCw className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand mb-1">Recovery speed</p>
              <p className="text-xs text-text-secondary">
                After a slip, you usually restart within <strong className="text-brand">{patterns.avgRecovery} day{patterns.avgRecovery !== 1 ? 's' : ''}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Cascade effect */}
        {patterns.cascadeInsights.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-surface rounded-btn border-l-2 border-streak-fire">
            <Link2 className="w-4 h-4 text-streak-fire flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand mb-1">Cascade alert</p>
              <p className="text-xs text-text-secondary">
                On days you miss {habitName}, you're {Math.round(patterns.cascadeInsights[0].probability)}% more likely to miss{' '}
                <strong className="text-brand">{patterns.cascadeInsights[0].habitName}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
