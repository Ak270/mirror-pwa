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

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${logged} of ${total} habits logged today`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#F4F4FF"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      {total > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progress === 1 ? '#0D9E75' : '#6C63FF'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
          }}
        />
      )}
      {/* Center text */}
      <text
        x={center}
        y={center + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size > 60 ? 14 : 11}
        fontWeight="600"
        fill="#2D2D7B"
        fontFamily="var(--font-dm-sans), sans-serif"
      >
        {logged}/{total}
      </text>
    </svg>
  )
}
