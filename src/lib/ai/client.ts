import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_IDENTITY } from './prompts'
import { sanitizeCopy } from '@/lib/utils'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return _client
}

export async function callMirrorAI<T>(
  prompt: string,
  input: Record<string, unknown>,
  fallback: T
): Promise<T> {
  try {
    const client = getClient()
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      system: SYSTEM_IDENTITY,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nInput: ${JSON.stringify(input)}\n\nReturn only valid JSON matching the output_format.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') return fallback

    const text = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
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
  categoryId: string
): Promise<{ headline: string; subtext: string }> {
  const FALLBACKS: Record<string, { headline: string; subtext: string }> = {
    done: { headline: 'You showed up today.', subtext: 'One more day.' },
    partial: { headline: 'You did something.', subtext: 'That counts.' },
    skip: { headline: 'Not today.', subtext: 'Tomorrow is open.' },
    honest_slip: { headline: 'Yesterday was yesterday.', subtext: 'Today is a new day.' },
  }

  const { CHECK_IN_CONFIRMATION_PROMPT } = await import('./prompts')
  return callMirrorAI(
    CHECK_IN_CONFIRMATION_PROMPT,
    { habit_name: habitName, status, current_streak: currentStreak, category_id: categoryId },
    FALLBACKS[status] ?? FALLBACKS.done
  )
}

export async function getDailyInsight(
  completedHabits: string[],
  missedHabits: string[],
  longestStreak: number
): Promise<{ insight: string }> {
  const { DAILY_INSIGHT_PROMPT } = await import('./prompts')
  return callMirrorAI(
    DAILY_INSIGHT_PROMPT,
    {
      completed_habits: completedHabits,
      missed_habits: missedHabits,
      current_date: new Date().toISOString().split('T')[0],
      longest_streak: longestStreak,
    },
    { insight: 'Another day.' }
  )
}

export async function getReflectionPrompt(
  habitsSummary: { name: string; rate: number }[]
): Promise<{ prompt: string }> {
  const { REFLECTION_PROMPT_GENERATOR } = await import('./prompts')
  return callMirrorAI(
    REFLECTION_PROMPT_GENERATOR,
    { week_summary: habitsSummary },
    { prompt: 'What showed up for you this week?' }
  )
}
