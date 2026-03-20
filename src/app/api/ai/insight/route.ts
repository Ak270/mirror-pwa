import { NextResponse, type NextRequest } from 'next/server'
import { getDailyInsight } from '@/lib/ai/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

  const today = new Date().toISOString().split('T')[0]

  const { data: habits } = await supabase
    .from('habits')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('archived', false)

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('habit_id, status')
    .eq('user_id', user.id)
    .eq('date', today)

  const habitList = habits ?? []
  const ciList = checkIns ?? []
  const loggedIds = new Set(ciList.map((c: { habit_id: string }) => c.habit_id))

  const completed = habitList.filter(h => loggedIds.has(h.id)).map(h => h.name)
  const missed = habitList.filter(h => !loggedIds.has(h.id)).map(h => h.name)

  const result = await getDailyInsight(completed, missed, 0)
  return NextResponse.json(result)
}
