'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getHabitsWithTodayStatus, logCheckIn } from '@/lib/habits'
import { getTimeOfDay, getGreeting, formatDate } from '@/lib/utils'
import CompletionRing from '@/components/dashboard/CompletionRing'
import HabitCard from '@/components/habits/HabitCard'
import type { HabitWithStatus, CheckInStatus, Profile } from '@/types'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [dateLabel, setDateLabel] = useState('')
  const [insight, setInsight] = useState<string | null>(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if user is anonymous and calculate trial days
    setIsAnonymous(user.is_anonymous || false)
    if (user.is_anonymous) {
      const createdAt = localStorage.getItem('mirror_anon_created_at')
      if (createdAt) {
        const created = new Date(createdAt)
        const now = new Date()
        const daysPassed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        const daysLeft = Math.max(0, 7 - daysPassed)
        setTrialDaysLeft(daysLeft)
      }
    }

    const [profileData, habitsData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single().then(r => r.data),
      getHabitsWithTodayStatus(supabase, user.id),
    ])

    setProfile(profileData)
    setHabits(habitsData)

    const tod = getTimeOfDay()
    const firstName = profileData?.display_name?.split(' ')[0] ?? null
    setGreeting(getGreeting(firstName, tod))
    setDateLabel(formatDate(new Date()))
    setLoading(false)

    // Fetch AI insight in background after data loads
    fetch('/api/ai/insight')
      .then(r => r.ok ? r.json() : null)
      .then((d: { insight?: string } | null) => { if (d?.insight) setInsight(d.insight) })
      .catch(() => {})
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function handleStatusChange(habitId: string, status: CheckInStatus) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setHabits(prev => prev.map(h =>
      h.id === habitId ? { ...h, today_status: status } : h
    ))

    await logCheckIn(supabase, user.id, habitId, status)
    await loadData()
  }

  const logged = habits.filter(h => h.today_status !== null).length
  const total = habits.length
  const allDone = total > 0 && logged === total

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      {/* Greeting */}
      <div className="mb-8">
        <p className="font-mono text-xs text-muted uppercase tracking-widest mb-2">{dateLabel}</p>
        <h1 className="font-display text-brand font-light text-3xl tracking-tight">
          {greeting}
        </h1>
        {allDone && (
          <p className="text-success text-sm mt-2 font-medium">
            Everything logged today.
          </p>
        )}
      </div>

      {/* Trial banner for anonymous users */}
      {isAnonymous && trialDaysLeft !== null && (
        <div className="mb-6 p-4 bg-accent-light border border-accent/30 rounded-card">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand mb-1">
                {trialDaysLeft > 0 
                  ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in trial`
                  : 'Trial ended'}
              </p>
              <p className="text-xs text-muted mb-3">
                {trialDaysLeft > 0
                  ? 'Create an account to keep your data forever. No credit card needed.'
                  : 'Create an account now to keep all your progress.'}
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-brand transition-colors"
              >
                Upgrade account →
              </Link>
            </div>
            {trialDaysLeft > 0 && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-lg font-bold text-accent">{trialDaysLeft}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion ring + stats */}
      {total > 0 && (
        <div className="mirror-card p-5 flex items-center gap-5 mb-6">
          <CompletionRing logged={logged} total={total} />
          <div>
            <p className="text-brand font-semibold">
              {logged === 0
                ? 'Today is still open.'
                : logged === total
                ? 'You showed up today.'
                : `${total - logged} habit${total - logged !== 1 ? 's' : ''} remaining.`}
            </p>
            <p className="text-muted text-sm mt-1">No rush.</p>
          </div>
        </div>
      )}

      {/* AI insight */}
      {insight && (
        <div className="mb-5 px-4 py-3 bg-surface border border-accent/20 rounded-card">
          <p className="font-mono text-[10px] text-accent uppercase tracking-widest mb-1">Mirror</p>
          <p className="font-display text-brand text-sm font-light leading-relaxed italic">
            &ldquo;{insight}&rdquo;
          </p>
        </div>
      )}

      {/* Habit cards */}
      {total === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-40">🪞</div>
          <h2 className="font-display text-brand text-xl font-light mb-2">
            What do you want to work on?
          </h2>
          <p className="text-muted text-sm mb-6">There is no wrong answer.</p>
          <Link href="/habits/new" className="mirror-btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add your first habit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onStatusChange={handleStatusChange}
            />
          ))}

          <Link
            href="/habits/new"
            className="flex items-center justify-center gap-2 text-muted text-sm py-4 border border-dashed border-brand/20 rounded-card hover:border-accent hover:text-brand transition-colors duration-150 mt-2"
          >
            <Plus className="w-4 h-4" />
            Add habit
          </Link>
        </div>
      )}

      {/* Reflect shortcut — mobile only (sidebar handles desktop) */}
      {total > 0 && (
        <Link
          href="/reflect"
          className="lg:hidden mt-6 flex items-center gap-3 px-4 py-3.5 border border-brand/10 rounded-card hover:border-accent hover:bg-surface transition-all duration-150 group"
        >
          <BookOpen className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand">Weekly reflection</p>
            <p className="text-xs text-muted">Two minutes for yourself.</p>
          </div>
          <span className="text-xs text-muted group-hover:text-accent transition-colors">→</span>
        </Link>
      )}
    </div>
  )
}
