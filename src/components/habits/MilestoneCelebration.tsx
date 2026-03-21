'use client'

import { useEffect, useState } from 'react'
import type { MilestoneMoment } from '@/lib/streakIdentity'

interface MilestoneCelebrationProps {
  milestone: MilestoneMoment
  habitName: string
  onClose: () => void
}

export default function MilestoneCelebration({ milestone, habitName, onClose }: MilestoneCelebrationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setVisible(true), 100)
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }}
    >
      <div 
        className={`max-w-md w-full rounded-card p-8 text-center transform transition-all duration-500 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{ backgroundColor: milestone.color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji */}
        <div className="text-6xl mb-4 animate-bounce">
          {milestone.emoji}
        </div>
        
        {/* Title */}
        <h2 className="font-display text-white text-3xl font-light mb-2">
          {milestone.title}
        </h2>
        
        {/* Habit name */}
        <p className="text-white/80 text-sm font-medium mb-4">
          {habitName}
        </p>
        
        {/* Message */}
        <p className="font-display text-white text-lg font-light leading-relaxed mb-6 italic">
          &ldquo;{milestone.message}&rdquo;
        </p>
        
        {/* Close button */}
        <button
          onClick={() => {
            setVisible(false)
            setTimeout(onClose, 300)
          }}
          className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-btn text-sm font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
