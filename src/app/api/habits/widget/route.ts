import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  // Check for Bearer token (for external widgets like iOS Scriptable)
  const authHeader = request.headers.get('authorization')
  let supabase
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    // Create Supabase client with the provided token
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
  } else {
    // Use cookie-based auth for web requests
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

  // Fetch habits with today's check-ins
  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, icon_emoji, category_id, display_type, archived')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: true })

  if (!habits) return NextResponse.json({ habits: [] })

  // Fetch today's check-ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('habit_id, status, quantifiable_value, quantifiable_unit')
    .eq('user_id', user.id)
    .eq('date', today)

  const checkInMap = new Map(checkIns?.map(ci => [ci.habit_id, ci]) || [])

  // Fetch streaks for each habit
  const habitsWithData = await Promise.all(
    habits.map(async (habit) => {
      const checkIn = checkInMap.get(habit.id)
      
      // Calculate streak
      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select('date, status')
        .eq('habit_id', habit.id)
        .gte('date', format(new Date(Date.now() - 90 * 86400000), 'yyyy-MM-dd'))
        .order('date', { ascending: false })

      let currentStreak = 0
      if (recentCheckIns && recentCheckIns.length > 0) {
        const sortedDates = recentCheckIns.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        
        for (let i = 0; i < sortedDates.length; i++) {
          const checkDate = new Date(sortedDates[i].date)
          const expectedDate = new Date(Date.now() - i * 86400000)
          const dayDiff = Math.floor((expectedDate.getTime() - checkDate.getTime()) / 86400000)
          
          if (dayDiff <= 1 && ['done', 'partial'].includes(sortedDates[i].status)) {
            currentStreak++
          } else {
            break
          }
        }
      }

      return {
        id: habit.id,
        name: habit.name,
        icon: habit.icon_emoji,
        category_id: habit.category_id,
        display_type: habit.display_type,
        today_status: checkIn?.status || null,
        today_value: checkIn?.quantifiable_value || null,
        today_unit: checkIn?.quantifiable_unit || null,
        current_streak: currentStreak,
      }
    })
  )

  return NextResponse.json({ 
    habits: habitsWithData,
    date: today,
    user_id: user.id,
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
