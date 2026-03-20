import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
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

  const format = request.nextUrl.searchParams.get('format') ?? 'json'

  const [habitsResult, checkInsResult, reflectionsResult] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id),
    supabase.from('check_ins').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('reflections').select('*').eq('user_id', user.id).order('week_start', { ascending: false }),
  ])

  const habits = habitsResult.data ?? []
  const checkIns = checkInsResult.data ?? []
  const reflections = reflectionsResult.data ?? []

  if (format === 'csv') {
    const csvRows = [
      'date,habit_name,habit_category,status,note',
      ...checkIns.map(ci => {
        const habit = habits.find(h => h.id === ci.habit_id)
        return [
          ci.date,
          `"${habit?.name ?? ''}"`,
          habit?.category_id ?? '',
          ci.status,
          `"${(ci.note ?? '').replace(/"/g, '""')}"`,
        ].join(',')
      }),
    ]
    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="mirror-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    habits,
    check_ins: checkIns,
    reflections,
    note: 'Private vault habits are stored only on your device and are not included in this export.',
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="mirror-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
