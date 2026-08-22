import { describe, it, expect } from 'vitest'
import { buildStarBreakdown, countClearedQuestions, filterByGeneration } from '../clearedStats.ts'
import { questionFingerprint } from '../../../shared/utils/questionFingerprint.ts'
import type { QuestionData } from '../../../shared/types/question.ts'

const q = (question: string, correct: string) => ({ question, answers: [correct] })
const fp = (question: string, correct: string) => questionFingerprint(question, correct)

describe('countClearedQuestions（知識クイズの正解数集計）', () => {
  it('一度でも正解した問題を数える', () => {
    const cleared = { [fp('Q1', 'A1')]: true, [fp('Q2', 'A2')]: true } as const
    const questions = [q('Q1', 'A1'), q('Q2', 'A2'), q('Q3', 'A3')]
    expect(countClearedQuestions(cleared, questions)).toBe(2)
  })

  it('削除された問題は数えない', () => {
    const cleared = { [fp('Q1', 'A1')]: true, [fp('削除済み', 'A')]: true } as const
    expect(countClearedQuestions(cleared, [q('Q1', 'A1')])).toBe(1)
  })

  it('正解履歴が空なら0', () => {
    expect(countClearedQuestions({}, [q('Q1', 'A1')])).toBe(0)
  })

  it('問題文または正解が変わった問題は別問題として扱う（未正解になる）', () => {
    const cleared = { [fp('Q1', 'A1')]: true } as const
    expect(countClearedQuestions(cleared, [q('Q1', 'A1改')])).toBe(0)
  })
})

/** テスト用の最小限の問題データ */
const question = (id: string, difficulty: number, correct: string): QuestionData => ({
  id,
  generation: 0,
  question: id,
  answers: [correct, 'x', 'y', 'z'],
  difficulty,
  genre: '',
  sortAnswers: false,
  hideIcon: false,
  questionImage: null,
  commentImage: null,
  answerPool: '',
  comment: '',
  sourceUrl: '',
})

describe('buildStarBreakdown（★別内訳）', () => {
  const questions = [
    question('q1', 0, 'A'),
    question('q2', 1, 'B'),
    question('q3', 3, 'C'),
    question('q4', 3, 'D'),
    question('q5', 7, 'E'),
  ]

  it('difficulty ごとに★の行を分ける（★0を独立させる）', () => {
    const rows = buildStarBreakdown(questions, {}, {})
    expect(rows.map((r) => [r.stars, r.total])).toEqual([[0, 1], [1, 1], [3, 2], [7, 1]])
  })

  it('★の昇順で並ぶ', () => {
    const rows = buildStarBreakdown([question('a', 7, 'A'), question('b', 2, 'B')], {}, {})
    expect(rows.map((r) => r.stars)).toEqual([2, 7])
  })

  it('正解済み数と回答済み数を別々に数える', () => {
    // q3 は正解済み、q4 は回答したが未正解、q5 は未出題
    const cleared = { [fp('q3', 'C')]: true } as const
    const records = { [fp('q3', 'C')]: 2, [fp('q4', 'D')]: 0 }
    const rows = buildStarBreakdown(questions, cleared, records)
    const star3 = rows.find((r) => r.stars === 3)!
    expect(star3).toEqual({ stars: 3, cleared: 1, attempted: 2, total: 2 })
    expect(rows.find((r) => r.stars === 7)).toEqual({ stars: 7, cleared: 0, attempted: 0, total: 1 })
  })

  it('正解後に不正解になった問題も正解済みのまま数える', () => {
    const cleared = { [fp('q2', 'B')]: true } as const
    const records = { [fp('q2', 'B')]: 0 }
    const rows = buildStarBreakdown(questions, cleared, records)
    expect(rows.find((r) => r.stars === 1)).toEqual({ stars: 1, cleared: 1, attempted: 1, total: 1 })
  })

  it('内訳の合計が全体の正解済み数・問題数と一致する', () => {
    const cleared = { [fp('q1', 'A')]: true, [fp('q4', 'D')]: true } as const
    const rows = buildStarBreakdown(questions, cleared, {})
    expect(rows.reduce((n, r) => n + r.cleared, 0)).toBe(countClearedQuestions(cleared, questions))
    expect(rows.reduce((n, r) => n + r.total, 0)).toBe(questions.length)
  })
})

describe('filterByGeneration（世代タブ）', () => {
  const common = { ...question('c1', 1, 'A'), generation: 0 }
  const gen1 = { ...question('g1', 1, 'B'), generation: 1 }
  const gen2 = { ...question('g2', 1, 'C'), generation: 2 }
  const questions = [common, gen1, gen2]

  it('全体タブは全問題', () => {
    expect(filterByGeneration(questions, 'all')).toEqual(questions)
  })

  it('共通問題（世代0）は1期生・2期生の両方に含める', () => {
    expect(filterByGeneration(questions, 1)).toEqual([common, gen1])
    expect(filterByGeneration(questions, 2)).toEqual([common, gen2])
  })
})
