'use client'

import Link from 'next/link'
import { Check, Moon } from 'lucide-react'
import type { HabitWithStatus, CheckInStatus } from '@/types'
import { getCategoryColor, formatStreakLabel } from '@/lib/utils'

interface HabitCardProps {
  habit: HabitWithStatus
  onStatusChange?: (habitId: string, status: CheckInStatus) => void
  showLink?: boolean
}

const STATUS_BUTTON_CLASSES: Record<string, string> = {
  done: 'bg-success border-success text-white',
  partial: 'border-success',
  skip: 'bg-gray-100 border-gray-200',
  honest_slip: 'bg-slip-light border-slip/40',
  default: 'border-brand/15 hover:border-accent',
}

export default function HabitCard({ habit, onStatusChange, showLink = true }: HabitCardProps) {
  const iconBg = getCategoryColor(habit.category_id)
  const status = habit.today_status

  const cardBorder = status === 'honest_slip'
    ? 'border border-slip/25 shadow-card-slip'
    : 'border border-brand/10 shadow-card'

  function handleQuickLog(e: React.MouseEvent, newStatus: CheckInStatus) {
    e.preventDefault()
    e.stopPropagation()
    onStatusChange?.(habit.id, newStatus)
  }

  const content = (
    <div className={`bg-white ${cardBorder} rounded-card p-4 flex items-center gap-3 hover:shadow-hover transition-shadow duration-200 group`}>
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: iconBg }}
      >
        {habit.icon_emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm truncate">{habit.name}</div>
        <div className="text-xs text-muted mt-0.5">
          {habit.current_streak > 0
            ? `🔥 ${formatStreakLabel(habit.current_streak)} streak`
            : habit.today_status === null
            ? 'Not logged today'
            : 'Logged today'}
        </div>
      </div>

      {/* Status button */}
      <button
        onClick={(e) => handleQuickLog(e, status === 'done' ? 'skip' : 'done')}
        className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95 ${
          status ? STATUS_BUTTON_CLASSES[status] : STATUS_BUTTON_CLASSES.default
        }`}
        aria-label={status === 'done' ? 'Mark as not done' : 'Mark as done'}
      >
        {status === 'done' && <Check className="w-4 h-4" />}
        {status === 'partial' && (
          <div
            className="w-full h-full rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #0D9E75 50%, white 50%)',
            }}
          />
        )}
        {status === 'honest_slip' && <Moon className="w-4 h-4 text-slip" />}
      </button>
    </div>
  )

  if (!showLink) return content

  return (
    <Link href={`/habits/${habit.id}`} className="block">
      {content}
    </Link>
  )
}
