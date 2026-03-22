'use client'

import { motion } from 'framer-motion'

interface GraceDayModalProps {
  habitName: string
  currentStreak: number
  bankedGraceDays: number
  onUseGraceDay: () => void
  onLetItGo: () => void
  onClose: () => void
}

export default function GraceDayModal({
  habitName,
  currentStreak,
  bankedGraceDays,
  onUseGraceDay,
  onLetItGo,
  onClose
}: GraceDayModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-card shadow-hover max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🛡️</span>
          </div>
          <h3 className="font-semibold text-lg text-brand mb-2">
            Spend your earned grace day?
          </h3>
          <p className="text-sm text-muted">
            Your streak stays at Day {currentStreak}
          </p>
        </div>

        <div className="bg-amber/5 border border-amber/20 rounded-card p-4 mb-6">
          <p className="text-sm text-brand/80 leading-relaxed">
            You earned this grace day by showing up for {Math.floor(currentStreak / 30) * 30} days straight. 
            It's yours to use whenever you need it.
          </p>
          <p className="text-xs text-muted mt-2">
            {bankedGraceDays - 1} grace {bankedGraceDays - 1 === 1 ? 'day' : 'days'} will remain after this.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLetItGo}
            className="flex-1 py-2.5 border border-border rounded-btn text-sm font-medium text-muted hover:border-brand/30 transition-colors"
          >
            Let it go
          </button>
          <button
            onClick={onUseGraceDay}
            className="flex-1 py-2.5 bg-amber text-white rounded-btn text-sm font-medium hover:bg-amber/90 transition-colors"
          >
            Protect my streak
          </button>
        </div>

        <p className="text-xs text-center text-muted mt-4 italic">
          For {habitName}
        </p>
      </motion.div>
    </div>
  )
}
