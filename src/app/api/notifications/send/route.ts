import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@mirror.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinute

  // Only send during quiet hours window (7am–10pm)
  if (currentHour < 7 || currentHour >= 22) {
    return NextResponse.json({ message: 'Outside notification window' })
  }

  // Get habits with reminder_time set
  const { data: habitsWithReminders } = await supabase
    .from('habits')
    .select('id, user_id, name, reminder_time')
    .not('reminder_time', 'is', null)
    .eq('archived', false)

  if (!habitsWithReminders?.length) {
    return NextResponse.json({ sent: 0, message: 'No habits with reminders' })
  }

  let sent = 0
  const errors: string[] = []

  for (const habit of habitsWithReminders) {
    try {
      // Parse reminder time (format: "HH:MM:SS")
      const [hours, minutes] = habit.reminder_time!.split(':').map(Number)
      const reminderTimeInMinutes = hours * 60 + minutes
      
      // Calculate minutes until reminder
      const minutesUntil = reminderTimeInMinutes - currentTimeInMinutes
      
      // Send notifications at: -15, -10, -5, 0 minutes
      const shouldSend = minutesUntil === 15 || minutesUntil === 10 || minutesUntil === 5 || minutesUntil === 0
      
      if (!shouldSend) continue

      // Check if habit already logged today
      const { count } = await supabase
        .from('check_ins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', habit.user_id)
        .eq('habit_id', habit.id)
        .eq('date', today)

      if ((count ?? 0) > 0) continue

      // Get user's notification subscription
      const { data: subscription } = await supabase
        .from('notification_subscriptions')
        .select('*')
        .eq('user_id', habit.user_id)
        .single()

      if (!subscription) continue

      const message = minutesUntil === 0 
        ? `Time for ${habit.name}`
        : `${habit.name} in ${minutesUntil} minutes`

      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify({
          title: 'Mirror Reminder',
          body: message,
          icon: '/icons/icon-192.svg',
          badge: '/icons/badge-72.svg',
          url: '/log',
          tag: `habit-reminder-${habit.id}`,
        })
      )
      sent++
    } catch (err) {
      const errStr = String(err)
      errors.push(errStr)
    }
  }

  return NextResponse.json({ sent, errors: errors.slice(0, 5) })
}
