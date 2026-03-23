'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createHabit, updateHabit } from '@/lib/habits'
import type { Habit, CategoryId, HabitFrequency } from '@/types'
import { CATEGORIES } from '@/types'
import { getCategoryColor } from '@/lib/utils'
import { getHabitSuggestions, suggestIconForHabit } from '@/lib/habitSuggestions'

const EMOJI_OPTIONS = [
  { emoji: '🏃', label: 'Exercise' },
  { emoji: '📚', label: 'Reading' },
  { emoji: '🧘', label: 'Meditation' },
  { emoji: '💧', label: 'Hydration' },
  { emoji: '🌙', label: 'Sleep' },
  { emoji: '🍎', label: 'Nutrition' },
  { emoji: '💪', label: 'Strength' },
  { emoji: '✍️', label: 'Writing' },
  { emoji: '🎯', label: 'Goals' },
  { emoji: '🎨', label: 'Creativity' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🌱', label: 'Growth' },
  { emoji: '🔓', label: 'Freedom' },
  { emoji: '💊', label: 'Medicine' },
  { emoji: '😴', label: 'Rest' },
  { emoji: '🚶', label: 'Walking' },
  { emoji: '🧹', label: 'Cleaning' },
  { emoji: '🪴', label: 'Plants' },
]

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: '3x_week', label: '3× per week' },
  { value: '2x_week', label: '2× per week' },
  { value: 'weekly', label: 'Once a week' },
]

interface HabitFormProps {
  existing?: Habit
  defaultCategory?: CategoryId
}

export default function HabitForm({ existing, defaultCategory }: HabitFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(existing?.name ?? '')
  const [categoryId, setCategoryId] = useState<CategoryId>(existing?.category_id ?? defaultCategory ?? 'build_up')
  const [emoji, setEmoji] = useState(existing?.icon_emoji ?? '🏃')
  const [whyAnchor, setWhyAnchor] = useState(existing?.why_anchor ?? '')
  const [frequency, setFrequency] = useState<HabitFrequency>(existing?.frequency ?? 'daily')
  const [reminderTime, setReminderTime] = useState(existing?.reminder_time ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Intent classification (leave vs start)
  const [intent, setIntent] = useState<'start' | 'leave'>('start')
  const [addictionLevel, setAddictionLevel] = useState<number>(5)
  const [originAnchor, setOriginAnchor] = useState('')
  const [day1Letter, setDay1Letter] = useState('')
  const [showIntentStep, setShowIntentStep] = useState(!existing)

  // Break-free fields
  const [checkInInterval, setCheckInInterval] = useState<number>(existing?.check_in_interval_minutes ?? 120)
  const [dailyReductionGoal, setDailyReductionGoal] = useState(existing?.daily_reduction_goal?.toString() ?? '')
  const [dailyReductionUnit, setDailyReductionUnit] = useState(existing?.daily_reduction_unit ?? '')
  const [yesterdayBaseline, setYesterdayBaseline] = useState(existing?.yesterday_baseline?.toString() ?? '')

  // Quantifiable fields
  const [dailyTarget, setDailyTarget] = useState(existing?.daily_target?.toString() ?? '')
  const [dailyTargetUnit, setDailyTargetUnit] = useState(existing?.daily_target_unit ?? '')
  const [reminderInterval, setReminderInterval] = useState<number>(existing?.reminder_interval_minutes ?? 60)
  const [reminderStartTime, setReminderStartTime] = useState(existing?.reminder_start_time ?? '08:00')
  const [reminderEndTime, setReminderEndTime] = useState(existing?.reminder_end_time ?? '20:00')

  const isBreakFree = categoryId === 'break_free'
  const isLeaveHabit = intent === 'leave'
  const isQuantifiable = dailyTarget !== '' && !isBreakFree

  const filteredSuggestions = getHabitSuggestions(name, 15)

  // Auto-select icon based on habit name
  useEffect(() => {
    if (name.length > 2 && !existing) {
      const suggestedIcon = suggestIconForHabit(name)
      if (suggestedIcon !== emoji) {
        setEmoji(suggestedIcon)
      }
    }
  }, [name, existing, emoji])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Give your habit a name.'); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setLoading(false); return }

    const habitData = {
      name: name.trim(),
      category_id: categoryId,
      icon_emoji: emoji,
      why_anchor: whyAnchor.trim() || null,
      frequency,
      reminder_time: isBreakFree || isQuantifiable ? null : (reminderTime || null),
      habit_type: categoryId === 'break_free' ? 'break' as const : categoryId === 'rhythm' ? 'rhythm' as const : 'build' as const,
      goal_value: null,
      goal_unit: null,
      display_type: isQuantifiable ? 'counter' as const : 'binary' as const,
      is_vault: false,
      archived: false,
      // Intent classification
      intent,
      addiction_level: isLeaveHabit ? addictionLevel : null,
      origin_anchor: isLeaveHabit && originAnchor.trim() ? originAnchor.trim() : null,
      day1_letter: isLeaveHabit && day1Letter.trim() ? day1Letter.trim() : null,
      day1_letter_delivered: false,
      vulnerability_hour: null,
      banked_grace_days: null,
      grace_days_earned_total: null,
      last_grace_day_earned_at: null,
      // Break-free fields
      check_in_interval_minutes: isBreakFree ? checkInInterval : null,
      daily_reduction_goal: isBreakFree && dailyReductionGoal ? parseFloat(dailyReductionGoal) : null,
      daily_reduction_unit: isBreakFree && dailyReductionUnit ? dailyReductionUnit : null,
      yesterday_baseline: isBreakFree && yesterdayBaseline ? parseFloat(yesterdayBaseline) : null,
      // Quantifiable fields
      daily_target: isQuantifiable && dailyTarget ? parseFloat(dailyTarget) : null,
      daily_target_unit: isQuantifiable && dailyTargetUnit ? dailyTargetUnit : null,
      reminder_interval_minutes: isQuantifiable ? reminderInterval : null,
      reminder_start_time: isQuantifiable ? reminderStartTime : null,
      reminder_end_time: isQuantifiable ? reminderEndTime : null,
    }

    if (existing) {
      const { error: err } = await updateHabit(supabase, existing.id, habitData)
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/habits/${existing.id}`)
    } else {
      const { data, error: err } = await createHabit(supabase, user.id, habitData)
      if (err || !data) { setError(err?.message ?? 'Something went wrong.'); setLoading(false); return }
      router.push(`/habits/${data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Intent selection - only for new habits */}
      {showIntentStep && !existing && (
        <div>
          <label className="mirror-label">Is this something you want to START or LEAVE behind?</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIntent('start')}
              className={`p-4 rounded-card border-2 transition-all ${
                intent === 'start' 
                  ? 'border-success bg-success/5' 
                  : 'border-border hover:border-success/40'
              }`}
            >
              <div className="text-2xl mb-2">↗️</div>
              <div className="font-semibold text-sm text-brand">START</div>
              <div className="text-xs text-muted mt-1">Build something new</div>
            </button>
            <button
              type="button"
              onClick={() => setIntent('leave')}
              className={`p-4 rounded-card border-2 transition-all ${
                intent === 'leave' 
                  ? 'border-amber bg-amber/5' 
                  : 'border-border hover:border-amber/40'
              }`}
            >
              <div className="text-2xl mb-2">🚪</div>
              <div className="font-semibold text-sm text-brand">LEAVE</div>
              <div className="text-xs text-muted mt-1">Free yourself from something</div>
            </button>
          </div>
        </div>
      )}

      {/* Addiction level slider - only for LEAVE habits */}
      {isLeaveHabit && !existing && (
        <div>
          <label className="mirror-label">How strong is the pull right now?</label>
          <input
            type="range"
            min="1"
            max="10"
            value={addictionLevel}
            onChange={(e) => setAddictionLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber"
          />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>Mild habit</span>
            <span className="font-medium text-brand">{addictionLevel}</span>
            <span>Feel controlled by it</span>
          </div>
          <p className="text-sm text-muted mt-2">
            {addictionLevel <= 3 && "Mirror will check in gently. You've got this."}
            {addictionLevel > 3 && addictionLevel <= 6 && "Mirror will check in more often, especially in harder moments."}
            {addictionLevel > 6 && addictionLevel <= 9 && "Mirror will be with you closely, especially the first week."}
            {addictionLevel === 10 && "Mirror will support you fully. Consider also speaking with a professional — this is hard, and you don't have to do it alone."}
          </p>
        </div>
      )}

      {/* Origin anchor - only for LEAVE habits */}
      {isLeaveHabit && !existing && (
        <div>
          <label className="mirror-label">
            On the day you decided this — what was happening? <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            value={originAnchor}
            onChange={(e) => setOriginAnchor(e.target.value)}
            placeholder="A moment, a feeling, something you saw or heard..."
            className="mirror-input min-h-[80px] resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted mt-1">Mirror will send your own words back when the day gets hard.</p>
        </div>
      )}

      {/* Day 1 letter - only for LEAVE habits */}
      {isLeaveHabit && !existing && (
        <div>
          <label className="mirror-label">
            Write a letter to yourself for the hard days <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            value={day1Letter}
            onChange={(e) => setDay1Letter(e.target.value)}
            placeholder="Hey. I know today is hard. When I wrote this, here is what I wanted you to remember..."
            className="mirror-input min-h-[120px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted mt-1">This stays sealed until you need it. Delivered on your first slip.</p>
        </div>
      )}

      {/* Emoji picker */}
      <div>
        <label className="mirror-label">Icon</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {EMOJI_OPTIONS.map(({ emoji: e, label }) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              title={label}
              className={`w-10 h-10 text-xl rounded-xl border-2 transition-all duration-100 hover:scale-110 ${
                emoji === e ? 'border-accent bg-accent-light' : 'border-brand/10 bg-surface'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="relative">
        <label className="mirror-label" htmlFor="habit-name">Name</label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="e.g. Morning walk"
          className="mirror-input"
          required
          maxLength={80}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-brand/10 rounded-card shadow-hover max-h-64 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.name}-${suggestion.category}`}
                type="button"
                onClick={() => {
                  setName(suggestion.name)
                  setEmoji(suggestion.icon)
                  setShowSuggestions(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-brand hover:bg-surface transition-colors flex items-center gap-2"
              >
                <span className="text-lg">{suggestion.icon}</span>
                <span>{suggestion.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Why anchor */}
      <div>
        <label className="mirror-label" htmlFor="why-anchor">
          Why? <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="why-anchor"
          type="text"
          value={whyAnchor}
          onChange={e => setWhyAnchor(e.target.value)}
          placeholder="e.g. To feel clear-headed in the morning"
          className="mirror-input"
          maxLength={120}
        />
        <p className="text-xs text-muted mt-1">Shown on your card as a quiet reminder.</p>
      </div>

      {/* Category */}
      <div>
        <label className="mirror-label">Category</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`flex items-center gap-2.5 p-3 rounded-btn border-2 text-left transition-all duration-100 ${
                categoryId === cat.id ? 'border-accent' : 'border-brand/10 hover:border-accent/40'
              }`}
              style={{ background: categoryId === cat.id ? getCategoryColor(cat.id) : 'white' }}
            >
              <span className="text-xl">{cat.icon_emoji}</span>
              <div>
                <div className="text-sm font-semibold text-brand">{cat.display_name}</div>
                <div className="text-xs text-muted">{cat.tagline}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="mirror-label">How often?</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {FREQUENCY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFrequency(opt.value)}
              className={`chip transition-all ${
                frequency === opt.value ? 'chip-brand' : 'border-brand/15 text-muted hover:border-accent hover:text-brand'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Break-free: check-in settings */}
      {isBreakFree && (
        <div className="space-y-4 p-4 rounded-card border border-slip/20 bg-slip-light/30">
          <p className="text-sm font-semibold text-slip">Break Free settings</p>

          <div>
            <label className="mirror-label">How often should Mirror check in?</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[{v:60,l:'Every 1 hour'},{v:120,l:'Every 2 hours'},{v:180,l:'Every 3 hours'},{v:240,l:'Every 4 hours'},{v:720,l:'Twice daily'}].map(opt => (
                <button key={opt.v} type="button" onClick={() => setCheckInInterval(opt.v)}
                  className={`chip transition-all ${checkInInterval === opt.v ? 'chip-brand' : 'border-brand/15 text-muted hover:border-accent hover:text-brand'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mirror-label" htmlFor="reduction-goal">Daily max goal <span className="font-normal text-muted">(optional)</span></label>
              <input id="reduction-goal" type="number" min="0" step="0.5" value={dailyReductionGoal}
                onChange={e => setDailyReductionGoal(e.target.value)}
                placeholder="e.g. 3" className="mirror-input" />
            </div>
            <div>
              <label className="mirror-label" htmlFor="reduction-unit">Unit</label>
              <input id="reduction-unit" type="text" value={dailyReductionUnit}
                onChange={e => setDailyReductionUnit(e.target.value)}
                placeholder="e.g. cigarettes" className="mirror-input" />
            </div>
          </div>

          <div>
            <label className="mirror-label" htmlFor="yesterday-baseline">How many yesterday? <span className="font-normal text-muted">(helps Mirror celebrate progress)</span></label>
            <input id="yesterday-baseline" type="number" min="0" step="0.5" value={yesterdayBaseline}
              onChange={e => setYesterdayBaseline(e.target.value)}
              placeholder="e.g. 6" className="mirror-input" />
          </div>
        </div>
      )}

      {/* Quantifiable: target + interval settings */}
      {!isBreakFree && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mirror-label" htmlFor="daily-target">Daily target <span className="font-normal text-muted">(optional)</span></label>
              <input id="daily-target" type="number" min="0" step="0.5" value={dailyTarget}
                onChange={e => setDailyTarget(e.target.value)}
                placeholder="e.g. 8" className="mirror-input" />
            </div>
            <div>
              <label className="mirror-label" htmlFor="target-unit">Unit</label>
              <input id="target-unit" type="text" value={dailyTargetUnit}
                onChange={e => setDailyTargetUnit(e.target.value)}
                placeholder="e.g. glasses" className="mirror-input" />
            </div>
          </div>

          {isQuantifiable && (
            <div className="space-y-4 p-4 rounded-card border border-accent/20 bg-accent-light/30">
              <p className="text-sm font-semibold text-accent">Reminder schedule</p>
              <div>
                <label className="mirror-label">Remind me every</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[{v:30,l:'30 min'},{v:45,l:'45 min'},{v:60,l:'1 hour'},{v:120,l:'2 hours'}].map(opt => (
                    <button key={opt.v} type="button" onClick={() => setReminderInterval(opt.v)}
                      className={`chip transition-all ${reminderInterval === opt.v ? 'chip-brand' : 'border-brand/15 text-muted hover:border-accent hover:text-brand'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mirror-label" htmlFor="start-time">Start reminders</label>
                  <input id="start-time" type="time" value={reminderStartTime}
                    onChange={e => setReminderStartTime(e.target.value)} className="mirror-input" />
                </div>
                <div>
                  <label className="mirror-label" htmlFor="end-time">Stop reminders</label>
                  <input id="end-time" type="time" value={reminderEndTime}
                    onChange={e => setReminderEndTime(e.target.value)} className="mirror-input" />
                </div>
              </div>
            </div>
          )}

          {!isQuantifiable && (
            <div>
              <label className="mirror-label" htmlFor="reminder">Daily reminder <span className="font-normal text-muted">(optional)</span></label>
              <input id="reminder" type="time" value={reminderTime}
                onChange={e => setReminderTime(e.target.value)} className="mirror-input" />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-slip-light text-slip text-sm px-4 py-3 rounded-btn">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="mirror-btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="mirror-btn-primary flex-1 disabled:opacity-60">
          {loading ? 'Saving…' : existing ? 'Save changes' : 'Add habit'}
        </button>
      </div>
    </form>
  )
}
