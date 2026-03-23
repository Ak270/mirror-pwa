import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateNotification, buildNotificationData } from '@/lib/ai/groqNotifications'
import type { Habit, CheckIn } from '@/types'

export const dynamic = 'force-dynamic'

/**
 * Morning Motivation Cron Job
 * Runs daily at 6am UTC (Vercel Hobby plan limitation)
 * Sends morning anchor messages to users with leave habits based on their timezone
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const now = new Date()

    // Get all active leave habits with their profiles
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select(`
        *,
        profiles!inner(
          id,
          day_start_time,
          day_end_time,
          timezone
        )
      `)
      .eq('intent', 'leave')
      .eq('archived', false)

    if (habitsError) throw habitsError
    if (!habits || habits.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No leave habits found',
        sent: 0 
      })
    }

    let sentCount = 0

    for (const habit of habits) {
      const profile = habit.profiles
      if (!profile) continue

      // Calculate user's local time based on timezone
      const userTimezone = profile.timezone || 'UTC'
      const userLocalTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
      const userHour = userLocalTime.getHours()
      const userMinute = userLocalTime.getMinutes()

      // Parse day start time
      const [startHour, startMin] = (profile.day_start_time || '06:00')
        .split(':')
        .map(Number)

      // Send if within 1 hour of user's day start time
      // This gives us a window since we only run once per day
      const hourDiff = Math.abs(userHour - startHour)
      if (hourDiff > 1) continue

      // Get habit check-ins for context
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('*')
        .eq('habit_id', habit.id)
        .order('date', { ascending: false })
        .limit(30)

      // Build notification data
      const notificationData = await buildNotificationData(
        habit as Habit,
        (checkIns || []) as CheckIn[],
        profile
      )

      // Generate morning anchor message
      const notification = await generateNotification(
        'morning_anchor_leave',
        notificationData
      )

      if (!notification) continue

      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from('notification_subscriptions')
        .select('*')
        .eq('user_id', habit.user_id)

      if (!subscriptions || subscriptions.length === 0) continue

      // Send push notification to all user's devices
      for (const subscription of subscriptions) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: subscription.subscription,
              notification: {
                title: notification.title,
                body: notification.body,
                icon: habit.icon_emoji,
                badge: '/icon-192.png',
                data: {
                  habitId: habit.id,
                  type: 'morning_anchor'
                }
              }
            })
          })

          sentCount++
        } catch (err) {
          console.error(`Failed to send to subscription ${subscription.id}:`, err)
        }
      }

      // Log notification to conversation history
      await supabase.from('notification_conversations').insert({
        user_id: habit.user_id,
        habit_id: habit.id,
        title: notification.title,
        body: notification.body,
        type: 'morning_anchor',
        sent_at: now.toISOString()
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${sentCount} morning motivation messages`,
      sent: sentCount
    })

  } catch (error) {
    console.error('[Cron/morning-motivation] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
