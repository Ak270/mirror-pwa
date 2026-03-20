'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import type { CheckIn } from '@/types'

interface QuantifiableChartProps {
  checkIns: CheckIn[]
  habitName: string
}

export default function QuantifiableChart({ checkIns, habitName }: QuantifiableChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Filter check-ins with quantifiable data
  const quantifiableCheckIns = checkIns.filter(c => c.quantifiable_value !== null)

  if (quantifiableCheckIns.length === 0) {
    return null // Don't show chart if no quantifiable data
  }

  // Get the most common unit
  const units = quantifiableCheckIns.map(c => c.quantifiable_unit).filter(Boolean)
  const unitCounts = units.reduce((acc, unit) => {
    acc[unit!] = (acc[unit!] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const primaryUnit = Object.entries(unitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'units'

  // Filter by time range
  const now = new Date()
  const rangeStart = timeRange === 'all' ? new Date(0) :
    timeRange === '7d' ? subDays(now, 7) :
    timeRange === '30d' ? subDays(now, 30) :
    subDays(now, 90)

  const filteredData = quantifiableCheckIns
    .filter(c => new Date(c.date) >= rangeStart)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(c => ({
      date: format(new Date(c.date), 'MMM d'),
      value: c.quantifiable_value,
      unit: c.quantifiable_unit,
    }))

  // Calculate statistics
  const total = filteredData.reduce((sum, d) => sum + (d.value || 0), 0)
  const average = filteredData.length > 0 ? total / filteredData.length : 0
  const max = Math.max(...filteredData.map(d => d.value || 0))

  // Calculate trend (simple: compare first half vs second half)
  const midpoint = Math.floor(filteredData.length / 2)
  const firstHalf = filteredData.slice(0, midpoint)
  const secondHalf = filteredData.slice(midpoint)
  const firstAvg = firstHalf.reduce((sum, d) => sum + (d.value || 0), 0) / (firstHalf.length || 1)
  const secondAvg = secondHalf.reduce((sum, d) => sum + (d.value || 0), 0) / (secondHalf.length || 1)
  const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable'

  return (
    <div className="mirror-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-brand">Progress Tracking</h3>
        <div className="flex gap-1">
          {(['7d', '30d', '90d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs rounded-btn transition-colors ${
                timeRange === range
                  ? 'bg-accent text-white'
                  : 'text-muted hover:bg-surface'
              }`}
            >
              {range === 'all' ? 'All' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface rounded-btn p-3">
          <p className="text-xs text-muted mb-1">Total</p>
          <p className="text-lg font-semibold text-brand">
            {total.toFixed(1)} <span className="text-sm font-normal text-muted">{primaryUnit}</span>
          </p>
        </div>
        <div className="bg-surface rounded-btn p-3">
          <p className="text-xs text-muted mb-1">Average</p>
          <p className="text-lg font-semibold text-brand">
            {average.toFixed(1)} <span className="text-sm font-normal text-muted">{primaryUnit}</span>
          </p>
        </div>
        <div className="bg-surface rounded-btn p-3">
          <p className="text-xs text-muted mb-1">Trend</p>
          <p className="text-lg font-semibold">
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            <span className={`ml-1 text-sm ${
              trend === 'up' ? 'text-success' : trend === 'down' ? 'text-slip' : 'text-muted'
            }`}>
              {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
            </span>
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#666' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666' }}
              tickLine={false}
              label={{ value: primaryUnit, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#666' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB', 
                borderRadius: '12px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} ${props.payload.unit || primaryUnit}`,
                habitName
              ]}
            />
            <Bar dataKey="value" fill="#6C63FF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted mt-3 text-center">
        Showing {filteredData.length} entries with measurable data
      </p>
    </div>
  )
}
