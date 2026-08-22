import type { QuestionData } from '../../shared/types/question.ts'
import type { ClearedRecords, HistoryRecords } from '../../stores/questionHistoryStore.ts'
import { questionFingerprint } from '../../shared/utils/questionFingerprint.ts'

/** 内訳の集計対象（世代タブ） */
export type GenerationFilter = 'all' | 1 | 2

/** 難易度（★数）ごとの内訳。attempted は一度でも回答した数（正解済みを含む） */
export interface StarBreakdownRow {
  stars: number
  cleared: number
  attempted: number
  total: number
}

function countMatching(
  questions: readonly Pick<QuestionData, 'question' | 'answers'>[],
  match: (fingerprint: string) => boolean,
): number {
  let count = 0
  for (const q of questions) {
    if (match(questionFingerprint(q.question, q.answers[0]))) count++
  }
  return count
}

/**
 * 現存する問題のうち一度でも正解したものの数。
 * 削除された問題のフィンガープリントは履歴に残っていても数えない。
 */
export function countClearedQuestions(
  cleared: ClearedRecords,
  questions: readonly Pick<QuestionData, 'question' | 'answers'>[],
): number {
  return countMatching(questions, (fp) => cleared[fp] === true)
}

/**
 * 世代タブで絞り込む。共通問題（generation 0）は1期生・2期生の両方に含める
 * （出題プールの絞り込みと同じ条件）。
 */
export function filterByGeneration(
  questions: readonly QuestionData[],
  filter: GenerationFilter,
): QuestionData[] {
  if (filter === 'all') return [...questions]
  return questions.filter((q) => q.generation === 0 || q.generation === filter)
}

/**
 * 問題を難易度（★数）ごとに分け、正解済み数・回答済み数を集計する。
 * ★は問題データの difficulty 値そのまま（★0 = 2期生きほん専用の問題）。
 */
export function buildStarBreakdown(
  questions: readonly QuestionData[],
  cleared: ClearedRecords,
  records: HistoryRecords,
): StarBreakdownRow[] {
  const byStars = new Map<number, QuestionData[]>()
  for (const q of questions) {
    const group = byStars.get(q.difficulty) ?? []
    group.push(q)
    byStars.set(q.difficulty, group)
  }
  return [...byStars.entries()]
    .sort(([a], [b]) => a - b)
    .map(([stars, group]) => ({
      stars,
      cleared: countClearedQuestions(cleared, group),
      attempted: countMatching(group, (fp) => records[fp] !== undefined),
      total: group.length,
    }))
}
