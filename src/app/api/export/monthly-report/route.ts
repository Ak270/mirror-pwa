import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

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

  // Get month parameter or default to last month
  const searchParams = request.nextUrl.searchParams
  const monthParam = searchParams.get('month')
  const targetDate = monthParam ? new Date(monthParam) : subMonths(new Date(), 1)
  
  const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd')
  const monthName = format(targetDate, 'MMMM yyyy')

  // Fetch user's habits
  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, icon_emoji, category_id')
    .eq('user_id', user.id)
    .eq('archived', false)

  if (!habits || habits.length === 0) {
    return NextResponse.json({ 
      error: 'No habits found',
      month: monthName 
    }, { status: 404 })
  }

  // Fetch check-ins for the month
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('habit_id, date, status, slip_note')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd)

  // Calculate stats for each habit
  const habitStats = habits.map(habit => {
    const habitCheckIns = checkIns?.filter(ci => ci.habit_id === habit.id) || []
    const totalDays = habitCheckIns.length
    const done = habitCheckIns.filter(ci => ci.status === 'done' || ci.status === 'partial').length
    const slipped = habitCheckIns.filter(ci => ci.status === 'honest_slip').length
    const skipped = habitCheckIns.filter(ci => ci.status === 'skip').length
    const completionRate = totalDays > 0 ? Math.round((done / totalDays) * 100) : 0
    
    // Get slip notes for insights
    const slipNotes = habitCheckIns
      .filter(ci => ci.slip_note)
      .map(ci => ci.slip_note)
      .filter(Boolean)

    return {
      name: habit.name,
      icon: habit.icon_emoji,
      totalDays,
      done,
      slipped,
      skipped,
      completionRate,
      slipNotes: slipNotes.slice(0, 3) // Top 3 slip notes
    }
  })

  // Overall stats
  const totalCheckIns = checkIns?.length || 0
  const totalDone = checkIns?.filter(ci => ci.status === 'done' || ci.status === 'partial').length || 0
  const totalSlipped = checkIns?.filter(ci => ci.status === 'honest_slip').length || 0
  const overallRate = totalCheckIns > 0 ? Math.round((totalDone / totalCheckIns) * 100) : 0

  // Find best and worst performing habits
  const sortedByRate = [...habitStats].sort((a, b) => b.completionRate - a.completionRate)
  const bestHabit = sortedByRate[0]
  const worstHabit = sortedByRate[sortedByRate.length - 1]

  // Generate honest insights
  const insights = generateMonthlyInsights(habitStats, overallRate, totalSlipped, monthName)

  const report = {
    month: monthName,
    period: { start: monthStart, end: monthEnd },
    summary: {
      totalCheckIns,
      totalDone,
      totalSlipped,
      overallCompletionRate: overallRate,
      habitsTracked: habits.length
    },
    habits: habitStats,
    highlights: {
      bestHabit: bestHabit ? {
        name: bestHabit.name,
        rate: bestHabit.completionRate
      } : null,
      worstHabit: worstHabit && worstHabit.completionRate < 50 ? {
        name: worstHabit.name,
        rate: worstHabit.completionRate
      } : null
    },
    insights
  }

  return NextResponse.json(report)
}

function generateMonthlyInsights(
  habitStats: Array<{ name: string; completionRate: number; slipped: number; done: number }>,
  overallRate: number,
  totalSlipped: number,
  monthName: string
): string[] {
  const insights: string[] = []

  // Overall performance insight
  if (overallRate >= 80) {
    insights.push(`${monthName} was strong. ${overallRate}% completion across all habits.`)
  } else if (overallRate >= 60) {
    insights.push(`${monthName} was decent. ${overallRate}% completion. Room to grow.`)
  } else if (overallRate >= 40) {
    insights.push(`${monthName} was inconsistent. ${overallRate}% completion. You can do better.`)
  } else {
    insights.push(`${monthName} was rough. ${overallRate}% completion. Time to reset.`)
  }

  // Slip insight
  if (totalSlipped > 0) {
    insights.push(`You logged ${totalSlipped} honest slip${totalSlipped !== 1 ? 's' : ''}. Honesty is the first step.`)
  }

  // Habit-specific insights
  const excellentHabits = habitStats.filter(h => h.completionRate >= 90)
  const strugglingHabits = habitStats.filter(h => h.completionRate < 50 && h.done > 0)

  if (excellentHabits.length > 0) {
    insights.push(`${excellentHabits.map(h => h.name).join(', ')} — you owned ${excellentHabits.length === 1 ? 'this' : 'these'}.`)
  }

  if (strugglingHabits.length > 0) {
    insights.push(`${strugglingHabits.map(h => h.name).join(', ')} — these need attention.`)
  }

  // Encouragement
  insights.push('Next month is a clean slate. You know what to do.')

  return insights
}
