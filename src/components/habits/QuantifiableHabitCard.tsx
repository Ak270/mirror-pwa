'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import type { HabitWithStatus } from '@/types'
import { getCategoryColor } from '@/lib/utils'

interface QuantifiableHabitCardProps {
  habit: HabitWithStatus
  todayTotal: number
  onAddQuantity: (quantity: number) => Promise<void>
  showLink?: boolean
}

export default function QuantifiableHabitCard({
  habit,
  todayTotal,
  onAddQuantity,
  showLink = true
}: QuantifiableHabitCardProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const iconBg = getCategoryColor(habit.category_id)
  const goalValue = habit.goal_value || 10
  const unit = habit.goal_unit || 'times'
  const percentComplete = Math.min(100, (todayTotal / goalValue) * 100)
  const isComplete = todayTotal >= goalValue

  async function handleQuickAdd(amount: number) {
    setIsAdding(true)
    try {
      await onAddQuantity(amount)
    } finally {
      setIsAdding(false)
      setShowQuickAdd(false)
    }
  }

  async function handleCustomAdd() {
    const amount = parseFloat(customAmount)
    if (isNaN(amount) || amount <= 0) return
    
    setIsAdding(true)
    try {
      await onAddQuantity(amount)
      setCustomAmount('')
    } finally {
      setIsAdding(false)
      setShowQuickAdd(false)
    }
  }

  return (
    <div className="bg-white border border-border shadow-card rounded-card p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: iconBg }}
        >
          {habit.icon_emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-brand truncate">
            {habit.name}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {todayTotal}/{goalValue} {unit} today
          </div>
        </div>

        {isComplete && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-success/10 border-2 border-success flex items-center justify-center">
              <Check className="w-4 h-4 text-success" />
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface rounded-full h-2 mb-3 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            isComplete ? 'bg-success' : 'bg-accent'
          }`}
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Quick Add Buttons */}
      {!showQuickAdd ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickAdd(1)}
            disabled={isAdding}
            className="flex-1 mirror-btn-secondary text-sm py-2 disabled:opacity-50"
          >
            +1 {unit}
          </button>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-3 py-2 rounded-btn border border-brand/10 hover:border-accent transition-colors"
            aria-label="Add custom amount"
          >
            <Plus className="w-4 h-4 text-brand" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 mirror-input text-sm py-2"
            min="0"
            step="0.5"
            autoFocus
          />
          <button
            onClick={handleCustomAdd}
            disabled={isAdding || !customAmount}
            className="mirror-btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowQuickAdd(false)
              setCustomAmount('')
            }}
            className="mirror-btn-secondary px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Completion Message */}
      {isComplete && (
        <p className="text-xs text-success text-center mt-2">
          Goal reached! Every {unit} counted.
        </p>
      )}
    </div>
  )
}
