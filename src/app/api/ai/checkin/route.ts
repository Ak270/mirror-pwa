import { NextResponse, type NextRequest } from 'next/server'
import { getCheckInConfirmation } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  const { habit_name, status, current_streak, category_id } = await request.json()

  if (!habit_name || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const result = await getCheckInConfirmation(habit_name, status, current_streak ?? 0, category_id ?? 'build_up')
  return NextResponse.json(result)
}
