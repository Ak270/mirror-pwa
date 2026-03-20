import type { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import type { Habit, HabitWithStatus, CheckIn, CheckInStatus, Profile } from '@/types'
import { calculateStreak } from './streak'

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertProfile(supabase: SupabaseClient, userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single()
  return { data, error }
}

export async function getHabits(supabase: SupabaseClient, userId: string): Promise<Habit[]> {
  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .eq('is_vault', false)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getHabit(supabase: SupabaseClient, habitId: string): Promise<Habit | null> {
  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .single()
  return data
}

export async function getHabitsWithTodayStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<HabitWithStatus[]> {
  const today = format(new Date(), 'yyyy-MM-dd')

  const habits = await getHabits(supabase, userId)

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  const allCheckIns: CheckIn[] = checkIns ?? []

  return habits.map(habit => {
    const habitCheckIns = allCheckIns.filter(c => c.habit_id === habit.id)
    const todayCheckIn = habitCheckIns.find(c => c.date === today)
    const streakData = calculateStreak(habitCheckIns)

    return {
      ...habit,
      today_status: todayCheckIn?.status ?? null,
      current_streak: streakData.current_streak,
      best_streak: streakData.best_streak,
      check_ins: habitCheckIns,
    }
  })
}

export async function getHabitCheckIns(
  supabase: SupabaseClient,
  habitId: string,
  days = 365
): Promise<CheckIn[]> {
  const from = format(new Date(Date.now() - days * 86400000), 'yyyy-MM-dd')
  const { data } = await supabase
    .from('check_ins')
    .select('*')
    .eq('habit_id', habitId)
    .gte('date', from)
    .order('date', { ascending: false })
  return data ?? []
}

export async function logCheckIn(
  supabase: SupabaseClient,
  userId: string,
  habitId: string,
  status: CheckInStatus,
  options?: {
    note?: string | null
    quantifiable_value?: number | null
    quantifiable_unit?: string | null
  }
): Promise<{ data: CheckIn | null; error: Error | null }> {
  const date = format(new Date(), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('check_ins')
    .upsert({
      user_id: userId,
      habit_id: habitId,
      date,
      status,
      note: options?.note ?? null,
      quantifiable_value: options?.quantifiable_value ?? null,
      quantifiable_unit: options?.quantifiable_unit ?? null,
    }, { onConflict: 'habit_id,date' })
    .select()
    .single()

  return { data, error: error as Error | null }
}

export async function createHabit(
  supabase: SupabaseClient,
  userId: string,
  habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ data: Habit | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...habit, user_id: userId })
    .select()
    .single()
  return { data, error: error as Error | null }
}

export async function updateHabit(
  supabase: SupabaseClient,
  habitId: string,
  updates: Partial<Habit>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('habits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', habitId)
  return { error: error as Error | null }
}

export async function archiveHabit(
  supabase: SupabaseClient,
  habitId: string
): Promise<{ error: Error | null }> {
  return updateHabit(supabase, habitId, { archived: true })
}

export async function getTodayCheckInCount(
  supabase: SupabaseClient,
  userId: string
): Promise<{ logged: number; total: number }> {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('archived', false)
    .eq('is_vault', false)

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)

  const total = habits?.length ?? 0
  const logged = checkIns?.length ?? 0

  return { logged, total }
}
