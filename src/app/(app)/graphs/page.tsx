'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getHabits, getHabitCheckIns } from '@/lib/habits'
import type { Habit, CheckIn } from '@/types'
import HeatmapCalendar from '@/components/graphs/HeatmapCalendar'
import TrendLine from '@/components/graphs/TrendLine'
import CorrelationPanel from '@/components/graphs/CorrelationPanel'
import FailurePatternInsight from '@/components/graphs/FailurePatternInsight'
import { getCategoryColor } from '@/lib/utils'

export default function GraphsPage() {
  const supabase = createClient()
  const [habits, setHabits] = useState<Habit[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [allCheckIns, setAllCheckIns] = useState<Record<string, CheckIn[]>>({})
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const habitsData = await getHabits(supabase, user.id)
    setHabits(habitsData)

    if (habitsData.length > 0) {
      const firstId = habitsData[0].id
      setSelectedId(firstId)

      const ciMap: Record<string, CheckIn[]> = {}
      await Promise.all(habitsData.map(async (h) => {
        ciMap[h.id] = await getHabitCheckIns(supabase, h.id)
      }))
      setAllCheckIns(ciMap)
      setCheckIns(ciMap[firstId] ?? [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  function selectHabit(id: string) {
    setSelectedId(id)
    setCheckIns(allCheckIns[id] ?? [])
  }

  const selected = habits.find(h => h.id === selectedId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-12 text-center">
        <div className="text-5xl mb-4 opacity-40">· · ·</div>
        <p className="font-display text-brand text-xl font-light mb-2">No habits to graph yet.</p>
        <p className="text-muted text-sm">Start tracking to see your patterns emerge.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">
      <div className="mb-6">
        <h1 className="font-display text-brand font-light text-3xl mb-1">Your patterns</h1>
        <p className="text-text-secondary text-sm">
          {(() => {
            const totalCheckIns = Object.values(allCheckIns).reduce((sum, cis) => sum + cis.length, 0)
            const totalHabits = habits.length
            const completionRate = totalCheckIns > 0 
              ? Math.round((Object.values(allCheckIns).reduce((sum, cis) => 
                  sum + cis.filter(ci => ci.status === 'done' || ci.status === 'partial').length, 0
                ) / totalCheckIns) * 100)
              : 0
            return `${completionRate}% across ${totalHabits} habit${totalHabits !== 1 ? 's' : ''} this period`
          })()}
        </p>
      </div>

      {/* Habit selector - Icon only to prevent truncation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => selectHabit(h.id)}
            title={h.name}
            className={`flex items-center justify-center w-11 h-9 rounded-btn border text-lg flex-shrink-0 transition-all duration-150 ${
              selectedId === h.id
                ? 'border-brand bg-brand text-white'
                : 'border-border bg-surface text-muted hover:border-accent hover:bg-accent-light'
            }`}
          >
            <span className={selectedId === h.id ? 'opacity-100' : 'opacity-70'}>{h.icon_emoji}</span>
          </button>
        ))}
      </div>

      {/* Selected habit name */}
      {selected && (
        <h2 className="font-display text-brand text-xl mb-6">{selected.name}</h2>
      )}

      {selected && (
        <div className="space-y-5">
          {/* Heatmap */}
          <div className="mirror-card p-5">
            <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">Calendar heatmap</p>
            <HeatmapCalendar checkIns={checkIns} months={6} />
          </div>

          {/* Trend line */}
          {checkIns.length >= 5 && (
            <div className="mirror-card p-5">
              <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">Completion trend</p>
              <TrendLine checkIns={checkIns} habitName={selected.name} />
            </div>
          )}

          {/* Frequency by day of week */}
          {checkIns.length >= 7 && (
            <DayOfWeekChart checkIns={checkIns} />
          )}

          {/* Failure pattern insights */}
          {checkIns.length >= 14 && (
            <FailurePatternInsight 
              habitId={selected.id}
              habitName={selected.name}
              checkIns={checkIns}
              allHabits={habits.map(h => ({ id: h.id, name: h.name }))}
              allCheckIns={allCheckIns}
            />
          )}

          {/* Correlations */}
          {habits.length >= 2 && (
            <div className="mt-6">
              {/* Check if user has enough data (30+ days) */}
              {(() => {
                const totalDays = Object.values(allCheckIns).reduce((sum, cis) => sum + cis.length, 0)
                const hasEnoughData = totalDays >= 30
                
                if (hasEnoughData) {
                  return <CorrelationPanel habits={habits} allCheckIns={allCheckIns} focusHabitId={selectedId!} />
                } else {
                  // Correlation teaser
                  const daysLeft = Math.max(0, 30 - totalDays)
                  return (
                    <div className="mirror-card p-5 bg-accent-light border border-accent/20">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🔗</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-brand text-sm mb-1">
                            Correlation Insights
                          </h3>
                          <p className="text-xs text-muted mb-3">
                            Keep tracking for {daysLeft} more day{daysLeft !== 1 ? 's' : ''} to unlock habit correlation insights. 
                            Mirror will show you which habits influence each other.
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-accent h-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (totalDays / 30) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-muted">
                              {totalDays}/30
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DayOfWeekChart({ checkIns }: { checkIns: CheckIn[] }) {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const counts = DAYS.map((_, i) => {
    const dayCheckIns = checkIns.filter(ci => {
      const d = new Date(ci.date)
      return ((d.getDay() + 6) % 7) === i
    })
    const done = dayCheckIns.filter(c => c.status === 'done' || c.status === 'partial').length
    const total = dayCheckIns.length
    return { rate: total > 0 ? (done / total) * 100 : 0, total }
  })

  const max = Math.max(...counts.map(c => c.rate), 1)
  const bestDay = counts.indexOf(counts.reduce((a, b) => a.rate > b.rate ? a : b))

  return (
    <div className="mirror-card p-5">
      <p className="font-mono text-xs text-accent uppercase tracking-widest mb-4">Day of week</p>
      <div className="flex items-end gap-2 h-16">
        {counts.map((c, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm transition-all duration-500"
              style={{
                height: `${Math.max((c.rate / max) * 52, 2)}px`,
                background: i === bestDay ? '#6C63FF' : c.rate > 0 ? '#9B93E8' : '#F3F4F6',
              }}
            />
            <span className={`text-[9px] font-mono ${i === bestDay ? 'text-brand font-semibold' : 'text-muted'}`}>
              {DAYS[i]}
            </span>
          </div>
        ))}
      </div>
      {max > 0 && (
        <p className="text-xs text-muted mt-3">
          Your strongest day is <strong className="text-brand">{DAYS[bestDay]}</strong> at {Math.round(counts[bestDay].rate)}%.
        </p>
      )}
    </div>
  )
}
