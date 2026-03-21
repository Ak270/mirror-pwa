import { NextResponse, type NextRequest } from 'next/server'
import { getCheckInConfirmation } from '@/lib/ai/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { habit_name, status, current_streak, category_id } = await request.json()

  if (!habit_name || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Get user ID for rate limiting
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
  const userId = user?.id

  const result = await getCheckInConfirmation(
    habit_name, 
    status, 
    current_streak ?? 0, 
    category_id ?? 'build_up',
    userId
  )
  return NextResponse.json(result)
}
