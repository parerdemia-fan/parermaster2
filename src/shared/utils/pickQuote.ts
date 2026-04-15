import type { QuotesData } from '../hooks/useQuotes.ts'

/** 場面ごとの使用済みセリフ。全候補を一巡するまで同じものを出さない */
const usedQuotes: Record<string, Set<string>> = {}

/** 全場面のローテーション状態をリセットする */
export function resetQuoteRotation(): void {
  for (const key of Object.keys(usedQuotes)) {
    usedQuotes[key].clear()
  }
}

/**
 * quotesデータからセリフをローテーション選択する。
 * 口調グループのセリフとタレント固有セリフをマージし、未使用のものからランダムに選ぶ。
 */
export function pickQuote(
  quotes: QuotesData | null,
  tone: string,
  talentName: string,
  scene: string,
  playerName: string,
  fallback?: string,
): string | null {
  if (!quotes) return fallback ?? null

  const groupTone = tone || '丁寧語'
  const groupLines = quotes.groups[groupTone]?.[scene] ?? []
  const talentLines = quotes.talents[talentName]?.[scene] ?? []
  let candidates = [...groupLines, ...talentLines]

  if (candidates.length === 0) return fallback ?? null

  if (!playerName) {
    candidates = candidates.filter((s) => !s.includes('{player}'))
  }

  if (candidates.length === 0) return fallback ?? null

  if (!usedQuotes[scene]) usedQuotes[scene] = new Set()
  let remaining = candidates.filter((s) => !usedQuotes[scene].has(s))
  if (remaining.length === 0) {
    usedQuotes[scene].clear()
    remaining = candidates
  }

  const picked = remaining[Math.floor(Math.random() * remaining.length)]
  usedQuotes[scene].add(picked)
  return picked.replace('{player}', playerName)
}
