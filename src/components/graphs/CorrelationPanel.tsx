'use client'

import { useMemo } from 'react'
import type { Habit, CheckIn, CorrelationResult } from '@/types'
import { computeCorrelations } from '@/lib/correlation'

interface CorrelationPanelProps {
  habits: Habit[]
  allCheckIns: Record<string, CheckIn[]>
  focusHabitId: string
}

export default function CorrelationPanel({ habits, allCheckIns, focusHabitId }: CorrelationPanelProps) {
  const correlations = useMemo(() => {
    const focusCIs = allCheckIns[focusHabitId] ?? []
    if (focusCIs.length < 14) return []

    const results: CorrelationResult[] = []
    for (const other of habits) {
      if (other.id === focusHabitId) continue
      const otherCIs = allCheckIns[other.id] ?? []
      if (otherCIs.length < 14) continue

      const result = computeCorrelations(
        focusHabitId,
        habits.find(h => h.id === focusHabitId)?.name ?? '',
        focusCIs,
        other.id,
        other.name,
        otherCIs
      )
      // Show all correlations, even weak ones - we'll label them
      results.push(result)
    }

    return results.sort((a, b) => Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient))
  }, [habits, allCheckIns, focusHabitId])

  const focusCIs = allCheckIns[focusHabitId] ?? []

  if (focusCIs.length < 14) {
    return (
      <div className="mirror-card p-5">
        <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">Correlations</p>
        <div className="text-center py-4">
          <div className="text-3xl mb-2 opacity-30">· · ·</div>
          <p className="font-display text-brand text-base font-light">
            After 14 days, Mirror will start noticing patterns.
          </p>
          <p className="text-muted text-sm mt-1">
            {14 - focusCIs.length} more day{14 - focusCIs.length !== 1 ? 's' : ''} to go.
          </p>
          <div className="mt-3 bg-surface rounded-full h-2 overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (focusCIs.length / 14) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (correlations.length === 0) {
    return (
      <div className="mirror-card p-5">
        <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">Correlations</p>
        <p className="text-muted text-sm">Not enough overlapping data with other habits yet.</p>
      </div>
    )
  }

  const getConfidenceLabel = (conf: string) => {
    if (conf === 'high') return 'Strong link'
    if (conf === 'medium') return 'Emerging pattern'
    if (conf === 'low') return 'Early signal'
    return 'Weak correlation'
  }

  const getConfidenceColor = (conf: string) => {
    if (conf === 'high') return 'text-success'
    if (conf === 'medium') return 'text-accent'
    if (conf === 'low') return 'text-amber'
    return 'text-muted'
  }

  return (
    <div className="mirror-card p-5">
      <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">Correlations</p>
      <div className="space-y-4">
        {correlations.slice(0, 3).map(c => (
          <div key={c.habit_b_id} className="bg-surface rounded-btn p-4 border-l-2 border-accent">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-mono text-accent uppercase tracking-wide">
                Insight · Correlation
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wide ${getConfidenceColor(c.confidence)}`}>
                {getConfidenceLabel(c.confidence)}
              </span>
            </div>
            <p className="text-brand text-sm leading-relaxed mb-3">
              {c.insight_copy || `${c.habit_a_name} and ${c.habit_b_name} show a ${c.confidence} connection.`}
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted">
                <div className="w-6 h-1.5 bg-success rounded-full" />
                {c.habit_a_name} done → {c.habit_b_name}: {Math.round(c.rate_when_a_done)}%
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <div className="w-6 h-1.5 bg-slip rounded-full" />
                {c.habit_a_name} not done → {c.habit_b_name}: {Math.round(c.rate_when_a_not_done)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted mt-4">Based on {focusCIs.length} days of data. Private vault habits excluded.</p>
    </div>
  )
}
