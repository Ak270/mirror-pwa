'use client'

import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface ReentryBannerProps {
  daysAway: number
  onDismiss: () => void
}

export default function ReentryBanner({ daysAway, onDismiss }: ReentryBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-6 p-5 bg-gradient-to-r from-accent-light/40 to-brand-light/20 border-l-[3px] border-l-accent rounded-card shadow-card relative overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="relative">
        <button
          onClick={onDismiss}
          className="absolute -top-1 -right-1 p-1 text-muted hover:text-brand transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-6">
          <h3 className="text-brand font-semibold text-base mb-2">
            You're back.
          </h3>
          
          <p className="text-sm text-brand/80 leading-relaxed mb-3">
            <span className="font-medium">{daysAway} {daysAway === 1 ? 'day' : 'days'}</span> — and you came back anyway.
          </p>

          <p className="text-sm text-brand/90 font-medium">
            That's the only thing that matters right now.
          </p>

          <p className="text-xs text-muted mt-3 italic">
            Pick one habit. Just one.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
