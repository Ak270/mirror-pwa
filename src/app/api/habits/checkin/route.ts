import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// iOS Shortcut check-in endpoint
// POST /api/habits/checkin?token=<user_token>
// Body: { habit_id: string, status: string }
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { habit_id, status } = await request.json()
  if (!habit_id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const VALID_STATUSES = ['done', 'partial', 'skip', 'honest_slip']
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error: ciError } = await supabase
    .from('check_ins')
    .upsert(
      { user_id: user.id, habit_id, date: today, status },
      { onConflict: 'habit_id,date' }
    )
    .select()
    .single()

  if (ciError) return NextResponse.json({ error: ciError.message }, { status: 500 })

  return NextResponse.json({ ok: true, check_in: data })
}
