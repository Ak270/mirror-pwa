import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

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

  const { oldUserId } = await request.json()
  if (!oldUserId) return NextResponse.json({ error: 'Missing oldUserId' }, { status: 400 })

  // Check if user is anonymous
  if (!user.is_anonymous) {
    return NextResponse.json({ error: 'User is not anonymous' }, { status: 400 })
  }

  try {
    // Migrate habits
    const { error: habitsError } = await supabase
      .from('habits')
      .update({ user_id: user.id })
      .eq('user_id', oldUserId)

    if (habitsError) throw habitsError

    // Migrate check_ins
    const { error: checkInsError } = await supabase
      .from('check_ins')
      .update({ user_id: user.id })
      .eq('user_id', oldUserId)

    if (checkInsError) throw checkInsError

    // Migrate reflections
    const { error: reflectionsError } = await supabase
      .from('reflections')
      .update({ user_id: user.id })
      .eq('user_id', oldUserId)

    if (reflectionsError) throw reflectionsError

    // Migrate notification subscriptions
    const { error: notifsError } = await supabase
      .from('notification_subscriptions')
      .update({ user_id: user.id })
      .eq('user_id', oldUserId)

    if (notifsError) throw notifsError

    // Update profile to mark migration complete
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        migrated_from: oldUserId,
        updated_at: new Date().toISOString(),
      })

    if (profileError) throw profileError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
