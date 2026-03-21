'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('mirror-theme') as 'light' | 'dark' | null
    const initial = stored || 'light'
    setTheme(initial)
    if (initial === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('mirror-theme', newTheme)
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-4 py-2.5 rounded-btn border border-brand/10 hover:border-brand/20 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4" />
          <span className="text-sm">Dark mode</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          <span className="text-sm">Light mode</span>
        </>
      )}
    </button>
  )
}
