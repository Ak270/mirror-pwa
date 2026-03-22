'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createHabit, upsertProfile } from '@/lib/habits'
import type { CategoryId, HabitFrequency } from '@/types'
import { CATEGORIES } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

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
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([])
  const [habitName, setHabitName] = useState('')
  const [habitEmoji, setHabitEmoji] = useState('🏃')
  const [habitCategory, setHabitCategory] = useState<CategoryId>('build_up')
  const [whyAnchor, setWhyAnchor] = useState('')
  const [frequency, setFrequency] = useState<HabitFrequency>('daily')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  const totalSteps = 6

  function toggleCategory(id: CategoryId) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
    if (!habitCategory || !selectedCategories.includes(id)) {
      setHabitCategory(id)
    }
  }

  async function handleComplete() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    try {
      console.log('Starting onboarding completion for user:', user.id)
      
      if (habitName.trim()) {
        console.log('Creating habit:', habitName)
        const habitResult = await createHabit(supabase, user.id, {
          name: habitName.trim(),
          category_id: habitCategory,
          icon_emoji: habitEmoji,
          why_anchor: whyAnchor.trim() || null,
          frequency,
          habit_type: habitCategory === 'break_free' ? 'break' : habitCategory === 'rhythm' ? 'rhythm' : 'build',
          goal_value: null,
          goal_unit: null,
          reminder_time: null,
          display_type: 'binary',
          is_vault: false,
          archived: false,
          check_in_interval_minutes: habitCategory === 'break_free' ? 120 : null,
          daily_reduction_goal: null,
          daily_reduction_unit: null,
          yesterday_baseline: null,
          daily_target: null,
          daily_target_unit: null,
          reminder_interval_minutes: null,
          reminder_start_time: null,
          reminder_end_time: null,
        })
        console.log('Habit creation result:', habitResult)
      }

      console.log('Updating profile with onboarding_completed=true')
      const { data, error } = await upsertProfile(supabase, user.id, {
        display_name: displayName.trim() || null,
        onboarding_completed: true,
        selected_categories: selectedCategories.length > 0 ? selectedCategories : ['build_up'],
      })

      console.log('Profile update result:', { data, error })

      if (error) {
        console.error('❌ Profile update failed:', error)
        alert(`Database error: ${error.message}\n\nPlease run the SQL migration in Supabase SQL Editor first.`)
        setLoading(false)
        return
      }

      console.log('✅ Onboarding complete, redirecting to dashboard...')
      // Force a small delay to ensure DB write completes
      await new Promise(resolve => setTimeout(resolve, 500))
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('❌ Onboarding completion error:', err)
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="min-h-screen bg-brand flex flex-col"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #3D3D9B 0%, #1A1A5E 60%, #0D0D3F 100%)' }}>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="text-center">
                  <div className="text-6xl mb-6">🪞</div>
                  <h1 className="font-display text-white text-4xl font-light mb-4">
                    Welcome to Mirror.
                  </h1>
                  <p className="text-[#C4C0FF]/80 text-base leading-relaxed">
                    No judgment. No proof required. No shame for honest days.
                  </p>
                  <p className="text-[#C4C0FF]/60 text-sm mt-3">
                    You are the only authority on your own life.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="font-display text-white text-2xl font-light mb-2">
                    What would you like to call yourself?
                  </h2>
                  <p className="text-[#C4C0FF]/60 text-sm mb-6">Optional. Only shown to you.</p>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/10 border border-white/20 text-white rounded-btn px-4 py-3 placeholder:text-white/30 focus:outline-none focus:border-accent"
                    maxLength={50}
                  />
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-display text-white text-2xl font-light mb-2">
                    What area feels most alive for you right now?
                  </h2>
                  <p className="text-[#C4C0FF]/60 text-sm mb-6">Select any that resonate.</p>
                  <div className="space-y-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-btn border-2 text-left transition-all duration-150 ${
                          selectedCategories.includes(cat.id)
                            ? 'border-accent bg-white/15'
                            : 'border-white/15 bg-white/5 hover:border-white/30'
                        }`}
                      >
                        <span className="text-2xl">{cat.icon_emoji}</span>
                        <div>
                          <div className="text-white font-semibold">{cat.display_name}</div>
                          <div className="text-white/50 text-sm">{cat.tagline}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="font-display text-white text-2xl font-light mb-2">
                    What&apos;s one thing you want to work on?
                  </h2>
                  <p className="text-[#C4C0FF]/60 text-sm mb-6">There is no wrong answer.</p>

                  <div className="flex gap-2 mb-4">
                    {EMOJI_OPTIONS.map(({ emoji: e, label }) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setHabitEmoji(e)}
                        title={label}
                        className={`w-9 h-9 text-lg rounded-lg border-2 transition-all ${
                          habitEmoji === e ? 'border-accent bg-white/20' : 'border-white/10 bg-white/5'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={habitName}
                    onChange={e => setHabitName(e.target.value)}
                    placeholder="e.g. Morning walk"
                    className="w-full bg-white/10 border border-white/20 text-white rounded-btn px-4 py-3 placeholder:text-white/30 focus:outline-none focus:border-accent mb-4"
                    maxLength={80}
                  />

                  <input
                    type="text"
                    value={whyAnchor}
                    onChange={e => setWhyAnchor(e.target.value)}
                    placeholder="Why? (optional)"
                    className="w-full bg-white/10 border border-white/20 text-white rounded-btn px-4 py-3 placeholder:text-white/30 focus:outline-none focus:border-accent mb-4"
                    maxLength={120}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setHabitCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-btn border text-sm transition-all ${
                          habitCategory === cat.id
                            ? 'border-accent bg-white/15 text-white font-semibold'
                            : 'border-white/15 text-white/50 hover:border-white/30'
                        }`}
                      >
                        {cat.icon_emoji} {cat.display_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="font-display text-white text-2xl font-light mb-2">
                    How often?
                  </h2>
                  <p className="text-[#C4C0FF]/60 text-sm mb-6">Start with something achievable.</p>
                  <div className="space-y-2">
                    {([
                      { value: 'daily', label: 'Every day' },
                      { value: 'weekdays', label: 'Weekdays only' },
                      { value: '3x_week', label: '3 times a week' },
                      { value: '2x_week', label: 'Twice a week' },
                      { value: 'weekly', label: 'Once a week' },
                    ] as { value: HabitFrequency; label: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFrequency(opt.value)}
                        className={`w-full py-3 px-4 rounded-btn border-2 text-left text-sm transition-all ${
                          frequency === opt.value
                            ? 'border-accent bg-white/15 text-white font-semibold'
                            : 'border-white/15 text-white/60 hover:border-white/30 hover:text-white/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="text-center">
                  <div className="text-5xl mb-6">✦</div>
                  <h2 className="font-display text-white text-2xl font-light mb-4">
                    You&apos;re ready.
                  </h2>
                  <p className="text-[#C4C0FF]/70 text-sm leading-relaxed">
                    Mirror will be here when you are.
                    {habitName.trim() && (
                      <><br /><br />Your first intention: <strong className="text-white">{habitName}</strong></>
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-10">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-btn border border-white/20 text-white/60 hover:text-white hover:border-white/40 text-sm transition-all"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={step < totalSteps - 1 ? () => setStep(s => s + 1) : handleComplete}
              disabled={loading || (step === 2 && selectedCategories.length === 0)}
              className="flex-1 bg-accent text-white font-semibold py-3 rounded-btn hover:bg-opacity-90 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Setting up…' : step < totalSteps - 1 ? 'Continue' : 'Open Mirror'}
            </button>
          </div>

          {step === 2 && selectedCategories.length === 0 && (
            <p className="text-center text-white/40 text-xs mt-3">Select at least one area to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}
