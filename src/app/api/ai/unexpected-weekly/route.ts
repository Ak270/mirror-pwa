import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callMirrorAI } from '@/lib/ai/client'
import { startOfWeek, format } from 'date-fns'

/**
 * Task 08: Unexpected Weekly Message System
 * Sent randomly once per week, at a random time. Not tied to any habit.
 * Just Mirror noticing something specific. The unpredictability + specificity = highest dopamine spike.
 */

interface PatternData {
  id: string
  rawMessage: string
  data: Record<string, any>
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd')

    // Check if we've already sent a message this week
    const { data: sentThisWeek } = await supabase
      .from('unexpected_messages_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .limit(1)

    if (sentThisWeek && sentThisWeek.length > 0) {
      return NextResponse.json({ message: null, reason: 'Already sent this week' })
    }

    // Get recent patterns sent (last 4 weeks) to avoid repeats
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const { data: recentPatterns } = await supabase
      .from('unexpected_messages_log')
      .select('pattern_id')
      .eq('user_id', user.id)
      .gte('sent_at', fourWeeksAgo.toISOString())

    const usedPatternIds = new Set(recentPatterns?.map(p => p.pattern_id) || [])

    // Fetch user's habits and check-ins
    const { data: habits } = await supabase
      .from('habits')
      .select('*, check_ins(*)')
      .eq('user_id', user.id)
      .eq('archived', false)

    if (!habits || habits.length === 0) {
      return NextResponse.json({ message: null, reason: 'No habits' })
    }

    // Try to detect a pattern
    const pattern = await detectPattern(habits, usedPatternIds, user.id, supabase)

    if (!pattern) {
      return NextResponse.json({ message: null, reason: 'No pattern detected' })
    }

    // Use Groq to refine the message
    const SYSTEM_PROMPT = `You are Mirror. Write ONE sentence that witnesses something specific this person built. Do not praise. Do not motivate. Just name what you saw. Max 15 words. No emojis.`

    const result = await callMirrorAI<{ message: string }>(
      SYSTEM_PROMPT,
      `Pattern detected: ${pattern.rawMessage}\n\nData: ${JSON.stringify(pattern.data)}\n\nWrite the final message.`,
      pattern.data,
      { message: pattern.rawMessage },
      user.id
    )

    // Log the sent message
    await supabase.from('unexpected_messages_log').insert({
      user_id: user.id,
      pattern_id: pattern.id,
      week_start: weekStart,
      sent_at: new Date().toISOString()
    })

    return NextResponse.json({ message: result.message, pattern_id: pattern.id })
  } catch (error) {
    console.error('Unexpected weekly message error:', error)
    return NextResponse.json({ message: null, error: 'Failed to generate' }, { status: 500 })
  }
}

async function detectPattern(
  habits: any[],
  usedPatternIds: Set<string>,
  userId: string,
  supabase: any
): Promise<PatternData | null> {
  const availablePatterns: PatternData[] = []

  // Pattern 1: Longest ever
  if (!usedPatternIds.has('longest_ever')) {
    const longestHabit = habits.reduce((max, h) => 
      (h.current_streak > (max?.current_streak || 0) && h.current_streak === h.best_streak) ? h : max
    , null)

    if (longestHabit && longestHabit.current_streak >= 14) {
      availablePatterns.push({
        id: 'longest_ever',
        rawMessage: `${longestHabit.name} — Day ${longestHabit.current_streak}. That's the longest you've ever done anything in Mirror. You're writing new history.`,
        data: { habit_name: longestHabit.name, streak: longestHabit.current_streak }
      })
    }
  }

  // Pattern 2: Quiet consistency
  if (!usedPatternIds.has('quiet_consistency')) {
    const consistentHabits = habits.filter(h => {
      if (!h.check_ins || h.check_ins.length < 30) return false
      const last30Days = h.check_ins.slice(0, 30)
      const completionRate = last30Days.filter((c: any) => c.status === 'done').length / 30
      return completionRate >= 0.8
    })

    if (consistentHabits.length > 0) {
      const habit = consistentHabits[0]
      const completionPct = Math.round((habit.check_ins.filter((c: any) => c.status === 'done').length / Math.min(30, habit.check_ins.length)) * 100)
      
      availablePatterns.push({
        id: 'quiet_consistency',
        rawMessage: `${habit.name} — ${completionPct}% over 30 days. You built that quietly. No fanfare. Just showing up.`,
        data: { habit_name: habit.name, completion_pct: completionPct }
      })
    }
  }

  // Pattern 3: Total log milestone
  if (!usedPatternIds.has('total_log_milestone')) {
    const { count } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const milestones = [100, 250, 500, 1000]
    const milestone = milestones.find(m => count >= m && count < m + 50)

    if (milestone) {
      availablePatterns.push({
        id: 'total_log_milestone',
        rawMessage: `${count} times you've opened Mirror and been honest. That's not nothing.`,
        data: { count }
      })
    }
  }

  // Pattern 4: Since the beginning
  if (!usedPatternIds.has('since_the_beginning')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single()

    if (profile) {
      const created = new Date(profile.created_at)
      const now = new Date()
      const daysSince = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      const milestones = [30, 90, 180, 365]
      
      if (milestones.includes(daysSince)) {
        availablePatterns.push({
          id: 'since_the_beginning',
          rawMessage: `${daysSince} days since you started Mirror. The version of you who downloaded it wanted this. They were right to.`,
          data: { days: daysSince }
        })
      }
    }
  }

  // Randomly select one available pattern
  if (availablePatterns.length === 0) return null
  return availablePatterns[Math.floor(Math.random() * availablePatterns.length)]
}
