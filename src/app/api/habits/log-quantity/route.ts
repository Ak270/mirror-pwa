import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'
import { generateGoalMet, generateBreakFreeCountReaction } from '@/lib/ai/notifications'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@mirror.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.substring(7)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { habit_id, amount, unit, logged_at } = body

  if (!habit_id || amount === undefined || amount === null) {
    return NextResponse.json({ error: 'Missing habit_id or amount' }, { status: 400 })
  }

  const parsedAmount = parseFloat(amount)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const entryTime = logged_at ?? new Date().toISOString()

  // Fetch habit to get daily_target
  const { data: habit } = await supabase
    .from('habits')
    .select('id, name, daily_target, daily_target_unit, category_id')
    .eq('id', habit_id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  const effectiveUnit = unit || habit.daily_target_unit || ''

  // Fetch existing log for today
  const { data: existingLog } = await supabase
    .from('daily_quantity_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('habit_id', habit_id)
    .eq('date', today)
    .single()

  const currentEntries = existingLog?.entries || []
  const newEntry = { time: entryTime, amount: parsedAmount, unit: effectiveUnit }
  const newTotal = (existingLog?.running_total ?? 0) + parsedAmount
  const dailyTarget = habit.daily_target ?? existingLog?.daily_target ?? null
  const wasAlreadyMet = existingLog?.goal_met ?? false
  const goalMet = dailyTarget !== null && newTotal >= dailyTarget
  const goalNewlyMet = goalMet && !wasAlreadyMet

  const { error: upsertError } = await supabase
    .from('daily_quantity_logs')
    .upsert({
      user_id: user.id,
      habit_id,
      date: today,
      entries: [...currentEntries, newEntry],
      running_total: newTotal,
      daily_target: dailyTarget,
      goal_met: goalMet,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,habit_id,date' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Get yesterday's total for comparison
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const { data: yesterdayLog } = await supabase
    .from('daily_quantity_logs')
    .select('running_total')
    .eq('user_id', user.id)
    .eq('habit_id', habit_id)
    .eq('date', yesterday)
    .single()

  const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const timeLabel = istTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  // Send celebration or progress notification
  let followUp: { title: string; body: string } | null = null

  if (goalNewlyMet) {
    followUp = await generateGoalMet({
      habit_name: habit.name,
      daily_target: dailyTarget!,
      unit: effectiveUnit,
      actual_total: newTotal,
      time_achieved: timeLabel,
    })
  } else {
    followUp = await generateBreakFreeCountReaction({
      habit_name: habit.name,
      today_count: newTotal,
      yesterday_count_at_same_time: yesterdayLog?.running_total ?? null,
      daily_goal: dailyTarget,
      current_time_label: timeLabel,
    })
  }

  // Push follow-up notification
  if (followUp) {
    const { data: subscription } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subscription) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify({
            title: followUp.title,
            body: followUp.body,
            icon: '/icons/icon-192.svg',
            badge: '/icons/badge-72.svg',
            tag: `quantity-${habit_id}`,
            data: { habit_id, url: `/log?habit_id=${habit_id}` },
          })
        )
      } catch (err) {
        console.error('[log-quantity] Push failed:', err)
      }
    }
  }

  return NextResponse.json({
    success: true,
    running_total: newTotal,
    daily_target: dailyTarget,
    goal_met: goalMet,
    goal_newly_met: goalNewlyMet,
    follow_up: followUp,
  })
}
