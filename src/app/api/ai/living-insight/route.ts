import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callMirrorAI } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { 
      completion_pct, 
      done, 
      total, 
      completed_habits_names, 
      remaining_habits_names,
      time_label,
      top_habit,
      top_streak
    } = body

    // Determine tone based on completion percentage
    const getToneInstruction = (pct: number): string => {
      if (pct === 0) return "gentle, early, open. Max 8 words. Example: 'Morning. Everything is still possible today.'"
      if (pct < 30) return "warm, acknowledging the start. Reference one specific habit done. Max 10 words."
      if (pct < 50) return "momentum language. Specific. Max 10 words. Example: 'Morning Workout done. The day has a spine now.'"
      if (pct < 70) return "honest acknowledgment of halfway. Specific about what's done and what remains. Max 12 words."
      if (pct < 80) return "strong, specific, identity-based. 'You are someone who...' language. Max 12 words."
      if (pct < 90) return "urgency of proximity. 'One more' energy. Specific about remaining habits. Max 10 words."
      if (pct < 100) return "maximum specificity. Name the exact remaining habit. Max 15 words."
      return "witnessing language. Reference the date. Do not say 'great job'. Do not say 'well done'. Witness, don't praise."
    }

    const tone = getToneInstruction(completion_pct)

    const SYSTEM_PROMPT = `You are Mirror's living progress companion. You generate ONE sentence that evolves as the user's day progresses. You never use generic praise. You witness specifically. You speak to the moment they're in right now. FORBIDDEN WORDS: great job, well done, amazing, awesome, crushing it. REQUIRED: Be specific to their actual habits. Vary your phrasing every time.`

    const USER_PROMPT = `User is at ${completion_pct}% completion today (${done} of ${total} habits).
Completed: ${completed_habits_names.join(', ') || 'none yet'}.
Remaining: ${remaining_habits_names.join(', ') || 'none'}.
Time of day: ${time_label}.
Habit with longest streak: '${top_habit}' at Day ${top_streak}.

Tone instruction: ${tone}

Generate ONE sentence. No emojis. Be specific to this person's actual data.`

    const result = await callMirrorAI<{ insight: string }>(
      SYSTEM_PROMPT,
      USER_PROMPT,
      { 
        completion_pct, 
        done, 
        total, 
        completed: completed_habits_names,
        remaining: remaining_habits_names,
        time_label,
        top_habit,
        top_streak
      },
      { insight: completion_pct === 100 ? 'You showed up for everything.' : 'Day is open.' },
      user.id,
      'insight'
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Living insight error:', error)
    return NextResponse.json({ insight: 'Another day.' }, { status: 200 })
  }
}
