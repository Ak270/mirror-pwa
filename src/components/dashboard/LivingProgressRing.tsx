'use client'

import { useEffect, useState } from 'react'
import { motion, useAnimate } from 'framer-motion'

interface LivingProgressRingProps {
  logged: number
  total: number
  size?: number
  strokeWidth?: number
  livingInsight?: string
  onThresholdCross?: (threshold: number) => void
}

export default function LivingProgressRing({
  logged,
  total,
  size = 120,
  strokeWidth = 10,
  livingInsight,
  onThresholdCross,
}: LivingProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? logged / total : 0
  const pct = Math.round(progress * 100)
  const dashOffset = circumference * (1 - progress)
  const center = size / 2
  const isComplete = progress === 1

  const [scope, animate] = useAnimate()
  const [prevPct, setPrevPct] = useState(pct)

  // Determine ring state based on completion percentage
  const getRingState = (percentage: number) => {
    if (percentage === 0) return { color: '#6C63FF', label: 'Day is open', pulse: false }
    if (percentage < 30) return { color: '#7C72FF', label: 'Starting', pulse: true, pulseSpeed: 4 }
    if (percentage < 50) return { color: '#8B77FF', label: 'Building', pulse: true, pulseSpeed: 3 }
    if (percentage < 70) return { color: '#9E82FF', label: 'Halfway', pulse: true, pulseSpeed: 2.5 }
    if (percentage < 80) return { color: '#B090FF', label: 'Strong day', pulse: true, pulseSpeed: 2 }
    if (percentage < 90) return { color: '#C4A0FF', label: 'Almost there', pulse: true, pulseSpeed: 2, glow: true }
    if (percentage < 100) return { color: '#D4B0FF', label: 'One more', pulse: true, pulseSpeed: 1.5, glow: true, showOneMore: true }
    return { color: '#10B981', label: 'You showed up', pulse: false, complete: true }
  }

  const state = getRingState(pct)

  // Detect threshold crossing and trigger callback
  useEffect(() => {
    const thresholds = [10, 30, 50, 70, 80, 90, 100]
    const crossedThreshold = thresholds.find(t => prevPct < t && pct >= t)
    if (crossedThreshold && onThresholdCross) {
      onThresholdCross(crossedThreshold)
    }
    setPrevPct(pct)
  }, [pct, prevPct, onThresholdCross])

  // Completion animation
  useEffect(() => {
    if (isComplete && scope.current) {
      // Color flood animation
      animate(scope.current, 
        { scale: [1, 1.05, 1] },
        { duration: 1.2, ease: 'easeOut' }
      )
    }
  }, [isComplete, animate, scope])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" ref={scope}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`${logged} of ${total} habits logged today`}
          role="img"
          className={state.glow ? 'drop-shadow-[0_0_12px_rgba(192,160,255,0.4)]' : state.complete ? 'drop-shadow-[0_0_16px_rgba(16,185,129,0.5)]' : ''}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress with pulse animation */}
          {total > 0 && (
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={state.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              animate={state.pulse ? {
                opacity: [1, 0.7, 1],
              } : {}}
              transition={state.pulse ? {
                duration: state.pulseSpeed,
                repeat: Infinity,
                ease: 'easeInOut'
              } : {}}
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
              }}
            />
          )}

          {/* Center text */}
          <text
            x={center}
            y={center + 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={state.showOneMore ? "11" : "18"}
            fontWeight="600"
            fill={state.complete ? '#10B981' : '#2D2D7B'}
            fontFamily="JetBrains Mono, monospace"
            className={state.complete ? 'animate-pulse' : ''}
          >
            {state.showOneMore ? 'ONE MORE' : `${logged}/${total}`}
          </text>
        </svg>

        {/* Particle burst on completion */}
        {isComplete && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-success rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 40,
                  y: Math.sin((i * Math.PI * 2) / 8) * 40,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Living insight */}
      {livingInsight && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-xs"
        >
          <p className="text-xs uppercase tracking-wider text-muted mb-1">{state.label}</p>
          <p className="text-sm text-brand leading-relaxed">{livingInsight}</p>
        </motion.div>
      )}
    </div>
  )
}
