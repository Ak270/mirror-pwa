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
      reminder_time: reminderTime || null,
      habit_type: categoryId === 'break_free' ? 'break' as const : categoryId === 'rhythm' ? 'rhythm' as const : 'build' as const,
      goal_value: null,
      goal_unit: null,
      is_vault: false,
      archived: false,
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

      {/* Reminder */}
      <div>
        <label className="mirror-label" htmlFor="reminder">
          Daily reminder <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="reminder"
          type="time"
          value={reminderTime}
          onChange={e => setReminderTime(e.target.value)}
          className="mirror-input"
        />
      </div>

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
