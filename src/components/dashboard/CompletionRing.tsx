'use client'

interface CompletionRingProps {
  logged: number
  total: number
  size?: number
  strokeWidth?: number
}

export default function CompletionRing({
  logged,
  total,
  size = 72,
  strokeWidth = 7,
}: CompletionRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? logged / total : 0
  const dashOffset = circumference * (1 - progress)
  const center = size / 2
  const isComplete = progress === 1

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`${logged} of ${total} habits logged today`}
        role="img"
        className={isComplete ? 'drop-shadow-[0_0_8px_rgba(13,158,117,0.3)]' : ''}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2D2D7B" />
            <stop offset="100%" stopColor="#6C63FF" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#EBEBEB"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        {total > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isComplete ? '#0D9E75' : 'url(#ringGradient)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
            }}
          />
        )}
        {/* Center text */}
        <text
          x={center}
          y={center + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fontWeight="500"
          fill="#2D2D7B"
          fontFamily="JetBrains Mono, monospace"
        >
          {logged}/{total}
        </text>
      </svg>
    </div>
  )
}
