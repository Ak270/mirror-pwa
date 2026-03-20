'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts'
import { subDays, format, parseISO, isWithinInterval } from 'date-fns'
import type { CheckIn } from '@/types'

type Range = '7d' | '30d' | '90d' | 'all'

interface TrendLineProps {
  checkIns: CheckIn[]
  habitName: string
}

const RANGE_DAYS: Record<Range, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
}

const MILESTONES = [7, 21, 30, 66, 100]

export default function TrendLine({ checkIns, habitName }: TrendLineProps) {
  const [range, setRange] = useState<Range>('30d')

  const data = useMemo(() => {
    const days = RANGE_DAYS[range]
    const end = new Date()
    const start = days ? subDays(end, days) : (checkIns.length > 0
      ? parseISO(checkIns[checkIns.length - 1].date)
      : subDays(end, 30))

    const windowCheckIns = checkIns.filter(ci => {
      const d = parseISO(ci.date)
      return isWithinInterval(d, { start, end })
    })

    const points: { date: string; rate: number; dayNum: number }[] = []
    let window: CheckIn[] = []

    for (let i = 0; i <= (days ?? 90); i++) {
      const day = subDays(end, (days ?? 90) - i)
      const dateStr = format(day, 'yyyy-MM-dd')
      const ci = windowCheckIns.find(c => c.date === dateStr)

      if (ci) window.push(ci)
      if (window.length > 7) window.shift()

      const rate = window.length > 0
        ? (window.filter(c => c.status === 'done' || c.status === 'partial').length / window.length) * 100
        : null

      if (rate !== null) {
        points.push({ date: format(day, 'MMM d'), rate: Math.round(rate), dayNum: i + 1 })
      }
    }

    return points
  }, [checkIns, range])

  const completionRate = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="font-semibold text-brand text-sm truncate max-w-[200px]">{habitName}</p>
          <p className="text-xs text-muted mt-0.5">{completionRate}% avg completion</p>
        </div>
        <div className="flex gap-1 bg-surface rounded-btn p-1">
          {(['7d', '30d', '90d', 'all'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all duration-100 ${
                range === r ? 'bg-white text-brand shadow-sm' : 'text-muted hover:text-brand'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {data.length < 3 ? (
        <div className="text-center py-8 text-muted text-sm">
          <p className="font-display text-brand text-base font-light mb-1">Your pattern needs a few more days to emerge.</p>
          <p>Keep going.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4FF" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'var(--font-dm-mono)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: '#9CA3AF', fontFamily: 'var(--font-dm-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            {MILESTONES.map(m => (
              data.some(d => d.dayNum === m) && (
                <ReferenceLine
                  key={m}
                  x={data.find(d => d.dayNum === m)?.date}
                  stroke="rgba(108,99,255,0.3)"
                  strokeDasharray="4 4"
                  label={{ value: `${m}d ✦`, position: 'top', fontSize: 8, fill: '#6C63FF', fontFamily: 'var(--font-dm-sans)' }}
                />
              )
            ))}
            <Tooltip
              contentStyle={{ background: 'white', border: '1px solid rgba(45,45,123,0.1)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`${v}%`, 'Completion']}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#6C63FF"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="url(#trendFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#6C63FF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
