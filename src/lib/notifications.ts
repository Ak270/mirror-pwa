export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  const result = await Notification.requestPermission()
  return result
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const reg = await navigator.serviceWorker.ready
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!vapidKey) {
    console.warn('VAPID public key not configured')
    return null
  }

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    return sub
  } catch {
    return null
  }
}

export async function saveSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  const json = subscription.toJSON()
  const keys = json.keys as { p256dh: string; auth: string }

  try {
    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}

export const NOTIFICATION_COPY = {
  daily_reminder: {
    title: 'Mirror',
    body: "Mirror is waiting when you're ready.",
  },
  streak_at_risk: (streakDays: number) => ({
    title: 'Mirror',
    body: `${streakDays} days in a row. Tonight is still today.`,
  }),
  streak_milestone: (days: number, habitName: string) => ({
    title: 'Mirror 🔥',
    body: `${days} days of ${habitName.toLowerCase()}. You are becoming this.`,
  }),
  week_reflection: {
    title: 'Mirror',
    body: 'Sunday reflection — 2 minutes for yourself.',
  },
  habit_slip: {
    title: 'Mirror',
    body: 'Yesterday was yesterday. Today is a new day.',
  },
  long_absence: {
    title: 'Mirror',
    body: 'Mirror missed you. No questions asked.',
  },
}
