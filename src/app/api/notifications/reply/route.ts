import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import webpush from 'web-push'
import {
  generateSlipReaction,
  generateBreakFreeCountReaction,
  parseQuantityFromText,
} from '@/lib/ai/notifications'

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

  // Verify the JWT token to get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { habit_id, action, text_reply, notification_id, context } = body

  if (!habit_id || !action) {
    return NextResponse.json({ error: 'Missing habit_id or action' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const istTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const timeLabel = istTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  // Fetch the habit
  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habit_id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  // Fetch user's push subscription
  const { data: subscription } = await supabase
    .from('notification_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let groqFollowUp: { title: string; body: string } | null = null
  let runningTotal: number | null = null

  // ── Handle by action type ───────────────────────────────────────────────

  if (action === 'done' || action === 'partial' || action === 'skip') {
    // Upsert check-in
    await supabase.from('check_ins').upsert({
      user_id: user.id,
      habit_id,
      date: today,
      status: action === 'done' ? 'done' : action === 'partial' ? 'partial' : 'skip',
    }, { onConflict: 'habit_id,date' })

  } else if (action === 'slip' || action === 'had_a_moment') {
    // Upsert check-in as honest_slip
    await supabase.from('check_ins').upsert({
      user_id: user.id,
      habit_id,
      date: today,
      status: 'honest_slip',
    }, { onConflict: 'habit_id,date' })

    // Get yesterday's count for comparison
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: yesterdayLog } = await supabase
      .from('daily_quantity_logs')
      .select('running_total')
      .eq('user_id', user.id)
      .eq('habit_id', habit_id)
      .eq('date', yesterday)
      .single()

    const { data: todayLog } = await supabase
      .from('daily_quantity_logs')
      .select('running_total')
      .eq('user_id', user.id)
      .eq('habit_id', habit_id)
      .eq('date', today)
      .single()

    const todayCount = (todayLog?.running_total ?? 0) + 1
    const yesterdayCount = yesterdayLog?.running_total ?? 0

    // Update today's log
    await supabase.from('daily_quantity_logs').upsert({
      user_id: user.id,
      habit_id,
      date: today,
      running_total: todayCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,habit_id,date' })

    groqFollowUp = await generateSlipReaction({
      habit_name: habit.name,
      today_count: todayCount,
      yesterday_count: yesterdayCount,
      daily_goal: habit.daily_reduction_goal,
      time_of_day: timeLabel,
    })

  } else if (action === 'still_holding') {
    // No check-in change needed — just send encouragement
    groqFollowUp = {
      title: habit.name,
      body: 'Keep going. Every hour counts.',
    }

  } else if (action === 'text_reply' || text_reply) {
    // Quantity logging
    const unit = habit.daily_target_unit || habit.daily_reduction_unit || ''
    const amount = text_reply ? parseQuantityFromText(text_reply, unit) : null

    if (amount !== null && amount > 0) {
      const { data: existingLog } = await supabase
        .from('daily_quantity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('habit_id', habit_id)
        .eq('date', today)
        .single()

      const currentEntries = existingLog?.entries || []
      const newEntry = { time: new Date().toISOString(), amount, unit }
      const newTotal = (existingLog?.running_total ?? 0) + amount
      runningTotal = newTotal

      const dailyTarget = habit.daily_target ?? existingLog?.daily_target ?? null
      const goalMet = dailyTarget !== null && newTotal >= dailyTarget

      await supabase.from('daily_quantity_logs').upsert({
        user_id: user.id,
        habit_id,
        date: today,
        entries: [...currentEntries, newEntry],
        running_total: newTotal,
        daily_target: dailyTarget,
        goal_met: goalMet,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,habit_id,date' })

      // Get yesterday's total at same time for comparison
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const { data: yesterdayLog } = await supabase
        .from('daily_quantity_logs')
        .select('running_total')
        .eq('user_id', user.id)
        .eq('habit_id', habit_id)
        .eq('date', yesterday)
        .single()

      if (goalMet) {
        groqFollowUp = {
          title: `${habit.name} goal done`,
          body: `All ${dailyTarget} ${unit} done! 🎉`,
        }
      } else {
        groqFollowUp = await generateBreakFreeCountReaction({
          habit_name: habit.name,
          today_count: newTotal,
          yesterday_count_at_same_time: yesterdayLog?.running_total ?? null,
          daily_goal: dailyTarget,
          current_time_label: timeLabel,
        })
      }
    }

  } else if (['1', '2', '3', 'Half glass', '1 glass', '1.5 glasses', '5 pages', '10 pages', '20 pages', '10 min', '20 min', '30 min'].includes(action)) {
    // Pre-defined quick-log action button
    const unit = habit.daily_target_unit || habit.daily_reduction_unit || ''
    const amount = parseQuantityFromText(action, unit) ?? parseFloat(action) ?? 1

    const { data: existingLog } = await supabase
      .from('daily_quantity_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('habit_id', habit_id)
      .eq('date', today)
      .single()

    const currentEntries = existingLog?.entries || []
    const newEntry = { time: new Date().toISOString(), amount, unit }
    const newTotal = (existingLog?.running_total ?? 0) + amount
    runningTotal = newTotal

    const dailyTarget = habit.daily_target ?? null
    const goalMet = dailyTarget !== null && newTotal >= dailyTarget

    await supabase.from('daily_quantity_logs').upsert({
      user_id: user.id,
      habit_id,
      date: today,
      entries: [...currentEntries, newEntry],
      running_total: newTotal,
      daily_target: dailyTarget,
      goal_met: goalMet,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,habit_id,date' })

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: yesterdayLog } = await supabase
      .from('daily_quantity_logs')
      .select('running_total')
      .eq('user_id', user.id)
      .eq('habit_id', habit_id)
      .eq('date', yesterday)
      .single()

    if (goalMet) {
      groqFollowUp = {
        title: `${habit.name} goal done`,
        body: `All ${dailyTarget} ${unit} done! 🎉`,
      }
    } else {
      groqFollowUp = await generateBreakFreeCountReaction({
        habit_name: habit.name,
        today_count: newTotal,
        yesterday_count_at_same_time: yesterdayLog?.running_total ?? null,
        daily_goal: dailyTarget,
        current_time_label: timeLabel,
      })
    }
  }

  // ── Log the conversation ────────────────────────────────────────────────

  await supabase.from('notification_conversations').insert({
    user_id: user.id,
    habit_id,
    date: today,
    user_action: action,
    user_text_reply: text_reply ?? null,
    groq_follow_up: groqFollowUp?.body ?? null,
    running_total_at_time: runningTotal,
  })

  // ── Send follow-up push notification ───────────────────────────────────

  if (groqFollowUp && subscription) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify({
          title: groqFollowUp.title,
          body: groqFollowUp.body,
          icon: '/icons/icon-192.svg',
          badge: '/icons/badge-72.svg',
          tag: `reply-${habit_id}`,
          data: { habit_id, url: `/log?habit_id=${habit_id}` },
        })
      )
    } catch (err) {
      console.error('[reply] Push failed:', err)
    }
  }

  return NextResponse.json({ success: true, follow_up: groqFollowUp })
}
