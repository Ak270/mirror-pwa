import { getGroqClient, GROQ_MODEL } from './groq'

const SYSTEM_PROMPT = `You are Mirror's AI companion. You generate push notification messages for habit tracking.
Rules:
1) Always fresh — never repeat phrases across calls.
2) Max 15 words for notification body.
3) For break-free habits (addiction recovery): always lead with compassion, never with judgment.
4) When user improves vs yesterday — celebrate the specific delta, not generic praise.
5) For quantity habits — make the math feel exciting not clinical.
6) Vary your tone: sometimes playful, sometimes warm, sometimes gently curious.
7) No emojis in notification title. One emoji max in body if it adds warmth.
8) Never use words: disappointed, failed, weak, again, still (for break-free habits).
9) Return ONLY the JSON with "title" and "body" — no extra text.`

async function callGroq(userPrompt: string): Promise<{ title: string; body: string } | null> {
  try {
    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 80,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (parsed.title && parsed.body) return { title: String(parsed.title), body: String(parsed.body) }
    return null
  } catch (err) {
    console.error('[AI/notifications] Groq call failed:', err)
    return null
  }
}

// ── Timed reminder (build_up, rhythm, mind_spirit) ──────────────────────────

export async function generateTimedReminder(params: {
  habit_name: string
  minutes_until: number
  current_streak: number
  category_id: string
}): Promise<{ title: string; body: string }> {
  const { habit_name, minutes_until, current_streak, category_id } = params

  const phase =
    minutes_until === 15 ? 'gentle heads-up, 15 minutes away, suggest preparation' :
    minutes_until === 10 ? 'get ready, gather what you need, 10 minutes' :
    minutes_until === 5  ? 'final push, almost time, 5 minutes left' :
    'it is time right now, action-oriented, go go go'

  const streakNote = current_streak >= 7 ? ` Current streak: ${current_streak} days — mention protecting it briefly.` : ''

  const prompt = `Habit: "${habit_name}" (category: ${category_id})
Phase: ${phase}${streakNote}
Return JSON: {"title": "${habit_name}", "body": "<15 words max>"}`

  const result = await callGroq(prompt)
  return result ?? {
    title: habit_name,
    body: minutes_until > 0
      ? `Starting in ${minutes_until} minutes`
      : `Time for ${habit_name}`,
  }
}

// ── Break-free check-in ──────────────────────────────────────────────────────

export async function generateBreakFreeCheckin(params: {
  habit_name: string
  hours_since_last: number
  today_count: number
  yesterday_count: number
  daily_goal: number | null
  current_time_label: string
  last_user_response: string | null
}): Promise<{ title: string; body: string; actions: string[] }> {
  const { habit_name, hours_since_last, today_count, yesterday_count, daily_goal, current_time_label, last_user_response } = params

  const goalNote = daily_goal ? ` Their goal today: max ${daily_goal}.` : ''
  const lastNote = last_user_response ? ` Last response: "${last_user_response}".` : ''
  const compNote = yesterday_count > 0
    ? ` Yesterday total: ${yesterday_count}. Today so far: ${today_count}.`
    : ` Today so far: ${today_count}.`

  const prompt = `User is trying to quit/reduce "${habit_name}".
It has been ${hours_since_last} hour(s) since last check-in. Time: ${current_time_label}.${compNote}${goalNote}${lastNote}
Ask how they're doing right now. Warm, non-judgmental. Reference their last response if available.
Return JSON: {"title": "Checking in", "body": "<15 words max — warm, curious>"}`

  const result = await callGroq(prompt)
  return {
    title: result?.title ?? 'Checking in',
    body: result?.body ?? `${hours_since_last}h check — how are you holding up?`,
    actions: ['Still holding 💪', 'Had a moment'],
  }
}

// ── Break-free slip reaction ─────────────────────────────────────────────────

export async function generateSlipReaction(params: {
  habit_name: string
  today_count: number
  yesterday_count: number
  daily_goal: number | null
  time_of_day: string
}): Promise<{ title: string; body: string }> {
  const { habit_name, today_count, yesterday_count, daily_goal, time_of_day } = params

  const goalNote = daily_goal ? ` Goal: max ${daily_goal} per day.` : ''

  let context = ''
  if (yesterday_count > 0 && today_count < yesterday_count) {
    context = `Today: ${today_count}, yesterday: ${yesterday_count} — celebrate the REDUCTION first.`
  } else if (today_count === yesterday_count) {
    context = `Today: ${today_count}, same as yesterday at this time. Acknowledge, note same as yesterday.`
  } else {
    context = `Today: ${today_count}, yesterday: ${yesterday_count}. Lead with compassion, ask what triggered it.`
  }

  const prompt = `User trying to quit "${habit_name}" just had a slip. Time: ${time_of_day}.
${context}${goalNote}
NEVER use: disappointed, failed, weak, again, still.
If reduction vs yesterday → lead with celebration of the specific number. Always compassionate.
Return JSON: {"title": "Mirror", "body": "<15 words max>"}`

  const result = await callGroq(prompt)
  return result ?? {
    title: 'Mirror',
    body: today_count < yesterday_count
      ? `${today_count} vs ${yesterday_count} yesterday at this time — real progress.`
      : `Moments happen. You're still here, still trying.`,
  }
}

// ── Quantity nudge ───────────────────────────────────────────────────────────

export async function generateQuantityNudge(params: {
  habit_name: string
  daily_target: number
  unit: string
  running_total: number
  yesterday_total_at_same_time: number | null
  current_time_label: string
}): Promise<{ title: string; body: string; actions: string[] }> {
  const { habit_name, daily_target, unit, running_total, yesterday_total_at_same_time, current_time_label } = params

  const remaining = daily_target - running_total
  const yesterdayNote = yesterday_total_at_same_time !== null
    ? ` Yesterday at this time: ${yesterday_total_at_same_time} ${unit}.`
    : ''

  const comparison = yesterday_total_at_same_time !== null
    ? running_total > yesterday_total_at_same_time
      ? ` Currently AHEAD of yesterday's pace — celebrate this.`
      : running_total === yesterday_total_at_same_time
      ? ` On pace with yesterday.`
      : ` Behind yesterday's pace by ${yesterday_total_at_same_time - running_total} ${unit}.`
    : ''

  const prompt = `User tracking "${habit_name}" (goal: ${daily_target} ${unit}/day).
Current total: ${running_total} ${unit}. Remaining: ${remaining > 0 ? remaining : 0} ${unit}.
Time: ${current_time_label}.${yesterdayNote}${comparison}
Make the math feel exciting. If ahead of yesterday → celebrate specifically.
Return JSON: {"title": "${habit_name}", "body": "<15 words max>"}`

  const result = await callGroq(prompt)

  // Build sensible default quick-log actions for common units
  const actions = buildQuantityActions(unit)

  return {
    title: result?.title ?? habit_name,
    body: result?.body ?? `${running_total} of ${daily_target} ${unit} — keep going`,
    actions,
  }
}

// ── Goal met celebration ─────────────────────────────────────────────────────

export async function generateGoalMet(params: {
  habit_name: string
  daily_target: number
  unit: string
  actual_total: number
  time_achieved: string
}): Promise<{ title: string; body: string }> {
  const { habit_name, daily_target, unit, time_achieved } = params

  const prompt = `User just completed their daily goal for "${habit_name}": ${daily_target} ${unit} achieved at ${time_achieved}.
Celebrate warmly. Make them feel the win.
Return JSON: {"title": "<habit name> goal done", "body": "<15 words max — celebratory>"}`

  const result = await callGroq(prompt)
  return result ?? {
    title: `${habit_name} goal done`,
    body: `All ${daily_target} ${unit} done. 🎉`,
  }
}

// ── End of day catch-up ──────────────────────────────────────────────────────

export async function generateEndOfDay(params: {
  unlogged_habits: Array<{ name: string; category_id: string }>
  logged_count: number
  total_count: number
}): Promise<{ title: string; body: string; actions: string[] }> {
  const { unlogged_habits, logged_count, total_count } = params

  const habitList = unlogged_habits.map(h => h.name).join(', ')

  const prompt = `It's end of day. User logged ${logged_count}/${total_count} habits.
Unlogged: ${habitList}.
Ask warmly how the day went overall. Non-pressuring. Mention it's okay if things didn't go perfectly.
Max 2 sentences.
Return JSON: {"title": "Day wrap-up", "body": "<30 words max>"}`

  const result = await callGroq(prompt)
  return {
    title: result?.title ?? 'Day wrap-up',
    body: result?.body ?? `${unlogged_habits.length} habits still unlogged. How did the rest of the day go?`,
    actions: ['All done', 'Mixed day', 'Rough day'],
  }
}

// ── Break-free count update reaction ────────────────────────────────────────

export async function generateBreakFreeCountReaction(params: {
  habit_name: string
  today_count: number
  yesterday_count_at_same_time: number | null
  daily_goal: number | null
  current_time_label: string
}): Promise<{ title: string; body: string }> {
  const { habit_name, today_count, yesterday_count_at_same_time, daily_goal, current_time_label } = params

  const goalNote = daily_goal ? ` Goal: max ${daily_goal}/day.` : ''
  const comparison = yesterday_count_at_same_time !== null
    ? today_count < yesterday_count_at_same_time
      ? ` Only ${today_count} vs ${yesterday_count_at_same_time} yesterday at ${current_time_label} — celebrate.`
      : ` ${today_count} today vs ${yesterday_count_at_same_time} yesterday at this time.`
    : ''

  const prompt = `User tracking "${habit_name}" reduction.${comparison}${goalNote}
React to the comparison. If better than yesterday → celebrate the specific numbers.
Return JSON: {"title": "Mirror", "body": "<15 words max>"}`

  const result = await callGroq(prompt)
  return result ?? {
    title: 'Mirror',
    body: yesterday_count_at_same_time !== null && today_count < yesterday_count_at_same_time
      ? `${today_count} vs ${yesterday_count_at_same_time} yesterday — that's real progress.`
      : `Count update noted. Keep going.`,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildQuantityActions(unit: string): string[] {
  const u = unit.toLowerCase()
  if (u.includes('glass') || u.includes('water') || u.includes('ml') || u.includes('litre')) {
    return ['Half glass', '1 glass', '1.5 glasses']
  }
  if (u.includes('page') || u.includes('pages')) {
    return ['5 pages', '10 pages', '20 pages']
  }
  if (u.includes('minute') || u.includes('min')) {
    return ['10 min', '20 min', '30 min']
  }
  if (u.includes('step')) {
    return ['1000 steps', '2000 steps', '5000 steps']
  }
  return ['1', '2', '3']
}

export function parseQuantityFromText(text: string, unit: string): number | null {
  if (!text) return null
  const lower = text.toLowerCase().trim()

  // Handle fractions
  if (lower === 'half' || lower === '0.5') return 0.5
  if (lower === 'quarter') return 0.25

  // Extract number from text like "1 glass", "2 cups", "200ml"
  const match = lower.match(/^([\d.]+)/)
  if (match) {
    const num = parseFloat(match[1])
    if (!isNaN(num)) return num
  }

  // Handle named amounts for water
  const u = unit.toLowerCase()
  if (u.includes('glass')) {
    if (lower.includes('half')) return 0.5
    if (lower.includes('one') || lower === '1 glass') return 1
    if (lower.includes('1.5')) return 1.5
  }

  return null
}
