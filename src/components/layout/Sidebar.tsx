'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, Plus, BarChart2, User, BookOpen, Lock, Settings } from 'lucide-react'
import type { HabitWithStatus } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Today' },
  { href: '/habits', icon: CheckSquare, label: 'Habits' },
  { href: '/log', icon: Plus, label: 'Log check-in' },
  { href: '/graphs', icon: BarChart2, label: 'Graphs' },
  { href: '/reflect', icon: BookOpen, label: 'Reflect' },
  { href: '/vault', icon: Lock, label: 'Private vault' },
]

interface SidebarProps {
  habits?: HabitWithStatus[]
  displayName?: string | null
}

export default function Sidebar({ habits = [], displayName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-surface border-r border-brand/10 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand/10">
        <Link href="/dashboard" className="font-display text-brand text-2xl font-light hover:opacity-80 transition-opacity">
          Mirror
        </Link>
        {displayName && (
          <p className="text-muted text-xs mt-1 font-mono">{displayName}</p>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Sidebar navigation">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-btn mb-0.5 text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-accent-light text-brand font-semibold'
                  : 'text-muted hover:text-brand hover:bg-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Habit quick-list */}
        {habits.length > 0 && (
          <div className="mt-4 pt-4 border-t border-brand/10">
            <p className="px-3 text-[10px] font-mono text-muted uppercase tracking-widest mb-2">
              Today&apos;s habits
            </p>
            {habits.slice(0, 5).map(habit => (
              <Link
                key={habit.id}
                href={`/habits/${habit.id}`}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted hover:text-brand hover:bg-white rounded-btn transition-colors duration-150"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: habit.today_status === 'done' ? '#0D9E75'
                      : habit.today_status === 'partial' ? '#9B93E8'
                      : habit.today_status === 'honest_slip' ? '#B87D0E'
                      : '#E5E7EB'
                  }}
                />
                <span className="truncate">{habit.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Settings */}
      <div className="px-3 py-3 border-t border-brand/10">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm transition-all duration-150 ${
            pathname === '/profile' ? 'bg-accent-light text-brand font-semibold' : 'text-muted hover:text-brand hover:bg-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
