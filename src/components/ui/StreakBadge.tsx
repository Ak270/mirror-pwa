'use client'

import { getStreakMilestone } from '@/lib/streak'

interface StreakBadgeProps {
  streak: number
  bestStreak?: number
  showMilestone?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StreakBadge({ streak, bestStreak, showMilestone = true, size = 'md' }: StreakBadgeProps) {
  const milestone = showMilestone ? getStreakMilestone(streak) : null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }

  if (streak === 0) {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} bg-surface text-muted rounded-pill font-mono border border-brand/10`}>
        Start today
      </span>
    )
  }

  const isOnFire = streak >= 7
  const isLong = streak >= 30

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-pill font-mono font-semibold ${
      isLong
        ? 'bg-accent-light text-brand border border-accent/30'
        : isOnFire
        ? 'bg-[#FFF5D6] text-slip border border-slip/20'
        : 'bg-success-light text-success border border-success/20'
    }`}>
      {isOnFire ? '🔥' : '✦'}
      <span>{streak}d</span>
      {milestone && (
        <span className="ml-1 text-accent text-xs">milestone</span>
      )}
      {bestStreak && bestStreak > streak && (
        <span className="opacity-50 ml-1">/{bestStreak}</span>
      )}
    </span>
  )
}
