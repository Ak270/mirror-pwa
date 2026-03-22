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
      
      // Calculate minutes until reminder (negative if past)
      const minutesUntil = reminderTimeInMinutes - currentTimeInMinutes
      
      // Send notifications at: -15, -10, -5, 0 minutes
      // Also send if we're within 5 minutes PAST the reminder (grace period for missed cron runs)
      const shouldSend = 
        minutesUntil === 15 || 
        minutesUntil === 10 || 
        minutesUntil === 5 || 
        minutesUntil === 0 ||
        (minutesUntil >= -5 && minutesUntil < 0) // Grace period: 0-5 minutes past reminder
      
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

      // Skip stale subscriptions (not verified in last 7 days)
      const lastVerified = subscription.last_verified_at ? new Date(subscription.last_verified_at) : null
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      if (lastVerified && lastVerified < sevenDaysAgo) {
        continue // Skip stale subscription
      }

      // Determine time of day for context-aware messaging
      const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'
      
      // Get user's total unlogged habits for context
      const { data: allUserHabits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', habit.user_id)
        .eq('archived', false)
      
      const { data: todayCheckIns } = await supabase
        .from('check_ins')
        .select('habit_id')
        .eq('user_id', habit.user_id)
        .eq('date', today)
      
      const loggedHabitIds = new Set(todayCheckIns?.map(ci => ci.habit_id) || [])
      const unloggedCount = (allUserHabits?.length || 1) - loggedHabitIds.size
      
      // Check for streak data to send streak-at-risk notification
      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select('date, status')
        .eq('habit_id', habit.id)
        .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(30)
      
      let currentStreak = 0
      if (recentCheckIns && recentCheckIns.length > 0) {
        for (let i = 0; i < recentCheckIns.length; i++) {
          const checkDate = new Date(recentCheckIns[i].date)
          const expectedDate = new Date(Date.now() - (i + 1) * 86400000)
          const dayDiff = Math.floor((expectedDate.getTime() - checkDate.getTime()) / 86400000)
          
          if (dayDiff <= 1 && ['done', 'partial'].includes(recentCheckIns[i].status)) {
            currentStreak++
          } else {
            break
          }
        }
      }
      
      // Use smart notification copy
      const { NOTIFICATION_COPY } = await import('@/lib/notifications')
      let notificationContent
      
      if (currentStreak >= 7 && minutesUntil === 0) {
        // Streak at risk notification
        notificationContent = NOTIFICATION_COPY.streak_at_risk(currentStreak, habit.name)
      } else if (minutesUntil === 0) {
        // Daily reminder with context
        notificationContent = NOTIFICATION_COPY.daily_reminder(timeOfDay, unloggedCount)
      } else {
        // Time-based reminder
        notificationContent = {
          title: 'Mirror',
          body: `${habit.name} in ${minutesUntil} minutes`,
        }
      }

      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify({
            title: notificationContent.title,
            body: notificationContent.body,
            icon: '/icons/icon-192.svg',
            badge: '/icons/badge-72.svg',
            url: `/log?habit_id=${habit.id}`,
            tag: `habit-reminder-${habit.id}`,
            data: {
              habit_id: habit.id,
              habit_name: habit.name
            }
          })
        )
        
        // Update last_verified_at on successful send
        await supabase
          .from('notification_subscriptions')
          .update({ last_verified_at: new Date().toISOString() })
          .eq('id', subscription.id)
        
        sent++
      } catch (notifErr) {
        // Notification failed, don't update verified timestamp
        const errStr = String(notifErr)
        errors.push(errStr)
      }
    } catch (err) {
      const errStr = String(err)
      errors.push(errStr)
    }
  }

  return NextResponse.json({ sent, errors: errors.slice(0, 5) })
}
