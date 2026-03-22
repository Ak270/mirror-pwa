'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface StreakMilestoneOverlayProps {
  habitId: string
  habitName: string
  habitEmoji: string
  streak: number
  onDismiss: () => void
}

const MILESTONE_LABELS: Record<number, string> = {
  7: 'One week',
  14: 'Two weeks',
  21: 'Three weeks — a habit forms',
  30: 'One month',
  60: 'Two months',
  90: 'Three months',
  180: 'Half a year',
  365: 'One full year',
}

export default function StreakMilestoneOverlay({
  habitId,
  habitName,
  habitEmoji,
  streak,
  onDismiss,
}: StreakMilestoneOverlayProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if this milestone was already shown
    const shownKey = `mirror-milestone-shown-${habitId}-${streak}`
    if (localStorage.getItem(shownKey)) {
      onDismiss()
      return
    }

    // Mark as shown
    localStorage.setItem(shownKey, 'true')
    
    // Show overlay with animation
    setIsVisible(true)

    // Fetch Groq celebration message
    fetch('/api/ai/milestone-celebration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitName, streak }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((d: { message?: string } | null) => {
        if (d?.message) setInsight(d.message)
      })
      .catch(() => {})

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      handleDismiss()
    }, 6000)

    // Listen for Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    window.addEventListener('keydown', handleEscape)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [habitId, habitName, streak, onDismiss])

  function handleDismiss() {
    setIsVisible(false)
    setTimeout(onDismiss, 300)
  }

  const milestoneLabel = MILESTONE_LABELS[streak] || `${streak} days`

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleDismiss}
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
    >
      <div
        className={`relative bg-white rounded-card p-8 max-w-sm w-full text-center transition-transform duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-text-tertiary hover:text-brand transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden rounded-card pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-accent rounded-full animate-ping"
              style={{
                top: '50%',
                left: '50%',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '2s',
                transform: `translate(-50%, -50%) translate(${Math.cos(i * 30 * Math.PI / 180) * 60}px, ${Math.sin(i * 30 * Math.PI / 180) * 60}px)`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="text-6xl mb-4">{habitEmoji}</div>
          
          <div className="font-display text-brand text-7xl font-light mb-2 tabular-nums">
            {streak}
          </div>
          
          <p className="text-text-secondary text-sm mb-4">{milestoneLabel}</p>
          
          <h3 className="font-display text-brand text-xl font-light mb-3">
            {habitName}
          </h3>

          {insight && (
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              {insight}
            </p>
          )}

          <button
            onClick={() => {
              // Generate shareable image (placeholder for now)
              alert('Share functionality coming soon!')
            }}
            className="px-6 py-2 bg-surface text-brand text-sm font-medium rounded-btn hover:bg-accent-light transition-all"
          >
            Share this moment
          </button>
        </div>
      </div>
    </div>
  )
}
