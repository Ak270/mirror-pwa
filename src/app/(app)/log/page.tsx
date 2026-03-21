'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getHabitsWithTodayStatus, logCheckIn } from '@/lib/habits'
import CheckInButton from '@/components/habits/CheckInButton'
import type { HabitWithStatus, CheckInStatus } from '@/types'
import { getCategoryColor } from '@/lib/utils'
import { format } from 'date-fns'
import { Check } from 'lucide-react'

export default function LogPage() {
  const supabase = createClient()
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const loadHabits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const data = await getHabitsWithTodayStatus(supabase, user.id)
    setHabits(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadHabits() }, [loadHabits])

  async function handleStatusChange(
    habit: HabitWithStatus, 
    status: CheckInStatus,
    quantifiable?: { value: number; unit: string },
    slipNote?: string
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoggingId(habit.id)

    setHabits(prev => prev.map(h =>
      h.id === habit.id ? { ...h, today_status: status } : h
    ))

    await logCheckIn(supabase, user.id, habit.id, status, {
      quantifiable_value: quantifiable?.value ?? null,
      quantifiable_unit: quantifiable?.unit ?? null,
      slip_note: slipNote ?? null,
    })
    setLoggingId(null)

    // Static fallback copy
    const fallback =
      status === 'done' ? 'You showed up today.' :
      status === 'honest_slip' ? 'Noted. Yesterday is yesterday.' :
      status === 'partial' ? 'Something is better than nothing.' : null

    if (fallback) {
      setConfirmation(fallback)
      // Try to upgrade to AI copy in background
      fetch('/api/ai/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_name: habit.name,
          status,
          current_streak: habit.current_streak,
          category_id: habit.category_id,
        }),
      })
        .then(r => r.ok ? r.json() : null)
        .then((d: { headline?: string } | null) => {
          if (d?.headline) setConfirmation(d.headline)
        })
        .catch(() => {})
    }

    setTimeout(() => setConfirmation(null), 3500)
    await loadHabits()
  }

  const logged = habits.filter(h => h.today_status !== null).length
  const total = habits.length
  const today = format(new Date(), 'EEEE, d MMMM')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-xs text-muted uppercase tracking-widest">{today}</p>
        <h1 className="font-display text-brand font-light text-2xl mt-1">
          {total === 0
            ? 'No habits yet.'
            : logged === total
            ? 'All done today.'
            : `${total - logged} left to log.`}
        </h1>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>{logged}/{total} logged</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (logged / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Confirmation toast */}
      {confirmation && (
        <div className="mb-4 bg-success-light border border-success/30 text-success text-sm px-4 py-3 rounded-btn flex items-center gap-2 animate-slide-up">
          <Check className="w-4 h-4 flex-shrink-0" />
          {confirmation}
        </div>
      )}

      {/* Habits */}
      {total === 0 ? (
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-4 opacity-40">🪞</div>
          <p className="font-display text-brand text-xl font-light">Today is still open. No rush.</p>
          <p className="text-sm mt-2">Check in whenever you&apos;re ready.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map(habit => (
            <div
              key={habit.id}
              className={`mirror-card p-4 transition-all duration-200 ${
                habit.today_status === 'done' ? 'opacity-60' : ''
              }`}
            >
              {/* Habit header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: getCategoryColor(habit.category_id) }}
                >
                  {habit.icon_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{habit.name}</div>
                  {habit.why_anchor && (
                    <div className="text-xs text-muted truncate italic">{habit.why_anchor}</div>
                  )}
                </div>
                {habit.today_status === 'done' && (
                  <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-success" />
                  </div>
                )}
              </div>

              {/* Check-in buttons */}
              <CheckInButton
                habitId={habit.id}
                habitName={habit.name}
                categoryId={habit.category_id}
                currentStatus={habit.today_status}
                onStatusChange={(status) => handleStatusChange(habit, status)}
                isLoading={loggingId === habit.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
