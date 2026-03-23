'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface TimeBasedProgressRingProps {
  habitName: string
  habitIcon: string
  dayStartTime: string // "05:00"
  dayEndTime: string // "22:00"
  currentTime?: Date
  lastCheckInStatus: 'held_on' | 'had_moment' | null
}

export default function TimeBasedProgressRing({
  habitName,
  habitIcon,
  dayStartTime,
  dayEndTime,
  currentTime = new Date(),
  lastCheckInStatus
}: TimeBasedProgressRingProps) {
  const [timeProgress, setTimeProgress] = useState(0)
  const [hoursRemaining, setHoursRemaining] = useState(0)

  useEffect(() => {
    function calculateProgress() {
      const now = currentTime
      const [startHour, startMin] = dayStartTime.split(':').map(Number)
      const [endHour, endMin] = dayEndTime.split(':').map(Number)

      // Create today's start and end times
      const dayStart = new Date(now)
      dayStart.setHours(startHour, startMin, 0, 0)

      const dayEnd = new Date(now)
      dayEnd.setHours(endHour, endMin, 0, 0)

      // If current time is before day start, use yesterday's day
      if (now < dayStart) {
        dayStart.setDate(dayStart.getDate() - 1)
        dayEnd.setDate(dayEnd.getDate() - 1)
      }

      const totalDayMs = dayEnd.getTime() - dayStart.getTime()
      const elapsedMs = now.getTime() - dayStart.getTime()
      const progress = Math.min(100, Math.max(0, (elapsedMs / totalDayMs) * 100))

      const remainingMs = dayEnd.getTime() - now.getTime()
      const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)))

      setTimeProgress(progress)
      setHoursRemaining(remainingHours)
    }

    calculateProgress()
    const interval = setInterval(calculateProgress, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dayStartTime, dayEndTime, currentTime])

  const getStateConfig = () => {
    if (lastCheckInStatus === 'had_moment') {
      return {
        color: '#F97316', // Orange - had a moment but day continues
        label: 'Day continues',
        message: "One moment doesn't define the whole day"
      }
    }

    if (lastCheckInStatus === 'held_on') {
      return {
        color: '#10B981', // Green - holding strong
        label: 'Holding strong',
        message: `${hoursRemaining}h left in your day`
      }
    }

    // No check-in yet
    if (timeProgress < 25) {
      return {
        color: '#6C63FF', // Purple - early day
        label: 'Day just started',
        message: 'Everything is still possible'
      }
    } else if (timeProgress < 50) {
      return {
        color: '#8B77FF', // Light purple
        label: 'Morning strength',
        message: `${hoursRemaining}h to go`
      }
    } else if (timeProgress < 75) {
      return {
        color: '#B090FF', // Lighter purple
        label: 'Afternoon focus',
        message: `${hoursRemaining}h remaining`
      }
    } else {
      return {
        color: '#D4B0FF', // Lightest purple - evening challenge
        label: 'Final stretch',
        message: `${hoursRemaining}h until reset`
      }
    }
  }

  const state = getStateConfig()
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeProgress / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {/* SVG Ring */}
      <div className="relative">
        <svg width="180" height="180" className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          
          {/* Progress arc */}
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={state.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl mb-1">{habitIcon}</span>
          <p className="text-2xl font-bold text-brand font-mono">
            {Math.round(timeProgress)}%
          </p>
          <p className="text-xs text-muted">{state.label}</p>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-center text-brand/80 mt-4 max-w-[200px]">
        {state.message}
      </p>

      {/* Time remaining indicator */}
      <div className="mt-3 px-4 py-2 bg-surface rounded-full">
        <p className="text-xs text-muted font-mono">
          {hoursRemaining}h {Math.floor((hoursRemaining % 1) * 60)}m until day reset
        </p>
      </div>
    </div>
  )
}
