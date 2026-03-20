'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getHabitsWithTodayStatus, archiveHabit } from '@/lib/habits'
import type { HabitWithStatus, CategoryId } from '@/types'
import { CATEGORIES } from '@/types'
import { getCategoryColor, formatStreakLabel } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Archive, ChevronRight } from 'lucide-react'

export default function HabitsPage() {
  const supabase = createClient()
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CategoryId | 'all'>('all')

  const loadHabits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const data = await getHabitsWithTodayStatus(supabase, user.id)
    setHabits(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadHabits() }, [loadHabits])

  async function handleArchive(habitId: string) {
    if (!confirm('Archive this habit? You can still view its history.')) return
    await archiveHabit(supabase, habitId)
    await loadHabits()
  }

  const filtered = filter === 'all' ? habits : habits.filter(h => h.category_id === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-brand font-light text-2xl">Your habits</h1>
        <Link href="/habits/new" className="mirror-btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus className="w-4 h-4" />
          New habit
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setFilter('all')}
          className={`chip flex-shrink-0 transition-all ${filter === 'all' ? 'chip-brand' : 'border-brand/15 text-muted hover:border-accent hover:text-brand'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`chip flex-shrink-0 transition-all ${filter === cat.id ? 'chip-brand' : 'border-brand/15 text-muted hover:border-accent hover:text-brand'}`}
          >
            {cat.icon_emoji} {cat.display_name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-40">🪞</div>
          <p className="font-display text-brand text-xl font-light mb-2">No habits yet.</p>
          <p className="text-muted text-sm mb-6">There is no wrong answer.</p>
          <Link href="/habits/new" className="mirror-btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add habit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(habit => (
            <div key={habit.id} className="mirror-card group">
              <Link href={`/habits/${habit.id}`} className="flex items-center gap-3 p-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: getCategoryColor(habit.category_id) }}
                >
                  {habit.icon_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{habit.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {habit.current_streak > 0
                      ? `${habit.current_streak >= 7 ? '🔥 ' : ''}${formatStreakLabel(habit.current_streak)}`
                      : 'Start today'}
                    {habit.current_streak > 0 && habit.best_streak > habit.current_streak && (
                      <span className="ml-2 text-muted/60">Best: {habit.best_streak}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted/40 group-hover:text-muted transition-colors" />
              </Link>
              <div className="border-t border-brand/5 px-4 py-2 flex justify-end">
                <button
                  onClick={() => handleArchive(habit.id)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-slip transition-colors py-1 px-2 rounded"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
