'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reflection } from '@/types'
import { getCurrentWeekStart, formatDate } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { BookOpen } from 'lucide-react'

const REFLECTION_PROMPTS = [
  "What showed up for you this week that surprised you?",
  "Which habit felt most natural this week, and which felt hardest?",
  "What did this week teach you about yourself?",
  "If you could talk to yourself at the start of this week, what would you say?",
  "What did you do this week that you're quietly proud of?",
  "What would you want next week to feel like?",
]

export default function ReflectPage() {
  const supabase = createClient()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [weekReflection, setWeekReflection] = useState<Reflection | null>(null)
  const [response, setResponse] = useState('')
  const [moodScore, setMoodScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const weekStart = getCurrentWeekStart()
  const promptIndex = new Date().getDay()
  const currentPrompt = REFLECTION_PROMPTS[promptIndex % REFLECTION_PROMPTS.length]

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: refs } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(10)

    const allRefs = refs ?? []
    setReflections(allRefs)

    const thisWeek = allRefs.find(r => r.week_start === weekStart)
    setWeekReflection(thisWeek ?? null)
    if (thisWeek) {
      setResponse(thisWeek.response)
      setMoodScore(thisWeek.mood_score)
    }

    setLoading(false)
  }, [supabase, weekStart])

  useEffect(() => { loadData() }, [loadData])

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !response.trim()) return

    setSaving(true)
    await supabase
      .from('reflections')
      .upsert({
        user_id: user.id,
        week_start: weekStart,
        prompt: currentPrompt,
        response: response.trim(),
        mood_score: moodScore,
      }, { onConflict: 'user_id,week_start' })
      .select()

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-5 h-5 text-accent" />
        <h1 className="font-display text-brand font-light text-2xl">Weekly reflection</h1>
      </div>

      {/* This week */}
      <div className="mirror-card p-5 mb-6">
        <p className="font-mono text-xs text-muted uppercase tracking-widest mb-1">
          Week of {format(parseISO(weekStart), 'MMMM d')}
        </p>
        <p className="font-display text-brand text-lg font-light leading-snug mb-4">
          {currentPrompt}
        </p>

        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Two minutes for yourself."
          className="mirror-input h-32 resize-none leading-relaxed"
          maxLength={2000}
        />

        {/* Mood score */}
        <div className="mt-4">
          <p className="text-xs text-muted mb-2">How was this week overall? <span className="text-muted/60">(optional)</span></p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setMoodScore(moodScore === n ? null : n)}
                className={`flex-1 py-2 rounded-btn border text-sm transition-all duration-100 ${
                  moodScore === n
                    ? 'border-accent bg-accent-light text-brand font-semibold'
                    : 'border-brand/15 text-muted hover:border-accent hover:text-brand'
                }`}
              >
                {['😔', '😕', '😐', '🙂', '😌'][n - 1]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!response.trim() || saving}
          className="mirror-btn-primary w-full mt-4 disabled:opacity-60"
        >
          {saving ? 'Saving…' : saved ? 'Saved.' : 'Save reflection'}
        </button>
      </div>

      {/* Past reflections */}
      {reflections.filter(r => r.week_start !== weekStart).length > 0 && (
        <div>
          <h2 className="font-display text-brand font-light text-lg mb-4">Past reflections</h2>
          <div className="space-y-4">
            {reflections.filter(r => r.week_start !== weekStart).map(r => (
              <details key={r.id} className="mirror-card group">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                  <div>
                    <p className="text-sm font-medium text-brand">
                      Week of {format(parseISO(r.week_start), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate max-w-[240px]">{r.prompt}</p>
                  </div>
                  <span className="text-muted text-xs group-open:hidden">View</span>
                  <span className="text-muted text-xs hidden group-open:block">Close</span>
                </summary>
                <div className="px-4 pb-4 pt-0 border-t border-brand/5">
                  <p className="text-sm text-muted font-display italic leading-relaxed mt-3">
                    &ldquo;{r.response}&rdquo;
                  </p>
                  {r.mood_score && (
                    <p className="text-lg mt-2">
                      {['😔', '😕', '😐', '🙂', '😌'][r.mood_score - 1]}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
