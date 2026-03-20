'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, Plus, BarChart2, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/habits', icon: CheckSquare, label: 'Habits' },
  { href: '/log', icon: Plus, label: 'Log', isFab: true },
  { href: '/graphs', icon: BarChart2, label: 'Graphs' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-brand/10 lg:hidden safe-area-pb"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, isFab }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          if (isFab) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center -mt-3"
                aria-label={label}
              >
                <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/40 hover:bg-brand/90 active:scale-95 transition-all duration-150">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 min-w-[44px] min-h-[44px] justify-center transition-colors duration-150 ${
                isActive ? 'text-brand' : 'text-muted hover:text-brand'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-brand -mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
