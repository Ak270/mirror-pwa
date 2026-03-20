'use client'

import { useMemo, useState } from 'react'
import {
  eachDayOfInterval,
  subMonths,
  format,
  getDay,
  parseISO,
  isSameDay,
} from 'date-fns'
import type { CheckIn, CheckInStatus } from '@/types'

interface HeatmapCalendarProps {
  checkIns: CheckIn[]
  months?: number
}

const STATUS_COLOR: Record<string, string> = {
  done: '#2D2D7B',
  partial: '#9B93E8',
  honest_slip: '#B87D0E',
  skip: '#E5E7EB',
  none: '#F3F4F6',
}

const DAY_LABELS = ['M', '', 'W', '', 'F', '', '']

export default function HeatmapCalendar({ checkIns, months = 3 }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{
    date: string; status: string | null; x: number; y: number
  } | null>(null)

  const CELL_SIZE = 12
  const CELL_GAP = 2

  const data = useMemo(() => {
    const end = new Date()
    const start = subMonths(end, months)
    const days = eachDayOfInterval({ start, end })

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const ci = checkIns.find(c => c.date === dateStr)
      return { date: day, dateStr, status: ci?.status ?? null }
    })
  }, [checkIns, months])

  const weeks = useMemo(() => {
    const result: typeof data[] = []
    let week: typeof data = []

    // pad start
    const firstDay = data[0]?.date
    if (firstDay) {
      const dow = (getDay(firstDay) + 6) % 7
      for (let i = 0; i < dow; i++) week.push({ date: new Date(0), dateStr: '', status: null })
    }

    data.forEach(day => {
      week.push(day)
      if (week.length === 7) {
        result.push(week)
        week = []
      }
    })
    if (week.length > 0) result.push(week)

    return result
  }, [data])

  const svgWidth = weeks.length * (CELL_SIZE + CELL_GAP)
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 20

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg
        width={svgWidth + 24}
        height={svgHeight}
        aria-label={`Habit heatmap for the past ${months} months`}
        role="img"
      >
        {/* Day labels */}
        {DAY_LABELS.map((label, i) => label ? (
          <text
            key={i}
            x={0}
            y={i * (CELL_SIZE + CELL_GAP) + CELL_SIZE}
            fontSize={8}
            fill="#9CA3AF"
            fontFamily="var(--font-dm-mono), monospace"
            dominantBaseline="middle"
          >
            {label}
          </text>
        ) : null)}

        {/* Cells */}
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            if (!day.dateStr) return null
            const color = STATUS_COLOR[day.status ?? 'none']
            const x = 20 + wi * (CELL_SIZE + CELL_GAP)
            const y = di * (CELL_SIZE + CELL_GAP)
            return (
              <rect
                key={`${wi}-${di}`}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={3}
                fill={color}
                onMouseEnter={(e) => {
                  setTooltip({
                    date: format(day.date, 'MMM d, yyyy'),
                    status: day.status,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
                className="transition-transform hover:scale-125 cursor-default"
                style={{ transformOrigin: `${x + CELL_SIZE / 2}px ${y + CELL_SIZE / 2}px` }}
              />
            )
          })
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap mt-3">
        {[
          { label: 'Done', color: STATUS_COLOR.done },
          { label: 'Partial', color: STATUS_COLOR.partial },
          { label: 'Honest slip', color: STATUS_COLOR.honest_slip },
          { label: 'Skipped', color: STATUS_COLOR.skip },
          { label: 'No data', color: STATUS_COLOR.none },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted font-mono">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-brand/15 shadow-hover rounded-btn px-3 py-2 text-xs pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, transform: 'translateY(-100%)' }}
        >
          <div className="font-semibold text-brand">{tooltip.date}</div>
          <div className="text-muted mt-0.5">{tooltip.status ?? 'No data'}</div>
        </div>
      )}
    </div>
  )
}
