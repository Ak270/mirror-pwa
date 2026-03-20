import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// iOS Shortcut endpoint — returns today's unlogged habits as plain text
// Called via: GET /api/habits/today?token=<user_token>
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the token is a valid user access token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, icon_emoji')
    .eq('user_id', user.id)
    .eq('archived', false)
    .eq('is_vault', false)

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('date', today)

  const loggedIds = new Set((checkIns ?? []).map((c: { habit_id: string }) => c.habit_id))
  const pending = (habits ?? []).filter(h => !loggedIds.has(h.id))

  const accept = request.headers.get('accept') ?? ''
  if (accept.includes('text/plain')) {
    const text = pending.length === 0
      ? 'All habits logged today.'
      : `Pending today:\n${pending.map(h => `${h.icon_emoji} ${h.name}`).join('\n')}`
    return new NextResponse(text, { headers: { 'Content-Type': 'text/plain' } })
  }

  return NextResponse.json({ pending, date: today })
}
