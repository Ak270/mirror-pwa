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
  // Daily reminder variations based on time and context
  daily_reminder: (timeOfDay: 'morning' | 'afternoon' | 'evening', habitCount: number) => {
    const variations = {
      morning: [
        "Morning. Mirror is here when you're ready.",
        `${habitCount} habit${habitCount !== 1 ? 's' : ''} waiting. No rush.`,
        "Today is still open.",
      ],
      afternoon: [
        "Afternoon check-in. Mirror is waiting.",
        `${habitCount} habit${habitCount !== 1 ? 's' : ''} to log. You have time.`,
        "Mirror is here. Log when ready.",
      ],
      evening: [
        "Evening. Tonight is still today.",
        `${habitCount} habit${habitCount !== 1 ? 's' : ''} left. You can still show up.`,
        "Mirror is waiting. No judgment.",
      ],
    }
    const options = variations[timeOfDay]
    return {
      title: 'Mirror',
      body: options[Math.floor(Math.random() * options.length)],
    }
  },
  
  // Streak at risk - gentle reminder without pressure
  streak_at_risk: (streakDays: number, habitName: string) => ({
    title: 'Mirror',
    body: `${streakDays} days of ${habitName.toLowerCase()}. Tonight is still today.`,
  }),
  
  // Streak milestone - identity-affirming
  streak_milestone: (days: number, habitName: string) => {
    const milestones = {
      7: `A week of ${habitName.toLowerCase()}. You are becoming this.`,
      14: `Two weeks of ${habitName.toLowerCase()}. This is who you are now.`,
      30: `30 days of ${habitName.toLowerCase()}. You are this person.`,
      60: `60 days of ${habitName.toLowerCase()}. Identity shift complete.`,
      90: `90 days of ${habitName.toLowerCase()}. This is just what you do.`,
      100: `100 days of ${habitName.toLowerCase()}. Unstoppable.`,
    }
    return {
      title: 'Mirror 🔥',
      body: milestones[days as keyof typeof milestones] || `${days} days of ${habitName.toLowerCase()}. Keep going.`,
    }
  },
  
  // Weekly reflection
  week_reflection: {
    title: 'Mirror',
    body: 'Sunday reflection — 2 minutes for yourself.',
  },
  
  // After a slip - compassionate
  habit_slip: (habitName: string) => ({
    title: 'Mirror',
    body: `Yesterday's ${habitName.toLowerCase()} is yesterday. Today is new.`,
  }),
  
  // Long absence - welcoming, no guilt
  long_absence: (daysSince: number) => {
    if (daysSince <= 3) {
      return {
        title: 'Mirror',
        body: 'Mirror is here. No questions asked.',
      }
    } else if (daysSince <= 7) {
      return {
        title: 'Mirror',
        body: 'Welcome back. Start where you are.',
      }
    } else {
      return {
        title: 'Mirror',
        body: 'Mirror missed you. Today is a good day to return.',
      }
    }
  },
  
  // Correlation insight teaser
  correlation_teaser: (habit1: string, habit2: string) => ({
    title: 'Mirror Insight',
    body: `${habit1} and ${habit2} might be connected. Check graphs.`,
  }),
  
  // Habit stacking suggestion
  habit_stacking: (existingHabit: string, suggestedHabit: string) => ({
    title: 'Mirror Suggestion',
    body: `After ${existingHabit.toLowerCase()}, try ${suggestedHabit.toLowerCase()}.`,
  }),
}
