import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  let supabase

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll: () => [], setAll: () => {} },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    )
  } else {
    const cookieStore = await cookies()
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs: { name: string; value: string; options: Record<string, unknown> }[]) =>
            cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch habits
  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, icon_emoji, category_id, display_type, reminder_time, daily_target, daily_target_unit, archived')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: true })

  if (!habits) return NextResponse.json({ today_habits: [], allday_habits: [], summary: { total: 0, completed: 0, pending: 0 } })

  // Fetch today's check-ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('habit_id, status, quantifiable_value, quantifiable_unit')
    .eq('user_id', user.id)
    .eq('date', today)

  const checkInMap = new Map(checkIns?.map(ci => [ci.habit_id, ci]) ?? [])

  // Fetch today's quantity logs
  const { data: quantityLogs } = await supabase
    .from('daily_quantity_logs')
    .select('habit_id, running_total, daily_target, goal_met')
    .eq('user_id', user.id)
    .eq('date', today)

  const quantityLogMap = new Map(quantityLogs?.map(ql => [ql.habit_id, ql]) ?? [])

  // Fetch streaks in batch — get all recent check-ins once
  const { data: recentAll } = await supabase
    .from('check_ins')
    .select('habit_id, date, status')
    .eq('user_id', user.id)
    .gte('date', format(new Date(Date.now() - 90 * 86400000), 'yyyy-MM-dd'))
    .order('date', { ascending: false })

  // Build streak map per habit
  const streakMap = new Map<string, number>()
  const byHabit = new Map<string, Array<{ habit_id: string; date: string; status: string }>>()
  for (const ci of (recentAll ?? [])) {
    const arr = byHabit.get(ci.habit_id) ?? []
    arr.push(ci)
    byHabit.set(ci.habit_id, arr)
  }
  for (const [habitId, cis] of byHabit) {
    let streak = 0
    for (let i = 0; i < cis.length; i++) {
      const diff = Math.floor((Date.now() - (i + 1) * 86400000 - new Date(cis[i].date).getTime()) / 86400000)
      if (diff <= 1 && ['done', 'partial'].includes(cis[i].status)) streak++
      else break
    }
    streakMap.set(habitId, streak)
  }

  const habitRows = habits.map(habit => {
    const checkIn = checkInMap.get(habit.id)
    const qLog = quantityLogMap.get(habit.id)
    const streak = streakMap.get(habit.id) ?? 0
    const status = checkIn?.status ?? 'pending'

    return {
      id: habit.id,
      name: habit.name,
      icon_emoji: habit.icon_emoji,
      category_id: habit.category_id,
      display_type: habit.display_type,
      reminder_time: habit.reminder_time ?? null,
      status,
      today_status: status,
      current_streak: streak,
      running_total: qLog?.running_total ?? null,
      daily_target: habit.daily_target ?? qLog?.daily_target ?? null,
      daily_target_unit: habit.daily_target_unit ?? null,
      goal_met: qLog?.goal_met ?? false,
    }
  })

  // Split: allday = break_free or no reminder_time, timed = has reminder_time
  const today_habits = habitRows
    .filter(h => h.reminder_time)
    .sort((a, b) => (a.reminder_time ?? '').localeCompare(b.reminder_time ?? ''))

  const allday_habits = habitRows.filter(h => !h.reminder_time)

  const completed = habitRows.filter(h => h.status === 'done' || h.status === 'partial').length

  return NextResponse.json({
    today_habits,
    allday_habits,
    summary: {
      total: habitRows.length,
      completed,
      pending: habitRows.length - completed,
    },
    date: today,
  })
}

// POST endpoint for quick check-in from widget
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs: { name: string; value: string; options: Record<string, unknown> }[]) =>
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { habit_id, status } = await request.json()
  if (!habit_id || !status) {
    return NextResponse.json({ error: 'Missing habit_id or status' }, { status: 400 })
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  const { error } = await supabase
    .from('check_ins')
    .upsert({
      user_id: user.id,
      habit_id,
      date: today,
      status,
    }, { onConflict: 'habit_id,date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
