'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfile, upsertProfile } from '@/lib/habits'
import { subscribeToPush, saveSubscriptionToServer, requestNotificationPermission } from '@/lib/notifications'
import type { Profile } from '@/types'
import { Bell, Download, LogOut, User, Shield, Smartphone, Copy, Check as CheckIcon } from 'lucide-react'
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

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const p = await getProfile(supabase, user.id)
    setProfile(p)
    setDisplayName(p?.display_name ?? '')
    if ('Notification' in window) {
      setNotifStatus(Notification.permission as 'granted' | 'denied' | 'unknown')
    }
    const { data: { session } } = await supabase.auth.getSession()
    setAccessToken(session?.access_token ?? null)
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

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6">
      <h1 className="font-display text-brand font-light text-2xl mb-6">Settings</h1>

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
