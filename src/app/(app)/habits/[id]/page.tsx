'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getHabit, getHabitCheckIns, logCheckIn, archiveHabit } from '@/lib/habits'
import { calculateStreak, shouldShowForgiveness } from '@/lib/streak'
import type { Habit, CheckIn, CheckInStatus } from '@/types'
import HeatmapCalendar from '@/components/graphs/HeatmapCalendar'
import QuantifiableChart from '@/components/graphs/QuantifiableChart'
import CheckInButton from '@/components/habits/CheckInButton'
import { getCategoryColor, formatStreakLabel, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Edit2, Archive } from 'lucide-react'
import { format } from 'date-fns'

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [habit, setHabit] = useState<Habit | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayStatus = checkIns.find(c => c.date === today)?.status ?? null
  const streak = calculateStreak(checkIns)

  const loadData = useCallback(async () => {
    const [h, cis] = await Promise.all([
      getHabit(supabase, id),
      getHabitCheckIns(supabase, id),
    ])
    setHabit(h)
    setCheckIns(cis)
    setLoading(false)
  }, [supabase, id])

  useEffect(() => { loadData() }, [loadData])

  async function handleStatusChange(status: CheckInStatus) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !habit) return
    setLogging(true)
    await logCheckIn(supabase, user.id, habit.id, status)
    await loadData()
    setLogging(false)
  }

  async function handleArchive() {
    if (!habit || !confirm('Archive this habit?')) return
    await archiveHabit(supabase, habit.id)
    router.push('/habits')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-12 text-center">
        <p className="text-muted">Habit not found.</p>
        <Link href="/habits" className="text-accent text-sm mt-2 inline-block">← Back</Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/habits" className="p-2 rounded-btn text-muted hover:text-brand hover:bg-surface transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: getCategoryColor(habit.category_id) }}
            >
              {habit.icon_emoji}
            </div>
            <h1 className="font-semibold text-brand text-lg truncate">{habit.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/habits/${id}/edit`} className="p-2 rounded-btn text-muted hover:text-brand hover:bg-surface transition-colors">
            <Edit2 className="w-4 h-4" />
          </Link>
          <button onClick={handleArchive} className="p-2 rounded-btn text-muted hover:text-slip transition-colors">
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Streak stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="mirror-card p-4">
          <p className="font-mono text-xs text-muted uppercase tracking-widest mb-1">Current streak</p>
          <p className="text-2xl font-semibold text-brand">
            {streak.current_streak > 0 ? `${streak.current_streak >= 7 ? '🔥 ' : ''}${streak.current_streak}` : '—'}
          </p>
          {streak.current_streak > 0 && (
            <p className="text-xs text-muted mt-0.5">{formatStreakLabel(streak.current_streak)}</p>
          )}
        </div>
        <div className="mirror-card p-4">
          <p className="font-mono text-xs text-muted uppercase tracking-widest mb-1">Best streak</p>
          <p className="text-2xl font-semibold text-brand">{streak.best_streak || '—'}</p>
          {streak.best_streak > 0 && (
            <p className="text-xs text-muted mt-0.5">{formatStreakLabel(streak.best_streak)}</p>
          )}
        </div>
      </div>

      {/* Forgiveness mode notice */}
      {shouldShowForgiveness(streak.current_streak, streak.last_check_in_date) && !todayStatus && (
        <div className="mb-4 px-4 py-3 bg-slip-light border border-slip/20 rounded-card">
          <p className="text-slip text-sm font-medium">Tonight is still today.</p>
          <p className="text-slip/70 text-xs mt-0.5">Your streak is safe — log before midnight.</p>
        </div>
      )}

      {/* Today's check-in */}
      <div className="mirror-card p-4 mb-6">
        <p className="font-mono text-xs text-muted uppercase tracking-widest mb-3">Today</p>
        <CheckInButton
          habitId={habit.id}
          habitName={habit.name}
          categoryId={habit.category_id}
          currentStatus={todayStatus}
          onStatusChange={handleStatusChange}
          isLoading={logging}
        />
      </div>

      {/* Quantifiable Progress Chart */}
      <QuantifiableChart checkIns={checkIns} habitName={habit.name} />

      {/* Heatmap */}
      <div className="mirror-card p-4 mb-6">
        <p className="font-mono text-xs text-muted uppercase tracking-widest mb-4">Your pattern</p>
        <HeatmapCalendar checkIns={checkIns} />
      </div>

      {/* Recent history */}
      {checkIns.length > 0 && (
        <div className="mirror-card p-4">
          <p className="font-mono text-xs text-muted uppercase tracking-widest mb-3">Recent log</p>
          <div className="space-y-2">
            {checkIns.slice(0, 10).map(ci => (
              <div key={ci.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted">{formatDate(ci.date)}</span>
                <span className={`chip text-xs ${
                  ci.status === 'done' ? 'chip-success' :
                  ci.status === 'honest_slip' ? 'chip-slip' :
                  ci.status === 'partial' ? 'chip-brand' : 'chip-skip'
                }`}>
                  {ci.status === 'honest_slip' ? 'honest slip' : ci.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
