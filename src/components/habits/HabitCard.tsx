'use client'

import Link from 'next/link'
import { Check, Moon } from 'lucide-react'
import type { HabitWithStatus, CheckInStatus } from '@/types'
import { getCategoryColor, formatStreakLabel } from '@/lib/utils'
import { shouldShowForgiveness } from '@/lib/streak'

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
  
  // Check if habit is on grace day
  const lastCheckInDate = habit.check_ins?.sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? null
  const isOnGrace = shouldShowForgiveness(habit.current_streak, lastCheckInDate)

  const getCategoryBorderColor = () => {
    if (habit.category_id === 'build_up') return 'border-l-brand'
    if (habit.category_id === 'break_free') return 'border-l-amber'
    if (habit.category_id === 'rhythm') return 'border-l-[#0EA5E9]'
    if (habit.category_id === 'mind_spirit') return 'border-l-accent'
    return 'border-l-brand'
  }

  const cardBorder = isOnGrace
    ? 'border border-amber/30 shadow-card-amber'
    : status === 'honest_slip'
    ? 'border border-slip/25 shadow-card-slip'
    : status === 'done'
    ? 'border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
    : 'border border-border shadow-card'

  const streakBg = habit.current_streak >= 30
    ? 'bg-gradient-to-r from-success-soft/20 to-transparent'
    : ''

  function handleQuickLog(e: React.MouseEvent, newStatus: CheckInStatus) {
    e.preventDefault()
    e.stopPropagation()
    // Don't allow re-logging if already logged today
    if (habit.today_status !== null) return
    onStatusChange?.(habit.id, newStatus)
  }

  const content = (
    <div className={`bg-white ${cardBorder} ${getCategoryBorderColor()} border-l-[3px] ${streakBg} rounded-card p-4 flex items-center gap-3 hover:shadow-hover transition-all duration-200 group`}>
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: iconBg }}
      >
        {habit.icon_emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={`font-medium text-sm truncate ${
            status === 'done' || status === 'partial' ? 'text-text-secondary' : 'text-text-primary'
          }`}>
            {habit.name}
          </div>
          {isOnGrace && (
            <span className="px-2 py-0.5 bg-amber/10 border border-amber/30 rounded-full text-[10px] font-medium text-amber-700 whitespace-nowrap">
              Grace day
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isOnGrace ? (
            <span className="text-xs text-amber-700 font-medium">
              Tonight is still today
            </span>
          ) : habit.current_streak > 0 ? (
            <span className="font-mono text-xs font-medium text-streak-fire">
              {habit.current_streak} 🔥
            </span>
          ) : (
            <span className="text-xs text-text-tertiary">
              {habit.today_status === null ? 'Not logged today' : 'Logged today'}
            </span>
          )}
          {!isOnGrace && habit.category_id === 'break_free' && habit.current_streak >= 1 && (
            <span className="text-xs text-text-tertiary">• Day {habit.current_streak}</span>
          )}
        </div>
      </div>

      {/* Streak milestone badge */}
      {habit.current_streak >= 7 && (
        <div className="flex-shrink-0">
          {habit.current_streak >= 365 ? (
            <div className="w-8 h-8 rounded-full border-[3px] border-double border-accent flex items-center justify-center">
              <span className="text-xs">👑</span>
            </div>
          ) : habit.current_streak >= 90 ? (
            <div className="w-8 h-8 rounded-full border-[3px] border-accent flex items-center justify-center">
              <span className="text-xs">💎</span>
            </div>
          ) : habit.current_streak >= 30 ? (
            <div className="w-8 h-8 rounded-full border-[2px] border-streak-fire flex items-center justify-center">
              <span className="text-xs">⭐</span>
            </div>
          ) : habit.current_streak >= 7 ? (
            <div className="w-8 h-8 rounded-full border-[2px] border-amber flex items-center justify-center">
              <span className="text-xs">✨</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Status button */}
      <button
        onClick={(e) => handleQuickLog(e, status === 'done' ? 'skip' : 'done')}
        disabled={habit.today_status !== null}
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
          habit.today_status !== null 
            ? 'opacity-40 cursor-not-allowed' 
            : 'active:scale-95 hover:scale-105'
        } ${
          status ? STATUS_BUTTON_CLASSES[status] : STATUS_BUTTON_CLASSES.default
        }`}
        aria-label={habit.today_status !== null ? 'Already logged today' : status === 'done' ? 'Mark as not done' : 'Mark as done'}
      >
        {status === 'done' && <Check className="w-4 h-4" />}
        {status === 'partial' && (
          <div
            className="w-5 h-5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #0D9E75 50%, white 50%)',
            }}
          />
        )}
        {status === 'honest_slip' && <span className="text-sm">~</span>}
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
