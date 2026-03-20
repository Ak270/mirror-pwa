'use client'

import { useState, useRef } from 'react'
import { Check, Moon } from 'lucide-react'
import type { CheckInStatus, CategoryId } from '@/types'
import { CHECK_IN_LABELS } from '@/types'

interface CheckInButtonProps {
  habitId: string
  habitName: string
  categoryId: CategoryId
  currentStatus: CheckInStatus | null
  onStatusChange: (status: CheckInStatus, quantifiable?: { value: number; unit: string }) => Promise<void>
  isLoading?: boolean
}

export default function CheckInButton({
  habitId,
  habitName,
  categoryId,
  currentStatus,
  onStatusChange,
  isLoading,
}: CheckInButtonProps) {
  const [isLongPress, setIsLongPress] = useState(false)
  const [showQuantifiable, setShowQuantifiable] = useState(false)
  const [quantValue, setQuantValue] = useState('')
  const [quantUnit, setQuantUnit] = useState('km')
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const labels = CHECK_IN_LABELS[categoryId]

  const COMMON_UNITS = ['km', 'miles', 'minutes', 'hours', 'pages', 'reps', 'times', 'cups', 'glasses']

  function startLongPress() {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true)
    }, 500)
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  async function handleStatus(status: CheckInStatus) {
    setIsLongPress(false)
    if (status === 'done') {
      setShowQuantifiable(true)
    } else {
      await onStatusChange(status)
    }
  }

  async function handleQuantifiableSubmit() {
    const value = parseFloat(quantValue)
    if (quantValue && !isNaN(value) && value > 0) {
      await onStatusChange('done', { value, unit: quantUnit })
    } else {
      await onStatusChange('done')
    }
    setShowQuantifiable(false)
    setQuantValue('')
  }

  function handleSkipQuantifiable() {
    onStatusChange('done')
    setShowQuantifiable(false)
    setQuantValue('')
  }

  return (
    <div className="relative">
      {/* Honest slip overlay */}
      {isLongPress && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-10">
          <div className="bg-white rounded-card shadow-hover border border-brand/10 p-3 space-y-1">
            <p className="text-xs text-muted font-mono uppercase tracking-wide px-2 pb-1">Log as...</p>
            {(['done', 'partial', 'skip', 'honest_slip'] as CheckInStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                className={`w-full text-left px-3 py-2.5 rounded-btn text-sm font-medium transition-colors duration-100 ${
                  s === 'honest_slip'
                    ? 'text-slip hover:bg-slip-light'
                    : 'text-brand hover:bg-surface'
                }`}
              >
                {labels[s]}
              </button>
            ))}
            <button
              onClick={() => setIsLongPress(false)}
              className="w-full text-center text-xs text-muted py-1 hover:text-brand transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quantifiable input modal */}
      {showQuantifiable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-hover max-w-sm w-full p-5">
            <h3 className="font-semibold text-brand mb-2">{habitName}</h3>
            <p className="text-sm text-muted mb-4">Add details (optional)</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                value={quantValue}
                onChange={(e) => setQuantValue(e.target.value)}
                placeholder="0"
                className="flex-1 mirror-input"
                step="0.1"
                min="0"
                autoFocus
              />
              <select
                value={quantUnit}
                onChange={(e) => setQuantUnit(e.target.value)}
                className="mirror-input w-32"
              >
                {COMMON_UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSkipQuantifiable}
                className="flex-1 mirror-btn-secondary text-sm py-2.5"
              >
                Skip
              </button>
              <button
                onClick={handleQuantifiableSubmit}
                className="flex-1 mirror-btn-primary text-sm py-2.5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main quick-log row */}
      <div className="flex gap-2 flex-wrap">
        {(['done', 'partial', 'skip'] as CheckInStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => handleStatus(s)}
            onMouseDown={s === 'skip' ? startLongPress : undefined}
            onMouseUp={s === 'skip' ? cancelLongPress : undefined}
            onTouchStart={s === 'skip' ? startLongPress : undefined}
            onTouchEnd={s === 'skip' ? cancelLongPress : undefined}
            disabled={isLoading}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-btn text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 ${
              currentStatus === s
                ? s === 'done'
                  ? 'bg-success text-white border border-success/20'
                  : s === 'partial'
                  ? 'bg-success-light text-success border border-success/30'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                : 'bg-surface text-muted border border-brand/10 hover:border-accent hover:text-brand'
            }`}
            aria-label={labels[s]}
            aria-pressed={currentStatus === s}
          >
            {s === 'done' && currentStatus === 'done' && <Check className="w-3.5 h-3.5 inline mr-1" />}
            {labels[s]}
          </button>
        ))}

        {/* Honest slip — always secondary */}
        <button
          onClick={() => setIsLongPress(true)}
          disabled={isLoading}
          title="Long press or tap for honest slip"
          className={`min-h-[44px] px-3 py-2 rounded-btn transition-all duration-150 active:scale-95 disabled:opacity-50 ${
            currentStatus === 'honest_slip'
              ? 'bg-slip-light border border-slip/40'
              : 'border border-brand/10 text-muted hover:border-slip/30 hover:text-slip'
          }`}
          aria-label="Honest slip — tap for more options"
        >
          <Moon className={`w-4 h-4 ${currentStatus === 'honest_slip' ? 'text-slip' : 'text-muted'}`} />
        </button>
      </div>
    </div>
  )
}
