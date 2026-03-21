import { getGroqClient, GROQ_MODEL, incrementRateLimit, isRateLimited } from './groq'
import { sanitizeCopy } from '@/lib/utils'

export async function callMirrorAI<T>(
  systemPrompt: string,
  userPrompt: string,
  input: Record<string, unknown>,
  fallback: T,
  userId?: string,
  rateLimitType?: 'checkin' | 'insight'
): Promise<T> {
  try {
    // Check rate limit if userId provided
    if (userId && rateLimitType && isRateLimited(userId, rateLimitType)) {
      return fallback
    }

    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `${userPrompt}\n\nInput: ${JSON.stringify(input)}\n\nReturn only valid JSON.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) return fallback

    const parsed = JSON.parse(text) as T

    // Sanitize any string values in the response
    if (typeof parsed === 'object' && parsed !== null) {
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof value === 'string') {
          (parsed as Record<string, unknown>)[key] = sanitizeCopy(value)
        }
      }
    }

    return parsed
  } catch {
    return fallback
  }
}

export async function getCheckInConfirmation(
  habitName: string,
  status: string,
  currentStreak: number,
  categoryId: string,
  userId?: string
): Promise<{ headline: string }> {
  const FALLBACKS: Record<string, { headline: string }> = {
    done: { headline: 'You showed up today.' },
    partial: { headline: 'You did something.' },
    skip: { headline: 'Not today.' },
    honest_slip: { headline: 'Yesterday was yesterday.' },
  }

  const SYSTEM_PROMPT = "You are Mirror's warm, non-judgmental companion. You respond to habit check-ins with a single short sentence (max 12 words). Never use generic praise like 'great job' or 'well done'. For slips, be compassionate not consoling — acknowledge the moment without dramatizing it. For streaks, be genuine not hype. No emojis. Vary your phrasing every time."
  
  const USER_PROMPT = `User logged habit '${habitName}' with status '${status}'. Current streak: ${currentStreak} days. Category: ${categoryId}. Reply with one warm sentence.`

  return callMirrorAI(
    SYSTEM_PROMPT,
    USER_PROMPT,
    { habit_name: habitName, status, current_streak: currentStreak, category_id: categoryId },
    FALLBACKS[status] ?? FALLBACKS.done,
    userId,
    'checkin'
  )
}

export async function getDailyInsight(
  completedHabits: string[],
  missedHabits: string[],
  skippedHabits: string[],
  totalHabits: number,
  topHabit: string,
  userId?: string
): Promise<{ insight: string }> {
  const SYSTEM_PROMPT = "You are Mirror's daily insight engine. Analyze the user's habit data and generate one honest, warm, non-judgmental insight (2 sentences max). Focus on patterns, not scores. Never mention streaks as achievements. If the user has slips, acknowledge them as human. Tone: like a thoughtful friend who notices things."
  
  const patternSummary = completedHabits.length > 0 
    ? `Completed ${completedHabits.length} habits today`
    : missedHabits.length > 0
    ? `${missedHabits.length} habits not logged yet`
    : 'Quiet day'
  
  const USER_PROMPT = `Today's habits: ${completedHabits.length} completed, ${missedHabits.length} slips, ${skippedHabits.length} skipped out of ${totalHabits} total. Top habit: '${topHabit}'. Recent pattern: ${patternSummary}. Generate a daily insight.`

  return callMirrorAI(
    SYSTEM_PROMPT,
    USER_PROMPT,
    {
      completed: completedHabits.length,
      slipped: missedHabits.length,
      skipped: skippedHabits.length,
      total: totalHabits,
      top_habit: topHabit,
      pattern_summary: patternSummary,
    },
    { insight: 'Another day.' },
    userId,
    'insight'
  )
}

export async function getReflectionPrompt(
  habitsSummary: { name: string; rate: number }[]
): Promise<{ prompt: string }> {
  const SYSTEM_PROMPT = "You are Mirror's reflection guide. Generate thoughtful weekly reflection questions that invite honest self-reflection. Keep questions open-ended and non-analytical. Avoid 'Did you...' questions. Max 15 words."
  
  const USER_PROMPT = `Generate a weekly reflection question based on this week's habit summary.`

  return callMirrorAI(
    SYSTEM_PROMPT,
    USER_PROMPT,
    { week_summary: habitsSummary },
    { prompt: 'What showed up for you this week?' }
  )
}
