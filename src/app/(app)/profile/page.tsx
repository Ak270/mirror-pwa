'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfile, upsertProfile } from '@/lib/habits'
import { subscribeToPush, saveSubscriptionToServer, requestNotificationPermission } from '@/lib/notifications'
import type { Profile } from '@/types'
import { Bell, Download, LogOut, User, Shield, Smartphone, Copy, Check as CheckIcon, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'subscribing'>('unknown')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [testingNotif, setTestingNotif] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Check if user is anonymous
    setIsAnonymous(user.is_anonymous || false)
    if (user.is_anonymous) {
      const createdAt = localStorage.getItem('mirror_anon_created_at')
      if (createdAt) {
        const created = new Date(createdAt)
        const now = new Date()
        const daysPassed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        const daysLeft = Math.max(0, 7 - daysPassed)
        setTrialDaysLeft(daysLeft)
      }
    }
    
    const p = await getProfile(supabase, user.id)
    setProfile(p)
    setDisplayName(p?.display_name ?? '')
    if ('Notification' in window) {
      setNotifStatus(Notification.permission as 'granted' | 'denied' | 'unknown')
    }
    const { data: { session } } = await supabase.auth.getSession()
    setAccessToken(session?.access_token ?? null)
    
    // Check dark mode preference
    const theme = localStorage.getItem('mirror-theme') || 'light'
    setDarkMode(theme === 'dark')
  }, [supabase])

  useEffect(() => { loadProfile() }, [loadProfile])

  async function handleSaveName() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    await upsertProfile(supabase, user.id, { display_name: displayName.trim() || null })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await loadProfile()
  }

  async function handleEnableNotifications() {
    setNotifStatus('subscribing')
    const permission = await requestNotificationPermission()
    if (permission === 'granted') {
      const sub = await subscribeToPush()
      if (sub) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await saveSubscriptionToServer(sub, user.id)
      }
      setNotifStatus('granted')
    } else {
      setNotifStatus('denied')
    }
  }

  async function handleTestNotification() {
    setTestingNotif(true)
    setTestResult(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      setTestResult(data.success ? 'success' : data.error || 'Failed')
    } catch (err) {
      setTestResult('Network error')
    } finally {
      setTestingNotif(false)
      setTimeout(() => setTestResult(null), 5000)
    }
  }

  async function handleExport(format: 'json' | 'csv') {
    const res = await fetch(`/api/export?format=${format}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mirror-export.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleUpgradeAccount() {
    setUpgrading(true)
    // Redirect to login page to create permanent account
    // The migration will happen after they sign up
    router.push('/login?upgrade=true')
  }

  function toggleDarkMode() {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('mirror-theme', newMode ? 'dark' : 'light')
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      <h1 className="font-display text-brand font-light text-2xl mb-6">Settings</h1>

      {/* Trial upgrade banner for anonymous users */}
      {isAnonymous && (
        <div className="mirror-card p-5 mb-4 bg-accent-light border-2 border-accent/40">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-brand text-sm">Upgrade Your Account</h2>
            {trialDaysLeft !== null && trialDaysLeft > 0 && (
              <span className="ml-auto text-xs font-mono bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
              </span>
            )}
          </div>
          <p className="text-sm text-muted mb-4">
            {trialDaysLeft !== null && trialDaysLeft > 0
              ? 'Create a permanent account to keep your data forever. All your habits and progress will be migrated automatically.'
              : 'Your trial has ended. Create an account now to keep all your progress.'}
          </p>
          <button
            onClick={handleUpgradeAccount}
            disabled={upgrading}
            className="mirror-btn-primary w-full disabled:opacity-60"
          >
            {upgrading ? 'Redirecting...' : 'Create Account'}
          </button>
        </div>
      )}

      {/* Profile */}
      <div className="mirror-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-brand text-sm">Profile</h2>
        </div>
        <div>
          <label className="mirror-label" htmlFor="display-name">Display name</label>
          <div className="flex gap-2">
            <input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name (optional)"
              className="mirror-input flex-1"
              maxLength={50}
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              className="mirror-btn-primary px-4 py-2.5 text-sm disabled:opacity-60 flex-shrink-0"
            >
              {saving ? '…' : saved ? '✓' : 'Save'}
            </button>
          </div>
        </div>
        {profile?.email && (
          <p className="text-xs text-muted mt-3">{profile.email}</p>
        )}
      </div>

      {/* Notifications */}
      <div className="mirror-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-brand text-sm">Notifications</h2>
        </div>
        {notifStatus === 'granted' ? (
          <div className="space-y-3">
            <div className="text-sm text-success font-medium">
              ✓ Notifications enabled. Mirror will remind you 15, 10, 5 minutes before your scheduled habits.
            </div>
            <button
              onClick={handleTestNotification}
              disabled={testingNotif}
              className="mirror-btn-secondary text-sm py-2.5 w-full disabled:opacity-60"
            >
              {testingNotif ? 'Sending...' : 'Test Notifications'}
            </button>
            {testResult && (
              <p className={`text-sm ${testResult === 'success' ? 'text-success' : 'text-slip'}`}>
                {testResult === 'success' ? '✓ Test notification sent! Check your notifications.' : `✗ ${testResult}`}
              </p>
            )}
          </div>
        ) : notifStatus === 'denied' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              No problem. You can enable notifications later from your browser settings, or use the iOS Shortcut instead.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/habits/today`}
              className="text-accent text-sm underline"
              target="_blank"
              rel="noreferrer"
            >
              Set up iOS Shortcut →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Get a quiet nudge when you haven&apos;t logged yet. No pressure — Mirror only reminds once.
            </p>
            <button
              onClick={handleEnableNotifications}
              disabled={notifStatus === 'subscribing'}
              className="mirror-btn-primary text-sm py-2.5 disabled:opacity-60"
            >
              {notifStatus === 'subscribing' ? 'Setting up…' : 'Enable notifications'}
            </button>
          </div>
        )}
      </div>

      {/* Data export */}
      <div className="mirror-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-brand text-sm">Export your data</h2>
        </div>
        <p className="text-sm text-muted mb-3">Your data is yours. Export it any time.</p>
        <div className="flex gap-2">
          <button onClick={() => handleExport('json')} className="mirror-btn-secondary flex-1 text-sm py-2.5">
            Export JSON
          </button>
          <button onClick={() => handleExport('csv')} className="mirror-btn-secondary flex-1 text-sm py-2.5">
            Export CSV
          </button>
        </div>
      </div>

      {/* Mobile Setup */}
      <div className="mirror-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-brand text-sm">Mobile Setup</h2>
        </div>
        
        <div className="space-y-4">
          {/* iOS Instructions */}
          <div>
            <p className="text-sm font-semibold text-brand mb-2">iOS (iPhone/iPad)</p>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Open Safari and visit this page</li>
              <li>Tap the Share button (square with arrow)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" — Mirror will appear on your home screen</li>
            </ol>
            <p className="text-xs text-muted mt-2 italic">
              For Siri shortcuts: Copy your token below and use the Shortcuts app to create custom voice commands.
            </p>
          </div>

          {/* Android Instructions */}
          <div className="pt-3 border-t border-brand/10">
            <p className="text-sm font-semibold text-brand mb-2">Android</p>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Open Chrome and visit this page</li>
              <li>Tap the menu (three dots)</li>
              <li>Tap "Add to Home screen" or "Install app"</li>
              <li>Tap "Add" — Mirror will appear on your home screen</li>
            </ol>
            <p className="text-xs text-muted mt-2 italic">
              You'll get notifications and offline access just like a native app.
            </p>
          </div>

          {/* API Token for advanced users */}
          {accessToken && (
            <div className="pt-3 border-t border-brand/10">
              <p className="text-sm font-semibold text-brand mb-2">API Token (Advanced)</p>
              <p className="text-xs text-muted mb-2">
                Use this token to integrate Mirror with iOS Shortcuts, Tasker, or custom automations.
              </p>
              <div className="flex gap-2">
                <code className="flex-1 bg-surface border border-brand/10 rounded-btn px-3 py-2 text-xs font-mono text-muted truncate">
                  {accessToken.slice(0, 24)}…
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(accessToken)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="mirror-btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm flex-shrink-0"
                >
                  {copied ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1">
                Endpoint: <code className="font-mono">/api/habits/today?token=YOUR_TOKEN</code>
              </p>
            </div>
          )}

          {/* Widget Setup */}
          {accessToken && (
            <div className="pt-3 border-t border-brand/10">
              <p className="text-sm font-semibold text-brand mb-3">📱 Home Screen Widgets</p>
              
              {/* iOS Widget */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-brand mb-2">iOS Widget (Scriptable)</p>
                <ol className="text-xs text-muted space-y-1.5 list-decimal list-inside mb-2">
                  <li>Install the free "Scriptable" app from App Store</li>
                  <li>Download the widget script: <a href="/MirrorWidget.js" className="text-accent underline" download>MirrorWidget.js</a></li>
                  <li>Open Scriptable, tap +, paste the script</li>
                  <li>Edit line 5: Replace <code className="font-mono text-[10px]">YOUR_API_TOKEN_HERE</code> with your token above</li>
                  <li>Edit line 6: Replace URL with your Mirror app URL</li>
                  <li>Save, then add Scriptable widget to home screen</li>
                  <li>Long-press widget → Edit Widget → choose "MirrorWidget"</li>
                </ol>
                <p className="text-[10px] text-muted italic">
                  Widget updates every 15 minutes and shows your daily progress.
                </p>
              </div>

              {/* Android Widget */}
              <div>
                <p className="text-xs font-semibold text-brand mb-2">Android Widget (Chrome 120+)</p>
                <ol className="text-xs text-muted space-y-1.5 list-decimal list-inside mb-2">
                  <li>Install Mirror as PWA (see instructions above)</li>
                  <li>Long-press on home screen → Widgets</li>
                  <li>Find "Mirror Habits" in widget list</li>
                  <li>Drag to home screen</li>
                  <li>Widget will auto-update with your habits</li>
                </ol>
                <p className="text-[10px] text-muted italic">
                  Requires Chrome 120+ on Android. Widget syncs automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="mirror-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          {darkMode ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-accent" />}
          <h2 className="font-semibold text-brand text-sm">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Dark mode</p>
            <p className="text-xs text-muted mt-0.5">Easier on the eyes at night</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              darkMode ? 'bg-accent' : 'bg-gray-300'
            }`}
            aria-label="Toggle dark mode"
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {darkMode ? (
                <Moon className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="mirror-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-brand text-sm">Privacy</h2>
        </div>
        <div className="space-y-2 text-sm text-muted">
          <p>No ads. No data sharing. No tracking.</p>
          <p>Private vault habits are stored only on this device and are never transmitted.</p>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted hover:text-slip border border-brand/10 rounded-btn transition-colors mt-2"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  )
}
