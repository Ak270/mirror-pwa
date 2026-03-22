import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  // Get token from Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Create Supabase client
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
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  )

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Get all active habits (ordered by reminder_time, with nulls at the end)
  const { data: allHabits } = await supabase
    .from('habits')
    .select('id, name, icon_emoji, category_id, reminder_time')
    .eq('user_id', user.id)
    .eq('archived', false)
    .eq('is_vault', false)
    .order('reminder_time', { ascending: true, nullsFirst: false })

  // Get today's check-ins
  const { data: checkins } = await supabase
    .from('check_ins')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('date', today)

  // Find pending habits
  const loggedIds = new Set((checkins || []).map((c) => c.habit_id))
  const pending = (allHabits || []).filter((h) => !loggedIds.has(h.id))
  const next = pending[0] || null

  console.log(`[NEXT-PENDING] User: ${user.id}, Pending: ${pending.length}, Next: ${next?.name || 'none'}`)

  return NextResponse.json({
    next_habit: next,
    pending_count: pending.length,
    all_done: pending.length === 0,
  })
}
