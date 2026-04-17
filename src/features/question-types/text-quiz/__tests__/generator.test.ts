import { describe, it, expect } from 'vitest'
import { generateTextQuizQuestions, type QuizSegment } from '../generator.ts'
import type { QuestionData } from '../../../../shared/types/question.ts'
import type { Talent } from '../../../../shared/types/talent.ts'

function makeTalent(id: string, name: string, gen: number, dorm: string): Talent {
  return {
    id, generation: gen, dormitory: dorm, name, kana: '', familyName: '', givenName: '',
    familyKana: '', givenKana: '', nicknames: [], firstPerson: '', intro: '', dream: '',
    birthday: '', height: 160, bloodType: '', hairColor: '', hairStyle: '',
    eyeColorLeft: '', eyeColorRight: '', mbti: '', fanName: '', fanMark: '',
    hashtags: [], hobbies: [], skills: [], favorites: [], links: [], tone: '',
  }
}

function makeQuestion(id: string, difficulty: number, gen: number): QuestionData {
  return {
    id, generation: gen, question: `問題${id}`, answers: ['正解', 'A', 'B', 'C'],
    difficulty, genre: '', sortAnswers: false, hideIcon: false,
    questionImage: null, commentImage: null, answerPool: '', comment: '', sourceUrl: '',
  }
}

const TALENTS: Talent[] = [
  makeTalent('t1', 'タレントA', 1, 'wa'),
  makeTalent('t2', 'タレントB', 1, 'me'),
  makeTalent('t3', 'タレントC', 2, 'co'),
  makeTalent('t4', 'タレントD', 2, 'wh'),
  makeTalent('t5', 'タレントE', 1, 'wa'),
  makeTalent('t6', 'タレントF', 2, 'me'),
]

const QUESTIONS: QuestionData[] = [
  makeQuestion('q1', 1, 0),
  makeQuestion('q2', 1, 1),
  makeQuestion('q3', 2, 0),
  makeQuestion('q4', 2, 1),
  makeQuestion('q5', 3, 0),
  makeQuestion('q6', 3, 2),
  makeQuestion('q7', 4, 1),
  makeQuestion('q8', 5, 0),
]

const ANSWER_SETS: Record<string, string[]> = {
  'テストセット': ['タレントA', 'タレントB', 'タレントC'],
}

describe('generateTextQuizQuestions', () => {
  it('セグメント定義通りの問題数を生成する', () => {
    const segments: QuizSegment[] = [
      { level: 1, count: 2, ordered: false },
      { level: 2, count: 1, ordered: false },
    ]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS)
    expect(result).toHaveLength(3)
  })

  it('ordered=true のセグメントは問題の元順序を保持する', () => {
    const segments: QuizSegment[] = [
      { level: 1, count: 2, ordered: true },
    ]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS)
    expect(result).toHaveLength(2)
    // ordered=true なので q1, q2 の順（pool内のdifficulty=1は q1, q2）
    expect(result[0].questionId).toBe('q1')
    expect(result[1].questionId).toBe('q2')
  })

  it('プール内の問題数が不足する場合は可能な分だけ生成する', () => {
    const segments: QuizSegment[] = [
      { level: 5, count: 10, ordered: false }, // difficulty=5 は1問のみ
    ]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS)
    expect(result).toHaveLength(1)
  })

  it('correctIndex が正解の選択肢を指している', () => {
    const segments: QuizSegment[] = [{ level: 1, count: 2, ordered: true }]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS)
    for (const q of result) {
      expect(q.answers[q.correctIndex]).toBe('正解')
    }
  })

  it('全選択肢がタレント名の場合 answerTalentIds が設定される', () => {
    const talentQ = makeQuestion('tq1', 1, 0)
    talentQ.answers = ['タレントA', 'タレントB', 'タレントC', 'タレントD']
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([talentQ], segments, 1, TALENTS, ANSWER_SETS)
    expect(result[0].answerTalentIds).not.toBeNull()
    expect(result[0].answerTalentIds).toHaveLength(4)
  })

  it('一部がタレント名でない場合 answerTalentIds は null', () => {
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS)
    expect(result[0].answerTalentIds).toBeNull()
  })

  it('空文字列の選択肢がタレント名で補完される', () => {
    const q = makeQuestion('eq1', 1, 0)
    q.answers = ['正解', '', '', '']
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS)
    // 4つすべて非空
    for (const a of result[0].answers) {
      expect(a).not.toBe('')
    }
    // 重複なし
    expect(new Set(result[0].answers).size).toBe(4)
  })

  it('[セット名] の選択肢が answerSets から補完される', () => {
    const q = makeQuestion('sq1', 1, 0)
    q.answers = ['正解', '[テストセット]', '[テストセット]', '[テストセット]']
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS)
    for (const a of result[0].answers) {
      expect(a).not.toMatch(/^\[.*\]$/)
    }
  })

  it('[寮名] の選択肢が該当寮のタレントで補完される', () => {
    const q = makeQuestion('dq1', 1, 0)
    q.answers = ['正解', '[バゥ寮]', '[ミュゥ寮]', '[クゥ寮]']
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS)
    // 寮名形式が残っていないこと
    for (const a of result[0].answers) {
      expect(a).not.toMatch(/^\[.*寮\]$/)
    }
  })
})
