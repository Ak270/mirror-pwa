'use client'

interface TemperatureDisplayProps {
  streakDays: number
  habitName: string
}

export default function TemperatureDisplay({ streakDays, habitName }: TemperatureDisplayProps) {
  const getTemperatureColor = (days: number): string => {
    if (days <= 3) return '#EF4444' // red, hot
    if (days <= 7) return '#F97316' // orange
    if (days <= 21) return '#EAB308' // yellow, cooling
    if (days <= 60) return '#84CC16' // lime
    if (days <= 90) return '#22C55E' // green
    if (days <= 180) return '#06B6D4' // cyan, cool
    return '#3B82F6' // deep blue, cold
  }

  const getTemperatureLabel = (days: number): string => {
    if (days <= 3) return 'Hot'
    if (days <= 7) return 'Warm'
    if (days <= 21) return 'Cooling'
    if (days <= 60) return 'Cool'
    if (days <= 90) return 'Cold'
    if (days <= 180) return 'Frozen'
    return 'Ice'
  }

  const color = getTemperatureColor(streakDays)
  const label = getTemperatureLabel(streakDays)

  return (
    <div className="flex items-center gap-2">
      {/* Thermometer icon */}
      <div className="relative w-6 h-6">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          {/* Thermometer outline */}
          <path
            d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Fill based on temperature */}
          <circle
            cx="11.5"
            cy="18"
            r="2.5"
            fill={color}
          />
          <rect
            x="10.5"
            y="6"
            width="2"
            height={Math.min(12, streakDays / 15)}
            fill={color}
            rx="1"
          />
        </svg>
      </div>

      {/* Day count and label */}
      <div className="flex flex-col">
        <span className="text-xs font-mono font-medium" style={{ color }}>
          Day {streakDays}
        </span>
        <span className="text-[10px] text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  )
}
