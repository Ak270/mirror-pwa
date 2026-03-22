'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

interface WeeklyReviewCardProps {
  weekStats: {
    bestHabit: string
    completionRate: number
    vsLastWeek: number
  }
}

export default function WeeklyReviewCard({ weekStats }: WeeklyReviewCardProps) {
  const [dismissed, setDismissed] = useState(true)
  const [insight, setInsight] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    
    // Show only on Sunday after 8pm
    if (day !== 0 || hour < 20) {
      setDismissed(true)
      return
    }

    // Check if already dismissed this week
    const weekYear = getWeekYear(now)
    const dismissKey = `mirror-weekly-review-dismissed-${weekYear}`
    const wasDismissed = localStorage.getItem(dismissKey)
    
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    setDismissed(false)

    // Fetch Groq insight
    fetch('/api/ai/weekly-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weekStats),
    })
      .then(r => r.ok ? r.json() : null)
      .then((d: { insight?: string } | null) => {
        if (d?.insight) setInsight(d.insight)
      })
      .catch(() => {})
  }, [weekStats])

  function handleDismiss() {
    const now = new Date()
    const weekYear = getWeekYear(now)
    const dismissKey = `mirror-weekly-review-dismissed-${weekYear}`
    localStorage.setItem(dismissKey, 'true')
    setDismissed(true)
  }

  if (dismissed) return null

  const weekRange = getWeekRange()

  return (
    <div className="mb-6 p-5 bg-gradient-to-br from-[#FFF9F0] to-[#FFF5E6] border border-amber/20 rounded-card shadow-card animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="font-display text-brand text-lg font-light">Weekly Review</h3>
            <p className="text-xs text-text-tertiary">{weekRange}</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-tertiary hover:text-brand transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-white/60 rounded-btn p-3">
          <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wide mb-1">Best habit</p>
          <p className="text-sm font-medium text-brand truncate">{weekStats.bestHabit}</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-btn p-3">
          <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wide mb-1">Completion</p>
          <p className="text-sm font-medium text-brand">{weekStats.completionRate}%</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-btn p-3">
          <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-wide mb-1">vs Last week</p>
          <p className={`text-sm font-medium ${weekStats.vsLastWeek >= 0 ? 'text-success' : 'text-amber'}`}>
            {weekStats.vsLastWeek >= 0 ? '+' : ''}{weekStats.vsLastWeek}%
          </p>
        </div>
      </div>

      {insight && (
        <p className="font-display text-brand text-sm italic leading-relaxed mb-4">
          {insight}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href="/reflect"
          className="flex-1 px-4 py-2 bg-brand text-white text-sm font-medium rounded-btn hover:bg-opacity-90 transition-all text-center"
        >
          Write reflection
        </Link>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-sm text-text-secondary hover:text-brand transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

function getWeekYear(date: Date): string {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getWeekRange(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return `${monthNames[monday.getMonth()]} ${monday.getDate()}–${monthNames[sunday.getMonth()]} ${sunday.getDate()}`
}
