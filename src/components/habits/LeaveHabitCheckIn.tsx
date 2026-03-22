'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface LeaveHabitCheckInProps {
  habitId: string
  habitName: string
  habitIcon: string
  addictionLevel: number
  onStatusChange: (status: 'held_on' | 'had_moment', quantity?: number, note?: string) => Promise<void>
  currentStatus: 'held_on' | 'had_moment' | null
  isLoading?: boolean
}

export default function LeaveHabitCheckIn({
  habitId,
  habitName,
  habitIcon,
  addictionLevel,
  onStatusChange,
  currentStatus,
  isLoading,
}: LeaveHabitCheckInProps) {
  const [showMomentModal, setShowMomentModal] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  async function handleHeldOn() {
    await onStatusChange('held_on')
  }

  async function handleHadMoment() {
    setShowMomentModal(true)
  }

  async function submitMoment() {
    const qty = parseInt(quantity)
    await onStatusChange('had_moment', qty > 0 ? qty : undefined, note.trim() || undefined)
    setShowMomentModal(false)
    setQuantity('')
    setNote('')
  }

  function skipQuantity() {
    onStatusChange('had_moment', undefined, note.trim() || undefined)
    setShowMomentModal(false)
    setQuantity('')
    setNote('')
  }

  return (
    <div className="relative">
      {/* Had a moment modal */}
      {showMomentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowMomentModal(false)}>
          <div className="bg-white rounded-t-card shadow-hover max-w-lg w-full p-6 pb-24 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{habitIcon}</span>
              <div>
                <p className="text-sm font-semibold text-brand">{habitName}</p>
                <p className="text-xs text-muted">What happened today?</p>
              </div>
            </div>

            {/* Quantity input */}
            <div className="mb-4">
              <label className="text-sm text-brand mb-2 block">How many? (optional)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 3 cigarettes"
                className="w-full mirror-input"
                min="0"
                step="1"
                autoFocus
              />
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="text-sm text-brand mb-2 block">What was going on?</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="I was stressed... At a party... Felt triggered..."
                className="w-full mirror-input min-h-[80px] resize-none"
                maxLength={200}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={skipQuantity}
                className="flex-1 mirror-btn-secondary text-sm py-2.5"
              >
                Skip details
              </button>
              <button
                onClick={submitMoment}
                className="flex-1 mirror-btn-primary text-sm py-2.5"
              >
                Log it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleHeldOn}
          disabled={isLoading}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-btn text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${
            currentStatus === 'held_on'
              ? 'bg-success text-white border border-success/20'
              : 'bg-surface text-muted border border-brand/10 hover:border-accent hover:text-brand'
          }`}
        >
          {currentStatus === 'held_on' && <Check className="w-3.5 h-3.5 inline mr-1" />}
          I held on today
        </button>

        <button
          onClick={handleHadMoment}
          disabled={isLoading}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-btn text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${
            currentStatus === 'had_moment'
              ? 'bg-slip-light text-slip border border-slip/40'
              : 'bg-surface text-muted border border-brand/10 hover:border-slip/30 hover:text-slip'
          }`}
        >
          I had a moment
        </button>
      </div>

      {/* Status message */}
      {currentStatus === 'held_on' && (
        <p className="text-xs text-success mt-2 text-center">
          Another day. You're building something.
        </p>
      )}
      {currentStatus === 'had_moment' && (
        <p className="text-xs text-slip mt-2 text-center">
          Noted. Tomorrow is a new day.
        </p>
      )}
    </div>
  )
}
