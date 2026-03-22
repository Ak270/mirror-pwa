import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Task 06: Streak Insurance - Use a banked grace day
 * Allows user to spend an earned grace day to preserve their streak
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { habit_id } = await req.json()

    if (!habit_id) {
      return NextResponse.json({ error: 'habit_id required' }, { status: 400 })
    }

    // Get habit
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habit_id)
      .eq('user_id', user.id)
      .single()

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Check if user has grace days available
    if (!habit.banked_grace_days || habit.banked_grace_days <= 0) {
      return NextResponse.json({ error: 'No grace days available' }, { status: 400 })
    }

    // Check if yesterday is actually missing
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = yesterday.toISOString().split('T')[0]

    const { data: yesterdayCheckIn } = await supabase
      .from('check_ins')
      .select('*')
      .eq('habit_id', habit_id)
      .eq('date', yesterdayDate)
      .single()

    if (yesterdayCheckIn) {
      return NextResponse.json({ error: 'Yesterday already logged' }, { status: 400 })
    }

    // Use the grace day - create a check-in for yesterday with special status
    const { error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        habit_id,
        date: yesterdayDate,
        status: 'done',
        created_at: new Date().toISOString()
      })

    if (checkInError) {
      return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 })
    }

    // Decrement banked grace days
    const { error: updateError } = await supabase
      .from('habits')
      .update({ banked_grace_days: habit.banked_grace_days - 1 })
      .eq('id', habit_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update grace days' }, { status: 500 })
    }

    // Log as partial victory
    await supabase.from('partial_victories').insert({
      user_id: user.id,
      habit_id,
      victory_type: 'grace_day_used',
      metadata: { date: yesterdayDate, streak_preserved: habit.current_streak }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Grace day used. Your streak is protected.',
      remaining_grace_days: habit.banked_grace_days - 1
    })
  } catch (error) {
    console.error('Grace day use error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
