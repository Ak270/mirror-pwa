'use client'

import { useState, useEffect } from 'react'
import { Bell, RefreshCw } from 'lucide-react'

interface NotificationSetupProps {
  userId: string
}

export default function NotificationSetup({ userId }: NotificationSetupProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)

  useEffect(() => {
    // Detect iOS and standalone mode
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const standalone = (window.navigator as any).standalone === true
    
    setIsIOS(iOS)
    setIsStandalone(standalone)
    
    // Show banner if iOS Safari but not in standalone mode
    if (iOS && !standalone) {
      setShowIOSBanner(true)
    }

    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    checkSubscription()
  }, [])

  async function checkSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('Error checking subscription:', err)
    }
  }

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }

    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        setLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      
      // Detect source
      const source = isIOS && isStandalone ? 'ios_pwa' : 'browser'

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      const subscriptionJSON = subscription.toJSON()

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
          p256dh: subscriptionJSON.keys?.p256dh,
          auth: subscriptionJSON.keys?.auth,
          source,
        }),
      })

      setIsSubscribed(true)
    } catch (err) {
      console.error('Error subscribing:', err)
      alert('Failed to enable notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      
      // Unsubscribe existing
      if (existingSubscription) {
        await existingSubscription.unsubscribe()
      }

      // Re-subscribe
      await subscribe()
    } catch (err) {
      console.error('Error resubscribing:', err)
      alert('Failed to refresh notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function testNotification() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      if (res.ok) {
        alert('Test notification sent! Check your notifications.')
      } else {
        alert('Failed to send test notification.')
      }
    } catch (err) {
      console.error('Error testing notification:', err)
      alert('Failed to send test notification.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {showIOSBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-card p-4">
          <p className="text-sm text-amber-900 font-medium mb-2">
            📱 Notifications only work in the Mirror app
          </p>
          <p className="text-xs text-amber-700 mb-3">
            Add Mirror to your Home Screen first, then enable notifications from within the installed app.
          </p>
          <details className="text-xs text-amber-800">
            <summary className="cursor-pointer font-medium">How to install</summary>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Tap the Share button (square with arrow)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add"</li>
              <li>Open Mirror from your Home Screen</li>
              <li>Return here to enable notifications</li>
            </ol>
          </details>
        </div>
      )}

      <div className="flex items-center gap-3">
        {permission === 'granted' && isSubscribed ? (
          <>
            <button
              onClick={testNotification}
              disabled={loading}
              className="mirror-btn-secondary flex-1 disabled:opacity-50"
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Test notification
            </button>
            <button
              onClick={resubscribe}
              disabled={loading || showIOSBanner}
              className="mirror-btn-secondary flex-1 disabled:opacity-50"
              title="Refresh notification access (fixes iOS issues)"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refresh access
            </button>
          </>
        ) : (
          <button
            onClick={subscribe}
            disabled={loading || showIOSBanner}
            className="mirror-btn-primary w-full disabled:opacity-50"
          >
            <Bell className="w-4 h-4 inline mr-2" />
            {loading ? 'Enabling...' : 'Enable notifications'}
          </button>
        )}
      </div>

      {permission === 'denied' && (
        <p className="text-xs text-muted">
          Notifications are blocked. Please enable them in your browser settings.
        </p>
      )}
    </div>
  )
}
