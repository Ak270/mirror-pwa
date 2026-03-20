import type { CheckIn, CorrelationResult } from '@/types'

function isCompleted(status: string): boolean {
  return status === 'done' || status === 'partial'
}

export function computeCorrelations(
  habitAId: string,
  habitAName: string,
  checkInsA: CheckIn[],
  habitBId: string,
  habitBName: string,
  checkInsB: CheckIn[]
): CorrelationResult {
  const dateSetA = new Set(checkInsA.map(c => c.date))
  const dateSetB = new Set(checkInsB.map(c => c.date))
  const sharedDates = [...dateSetA].filter(d => dateSetB.has(d))

  const n = sharedDates.length

  if (n < 30) {
    return noResult(habitAId, habitAName, habitBId, habitBName)
  }

  const x: number[] = []
  const y: number[] = []

  const mapA = Object.fromEntries(checkInsA.map(c => [c.date, c]))
  const mapB = Object.fromEntries(checkInsB.map(c => [c.date, c]))

  let rateWhenADoneNumerator = 0
  let rateWhenADoneDenominator = 0
  let rateWhenANotDoneNumerator = 0
  let rateWhenANotDoneDenominator = 0

  for (const date of sharedDates) {
    const aDone = isCompleted(mapA[date]?.status ?? '') ? 1 : 0
    const bDone = isCompleted(mapB[date]?.status ?? '') ? 1 : 0
    x.push(aDone)
    y.push(bDone)

    if (aDone) {
      rateWhenADoneDenominator++
      if (bDone) rateWhenADoneNumerator++
    } else {
      rateWhenANotDoneDenominator++
      if (bDone) rateWhenANotDoneNumerator++
    }
  }

  const r = pearsonCorrelation(x, y)
  const absR = Math.abs(r)
  const isSignificant = absR >= 0.3 && n >= 30

  const rateWhenADone = rateWhenADoneDenominator > 0
    ? (rateWhenADoneNumerator / rateWhenADoneDenominator) * 100
    : 0
  const rateWhenANotDone = rateWhenANotDoneDenominator > 0
    ? (rateWhenANotDoneNumerator / rateWhenANotDoneDenominator) * 100
    : 0

  const confidence = absR >= 0.6 ? 'high' : absR >= 0.4 ? 'medium' : 'low'
  const direction = r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'none'

  const insight_copy = buildInsightCopy(
    habitAName,
    habitBName,
    rateWhenADone,
    rateWhenANotDone,
    direction
  )

  return {
    habit_a_id: habitAId,
    habit_a_name: habitAName,
    habit_b_id: habitBId,
    habit_b_name: habitBName,
    correlation_coefficient: r,
    sample_size: n,
    is_significant: isSignificant,
    confidence,
    direction,
    rate_when_a_done: rateWhenADone,
    rate_when_a_not_done: rateWhenANotDone,
    insight_copy,
  }
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0) return 0

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denom = Math.sqrt(denomX * denomY)
  return denom === 0 ? 0 : num / denom
}

function buildInsightCopy(
  nameA: string,
  nameB: string,
  rateWhenDone: number,
  rateWhenNotDone: number,
  direction: 'positive' | 'negative' | 'none'
): string {
  const done = Math.round(rateWhenDone)
  const notDone = Math.round(rateWhenNotDone)

  if (direction === 'positive') {
    return `When you do ${nameA}, you also do ${nameB} ${done}% of those days — versus ${notDone}% when you don't.`
  }
  if (direction === 'negative') {
    return `On days you do ${nameA}, you do ${nameB} only ${done}% of the time — but ${notDone}% when you skip ${nameA}.`
  }
  return `${nameA} and ${nameB} show no strong pattern together yet.`
}

function noResult(aId: string, aName: string, bId: string, bName: string): CorrelationResult {
  return {
    habit_a_id: aId,
    habit_a_name: aName,
    habit_b_id: bId,
    habit_b_name: bName,
    correlation_coefficient: 0,
    sample_size: 0,
    is_significant: false,
    confidence: 'low',
    direction: 'none',
    rate_when_a_done: 0,
    rate_when_a_not_done: 0,
    insight_copy: '',
  }
}
