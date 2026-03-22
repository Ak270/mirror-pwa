import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'
import {
  generateTimedReminder,
  generateBreakFreeCheckin,
  generateQuantityNudge,
  generateEndOfDay,
} from '@/lib/ai/notifications'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@mirror.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: {
    title: string
    body: string
    tag: string
    actions?: { action: string; title: string }[]
    data?: Record<string, unknown>
  }
) {
  await webpush.sendNotification(
    { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/badge-72.svg',
      tag: payload.tag,
      actions: payload.actions ?? [],
      data: payload.data ?? {},
    })
  )
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[CRON] ========== Notification cron started ==========')

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[CRON] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const currentHour = istTime.getHours()
  const currentMinute = istTime.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinute

  console.log(`[CRON] IST: ${currentHour}:${String(currentMinute).padStart(2, '0')}`)

  if (currentHour < 7 || currentHour >= 23) {
    return NextResponse.json({ message: 'Outside notification window (7am-11pm IST)' })
  }

  const isEndOfDay = currentHour === 22 && currentMinute <= 10

  const { data: allHabits } = await supabase
    .from('habits')
    .select('id, user_id, name, category_id, reminder_time, check_in_interval_minutes, daily_target, daily_target_unit, daily_reduction_goal, reminder_interval_minutes, reminder_start_time, reminder_end_time, display_type')
    .eq('archived', false)

  if (!allHabits?.length) {
    return NextResponse.json({ sent: 0, message: 'No habits found' })
  }

  let sent = 0
  const errors: string[] = []
  const REPLY_ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mirror-pwa.vercel.app'}/api/notifications/reply`

  const byUser = new Map<string, typeof allHabits>()
  for (const h of allHabits) {
    const arr = byUser.get(h.user_id) ?? []
    arr.push(h)
    byUser.set(h.user_id, arr)
  }

  for (const [userId, habits] of byUser) {
    const { data: subscription } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!subscription) continue

    const lastVerified = subscription.last_verified_at ? new Date(subscription.last_verified_at) : null
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (lastVerified && lastVerified < sevenDaysAgo) continue

    const { data: todayCheckIns } = await supabase
      .from('check_ins')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('date', today)

    const loggedIds = new Set(todayCheckIns?.map(ci => ci.habit_id) ?? [])

    // ── End of day catch-up ──────────────────────────────────────────────
    if (isEndOfDay) {
      const unlogged = habits.filter(h => !loggedIds.has(h.id))
      if (unlogged.length > 0) {
        try {
          const msg = await generateEndOfDay({
            unlogged_habits: unlogged.map(h => ({ name: h.name, category_id: h.category_id })),
            logged_count: habits.length - unlogged.length,
            total_count: habits.length,
          })
          await sendPush(subscription, {
            title: msg.title,
            body: msg.body,
            tag: `end-of-day-${userId}`,
            actions: msg.actions.map(a => ({ action: a.toLowerCase().replace(/\s+/g, '_'), title: a })),
            data: { url: '/log', action_type: 'end_of_day' },
          })
          sent++
        } catch (e) {
          errors.push(`end_of_day: ${String(e)}`)
        }
      }
      continue
    }

    for (const habit of habits) {
      try {
        const alreadyLogged = loggedIds.has(habit.id)

        // ── 1. Timed reminder ────────────────────────────────────────────
        if (habit.reminder_time && habit.category_id !== 'break_free' && !habit.reminder_interval_minutes) {
          if (alreadyLogged) continue

          const [rh, rm] = habit.reminder_time.split(':').map(Number)
          const reminderMinutes = rh * 60 + rm
          const minutesUntil = reminderMinutes - currentTimeInMinutes

          const shouldSend =
            minutesUntil === 15 || minutesUntil === 10 || minutesUntil === 5 ||
            minutesUntil === 0 || (minutesUntil >= -5 && minutesUntil < 0)
          if (!shouldSend) continue

          const { count: recentCount } = await supabase
            .from('notification_conversations')
            .select('id', { count: 'exact', head: true })
            .eq('habit_id', habit.id)
            .eq('date', today)
            .eq('notification_type', 'timed_reminder')
            .gte('sent_at', new Date(Date.now() - 6 * 60 * 1000).toISOString())
          if ((recentCount ?? 0) > 0) continue

          const { data: recent } = await supabase
            .from('check_ins').select('date, status')
            .eq('habit_id', habit.id)
            .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
            .order('date', { ascending: false }).limit(30)

          let streak = 0
          for (let i = 0; i < (recent?.length ?? 0); i++) {
            const diff = Math.floor((Date.now() - (i + 1) * 86400000 - new Date(recent![i].date).getTime()) / 86400000)
            if (diff <= 1 && ['done', 'partial'].includes(recent![i].status)) streak++
            else break
          }

          console.log(`[CRON] Timed: ${habit.name} in ${minutesUntil}min`)
          const msg = await generateTimedReminder({
            habit_name: habit.name,
            minutes_until: Math.max(0, minutesUntil),
            current_streak: streak,
            category_id: habit.category_id,
          })

          await sendPush(subscription, {
            title: msg.title,
            body: msg.body,
            tag: `timed-${habit.id}`,
            actions: [
              { action: 'done', title: 'Done ✓' },
              { action: 'partial', title: 'Partial ~' },
            ],
            data: { habit_id: habit.id, url: `/log?habit_id=${habit.id}`, action_type: 'timed_reminder', reply_endpoint: REPLY_ENDPOINT },
          })
          await supabase.from('notification_conversations').insert({ user_id: userId, habit_id: habit.id, date: today, groq_message: msg.body, notification_type: 'timed_reminder' })
          sent++
        }

        // ── 2. Break-free check-in ───────────────────────────────────────
        else if (habit.category_id === 'break_free' && habit.check_in_interval_minutes) {
          const { data: lastConv } = await supabase
            .from('notification_conversations')
            .select('sent_at')
            .eq('habit_id', habit.id)
            .eq('date', today)
            .eq('notification_type', 'break_free_checkin')
            .order('sent_at', { ascending: false })
            .limit(1)
            .single()

          const intervalMs = habit.check_in_interval_minutes * 60 * 1000
          const lastSentAt = lastConv?.sent_at ? new Date(lastConv.sent_at).getTime() : 0
          const hoursSince = (Date.now() - lastSentAt) / (1000 * 60 * 60)

          const isFirstCheckin = !lastConv && currentHour >= 8 && currentHour < 9
          const isDueByInterval = lastConv && (Date.now() - lastSentAt) >= intervalMs
          if (!isFirstCheckin && !isDueByInterval) continue

          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const { data: todayLog } = await supabase.from('daily_quantity_logs').select('running_total').eq('user_id', userId).eq('habit_id', habit.id).eq('date', today).single()
          const { data: yesterdayLog } = await supabase.from('daily_quantity_logs').select('running_total').eq('user_id', userId).eq('habit_id', habit.id).eq('date', yesterday).single()
          const { data: lastUserConv } = await supabase.from('notification_conversations').select('user_action').eq('habit_id', habit.id).not('user_action', 'is', null).order('created_at', { ascending: false }).limit(1).single()

          const istLabel = istTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

          console.log(`[CRON] Break-free: ${habit.name}`)
          const msg = await generateBreakFreeCheckin({
            habit_name: habit.name,
            hours_since_last: Math.round(hoursSince),
            today_count: todayLog?.running_total ?? 0,
            yesterday_count: yesterdayLog?.running_total ?? 0,
            daily_goal: habit.daily_reduction_goal,
            current_time_label: istLabel,
            last_user_response: lastUserConv?.user_action ?? null,
          })

          await sendPush(subscription, {
            title: msg.title,
            body: msg.body,
            tag: `break-free-${habit.id}`,
            actions: msg.actions.map(a => ({ action: a.replace(/[^a-z0-9_]/gi, '_').toLowerCase(), title: a })),
            data: { habit_id: habit.id, url: `/log?habit_id=${habit.id}`, action_type: 'break_free_checkin', reply_endpoint: REPLY_ENDPOINT },
          })
          await supabase.from('notification_conversations').insert({ user_id: userId, habit_id: habit.id, date: today, groq_message: msg.body, notification_type: 'break_free_checkin' })
          sent++
        }

        // ── 3. Quantifiable nudge ────────────────────────────────────────
        else if (habit.reminder_interval_minutes && habit.daily_target) {
          const startParts = (habit.reminder_start_time ?? '08:00').split(':').map(Number)
          const endParts = (habit.reminder_end_time ?? '20:00').split(':').map(Number)
          const startMin = startParts[0] * 60 + startParts[1]
          const endMin = endParts[0] * 60 + endParts[1]
          if (currentTimeInMinutes < startMin || currentTimeInMinutes > endMin) continue

          const { data: lastNudge } = await supabase
            .from('notification_conversations')
            .select('sent_at')
            .eq('habit_id', habit.id)
            .eq('date', today)
            .eq('notification_type', 'quantity_nudge')
            .order('sent_at', { ascending: false })
            .limit(1)
            .single()

          const intervalMs = habit.reminder_interval_minutes * 60 * 1000
          if (lastNudge && (Date.now() - new Date(lastNudge.sent_at).getTime()) < intervalMs) continue

          const { data: todayLog } = await supabase.from('daily_quantity_logs').select('running_total, goal_met').eq('user_id', userId).eq('habit_id', habit.id).eq('date', today).single()
          if (todayLog?.goal_met) continue

          const runningTotal = todayLog?.running_total ?? 0
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const { data: yesterdayLog } = await supabase.from('daily_quantity_logs').select('running_total').eq('user_id', userId).eq('habit_id', habit.id).eq('date', yesterday).single()

          const istLabel = istTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

          console.log(`[CRON] Quantity: ${habit.name}, ${runningTotal}/${habit.daily_target}`)
          const msg = await generateQuantityNudge({
            habit_name: habit.name,
            daily_target: habit.daily_target,
            unit: habit.daily_target_unit ?? '',
            running_total: runningTotal,
            yesterday_total_at_same_time: yesterdayLog?.running_total ?? null,
            current_time_label: istLabel,
          })

          const unit = (habit.daily_target_unit ?? '').toLowerCase()
          const quickActions = unit.includes('glass') || unit.includes('water')
            ? [{ action: 'Half glass', title: 'Half glass' }, { action: '1 glass', title: '1 glass' }, { action: '1.5 glasses', title: '1.5 glasses' }]
            : unit.includes('page')
            ? [{ action: '5 pages', title: '5 pages' }, { action: '10 pages', title: '10 pages' }, { action: '20 pages', title: '20 pages' }]
            : [{ action: '1', title: '1' }, { action: '2', title: '2' }, { action: '3', title: '3' }]

          await sendPush(subscription, {
            title: msg.title,
            body: msg.body,
            tag: `quantity-${habit.id}`,
            actions: quickActions,
            data: { habit_id: habit.id, url: `/log?habit_id=${habit.id}`, action_type: 'quantity_nudge', reply_endpoint: REPLY_ENDPOINT },
          })
          await supabase.from('notification_conversations').insert({ user_id: userId, habit_id: habit.id, date: today, groq_message: msg.body, notification_type: 'quantity_nudge' })
          sent++
        }

      } catch (err) {
        errors.push(`${habit.id}: ${String(err)}`)
        console.error(`[CRON] Error for ${habit.name}:`, err)
      }
    }
  }

  const duration = Date.now() - startTime
  console.log(`[CRON] Done: ${sent} sent, ${errors.length} errors, ${duration}ms`)
  return NextResponse.json({ sent, errors: errors.slice(0, 5) })
}
