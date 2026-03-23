'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getHabitsWithTodayStatus, logCheckIn } from '@/lib/habits'
import { getTimeOfDay, getGreeting, formatDate } from '@/lib/utils'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import LivingProgressRing from '@/components/dashboard/LivingProgressRing'
import ReentryBanner from '@/components/dashboard/ReentryBanner'
import TimeBasedProgressRing from '@/components/dashboard/TimeBasedProgressRing'
import HabitCard from '@/components/habits/HabitCard'
import QuantifiableHabitCard from '@/components/habits/QuantifiableHabitCard'
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
  const [livingInsight, setLivingInsight] = useState<string | null>(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [reentryDays, setReentryDays] = useState<number | null>(null)
  const [showReentryBanner, setShowReentryBanner] = useState(false)
  const [lastThreshold, setLastThreshold] = useState(0)

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

    // Detect re-entry (user returning after 3+ days)
    if (habitsData.length > 0) {
      const allCheckIns = habitsData.flatMap(h => h.check_ins ?? [])
      if (allCheckIns.length > 0) {
        const mostRecent = allCheckIns.sort((a, b) => 
          b.created_at.localeCompare(a.created_at)
        )[0]
        const daysSince = differenceInCalendarDays(
          new Date(), 
          parseISO(mostRecent.created_at)
        )
        if (daysSince > 2) {
          setReentryDays(daysSince)
          // Check localStorage to see if we've shown this recently
          const lastShown = localStorage.getItem('mirror_reentry_last_shown')
          const shouldShow = !lastShown || 
            differenceInCalendarDays(new Date(), parseISO(lastShown)) >= 7
          setShowReentryBanner(shouldShow)
        }
      }
    }

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
      <div className="mb-8 animate-fade-in">
        <p className="font-mono text-xs text-text-tertiary uppercase tracking-widest mb-2">{dateLabel}</p>
        <h1 className="font-display text-brand font-light text-[32px] leading-tight tracking-tight">
          {greeting}
        </h1>
        {allDone && (
          <p className="text-success text-sm mt-2 font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-success rounded-full animate-pulse" />
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

      {/* Re-entry banner */}
      {showReentryBanner && reentryDays && (
        <ReentryBanner 
          daysAway={reentryDays} 
          onDismiss={() => {
            setShowReentryBanner(false)
            localStorage.setItem('mirror_reentry_last_shown', new Date().toISOString())
          }}
        />
      )}

      {/* Living progress ring */}
      {total > 0 && (
        <div className="mirror-card p-6 mb-6 flex flex-col items-center">
          <LivingProgressRing 
            logged={logged} 
            total={total}
            livingInsight={livingInsight ?? undefined}
            onThresholdCross={(threshold) => {
              if (threshold !== lastThreshold) {
                setLastThreshold(threshold)
                // Fetch threshold-specific living insight
                const completedNames = habits.filter(h => h.today_status === 'done' || h.today_status === 'partial').map(h => h.name)
                const remainingNames = habits.filter(h => !h.today_status).map(h => h.name)
                const topHabit = habits.sort((a, b) => b.current_streak - a.current_streak)[0]
                const timeLabel = getTimeOfDay()
                
                fetch('/api/ai/living-insight', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    completion_pct: threshold,
                    done: logged,
                    total,
                    completed_habits_names: completedNames,
                    remaining_habits_names: remainingNames,
                    time_label: timeLabel,
                    top_habit: topHabit?.name ?? '',
                    top_streak: topHabit?.current_streak ?? 0
                  })
                })
                  .then(r => r.ok ? r.json() : null)
                  .then((d: { insight?: string } | null) => { 
                    if (d?.insight) setLivingInsight(d.insight) 
                  })
                  .catch(() => {})
              }
            }}
          />

          {/* Show pending habit(s) */}
          {logged < total && (() => {
            const pending = habits.filter(h => h.today_status === null)
            if (pending.length === 1) {
              const habit = pending[0]
              return (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <span className="text-2xl">{habit.icon_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{habit.name}</p>
                    <p className="text-sm text-muted mt-1">Whenever you're ready</p>
                  </div>
                  <Link
                    href="/log"
                    className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-btn hover:bg-opacity-90 transition-all flex-shrink-0"
                  >
                    Log it →
                  </Link>
                </div>
              )
            } else if (pending.length <= 3) {
              return (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-text-tertiary mb-2">{pending.length} remaining:</p>
                  <div className="flex flex-wrap gap-2">
                    {pending.map(h => (
                      <div key={h.id} className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated rounded-sm">
                        <span className="text-sm">{h.icon_emoji}</span>
                        <span className="text-xs text-text-secondary">{h.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          })()}
        </div>
      )}

      {/* AI insight */}
      {insight && (
        <div className="mb-5 px-4 py-4 bg-[#F8F8FC] border-l-[3px] border-l-brand rounded-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🪞</span>
            <p className="font-mono text-[10px] text-brand uppercase tracking-widest">Mirror says</p>
          </div>
          <p className="font-display text-brand text-[15px] font-light leading-relaxed italic">
            {insight}
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
        <div className="space-y-6">
          {/* Leave Habits - Time-based Progress */}
          {(() => {
            const leaveHabits = habits.filter(h => h.intent === 'leave')
            if (leaveHabits.length === 0) return null
            
            return (
              <div>
                <h2 className="text-sm font-semibold text-brand mb-3">Breaking Free</h2>
                <div className="space-y-3">
                  {leaveHabits.map(habit => (
                    <TimeBasedProgressRing
                      key={habit.id}
                      habitId={habit.id}
                      habitName={habit.name}
                      habitIcon={habit.icon_emoji}
                      dayStartTime={profile?.day_start_time || '06:00'}
                      dayEndTime={profile?.day_end_time || '22:00'}
                      lastCheckInStatus={
                        habit.today_status === 'done' ? 'held_on' : 
                        habit.today_status === 'honest_slip' ? 'had_moment' : 
                        null
                      }
                      onClick={() => {
                        // Navigate to log page for this habit
                        window.location.href = `/log?habit=${habit.id}`
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Quantifiable Habits - Cumulative Progress */}
          {(() => {
            const quantifiableHabits = habits.filter(h => h.goal_value && h.intent !== 'leave')
            if (quantifiableHabits.length === 0) return null
            
            return (
              <div>
                <h2 className="text-sm font-semibold text-brand mb-3">Daily Goals</h2>
                <div className="space-y-3">
                  {quantifiableHabits.map(habit => {
                    const todayTotal = habit.check_ins
                      ?.filter(c => c.date === new Date().toISOString().split('T')[0])
                      .reduce((sum, c) => sum + (c.quantity || 0), 0) || 0
                    
                    return (
                      <QuantifiableHabitCard
                        key={habit.id}
                        habit={habit}
                        todayTotal={todayTotal}
                        onAddQuantity={async (quantity) => {
                          await supabase.from('check_ins').insert({
                            user_id: habit.user_id,
                            habit_id: habit.id,
                            date: new Date().toISOString().split('T')[0],
                            status: 'done',
                            quantity: quantity
                          })
                          await loadData()
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Regular Habits */}
          {(() => {
            const regularHabits = habits.filter(h => !h.goal_value && h.intent !== 'leave')
            if (regularHabits.length === 0) return null
            
            return (
              <div>
                <h2 className="text-sm font-semibold text-brand mb-3">Daily Habits</h2>
                <div className="space-y-3">
                  {regularHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            )
          })()}

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
