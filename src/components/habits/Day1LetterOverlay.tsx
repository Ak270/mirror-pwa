'use client'

import { motion } from 'framer-motion'

interface Day1LetterOverlayProps {
  letter: string
  habitName: string
  onDismiss: () => void
}

export default function Day1LetterOverlay({ letter, habitName, onDismiss }: Day1LetterOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#1a1a2e] z-50 flex items-center justify-center p-6"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl text-white italic mb-2">
            You wrote this on Day 1.
          </h2>
          <div className="w-24 h-px bg-white/20 mx-auto" />
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-card p-6 mb-6">
          <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
            {letter}
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={onDismiss}
            className="px-8 py-3 bg-white text-[#1a1a2e] font-medium rounded-btn hover:bg-white/90 transition-colors"
          >
            I read it
          </button>
        </div>

        <p className="text-white/40 text-xs text-center mt-6">
          For {habitName}
        </p>
      </motion.div>
    </motion.div>
  )
}
