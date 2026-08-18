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
  // 1期生3名・2期生3名の世代混在セット（選択肢スコープの検証用）
  '混在セット': ['タレントA', 'タレントB', 'タレントE', 'タレントC', 'タレントD', 'タレントF'],
  // talents.json に存在しないメンバーのみのセット（外部ゲスト想定）
  '外部セット': ['ゲストX', 'ゲストY', 'ゲストZ'],
  // 1期生のみのセット（スコープ絞り込みで0件になるケースの検証用）
  '1期のみセット': ['タレントA', 'タレントB', 'タレントE'],
}

/** [セット名]×3 をダミーに持つ問題を作る */
function makeSetQuestion(id: string, setName: string): QuestionData {
  const q = makeQuestion(id, 1, 0)
  q.answers = ['正解', `[${setName}]`, `[${setName}]`, `[${setName}]`]
  return q
}

const ONE_SEGMENT: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]

/** ダミー選択肢（正解以外）を返す */
function dummiesOf(answers: string[]): string[] {
  return answers.filter((a) => a !== '正解')
}

describe('generateTextQuizQuestions', () => {
  it('セグメント定義通りの問題数を生成する', () => {
    const segments: QuizSegment[] = [
      { level: 1, count: 2, ordered: false },
      { level: 2, count: 1, ordered: false },
    ]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS, 0)
    expect(result).toHaveLength(3)
  })

  it('ordered=true のセグメントは問題の元順序を保持する', () => {
    const segments: QuizSegment[] = [
      { level: 1, count: 2, ordered: true },
    ]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS, 0)
    expect(result).toHaveLength(2)
    // ordered=true なので q1, q2 の順（pool内のdifficulty=1は q1, q2）
    expect(result[0].questionId).toBe('q1')
    expect(result[1].questionId).toBe('q2')
  })

  it('プール内の問題数が不足する場合は可能な分だけ生成する', () => {
    const segments: QuizSegment[] = [
      { level: 5, count: 10, ordered: false }, // difficulty=5 は1問のみ
    ]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS, 0)
    expect(result).toHaveLength(1)
  })

  it('correctIndex が正解の選択肢を指している', () => {
    const segments: QuizSegment[] = [{ level: 1, count: 2, ordered: true }]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS, 0)
    for (const q of result) {
      expect(q.answers[q.correctIndex]).toBe('正解')
    }
  })

  it('全選択肢がタレント名の場合 answerTalentIds が設定される', () => {
    const talentQ = makeQuestion('tq1', 1, 0)
    talentQ.answers = ['タレントA', 'タレントB', 'タレントC', 'タレントD']
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([talentQ], segments, 1, TALENTS, ANSWER_SETS, 0)
    expect(result[0].answerTalentIds).not.toBeNull()
    expect(result[0].answerTalentIds).toHaveLength(4)
  })

  it('一部がタレント名でない場合 answerTalentIds は null', () => {
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions(QUESTIONS, segments, 1, TALENTS, ANSWER_SETS, 0)
    expect(result[0].answerTalentIds).toBeNull()
  })

  it('空文字列の選択肢がタレント名で補完される', () => {
    const q = makeQuestion('eq1', 1, 0)
    q.answers = ['正解', '', '', '']
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS, 0)
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
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS, 0)
    for (const a of result[0].answers) {
      expect(a).not.toMatch(/^\[.*\]$/)
    }
  })

  it('sortAnswers=true の選択肢は数値を数値として扱う自然順に並ぶ', () => {
    const q = makeQuestion('nq1', 1, 0)
    q.answers = ['ドラクエ3', 'ドラクエ5', 'ドラクエ8', 'ドラクエ11']
    q.sortAnswers = true
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS, 0)
    expect(result[0].answers).toEqual(['ドラクエ3', 'ドラクエ5', 'ドラクエ8', 'ドラクエ11'])
    expect(result[0].answers[result[0].correctIndex]).toBe('ドラクエ3')
  })

  it('sortAnswers=true は単位付きの数値も桁数に惑わされず並ぶ', () => {
    const q = makeQuestion('nq2', 1, 0)
    q.answers = ['20個', '5個', '10個', '30個']
    q.sortAnswers = true
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS, 0)
    expect(result[0].answers).toEqual(['5個', '10個', '20個', '30個'])
  })

  it('[寮名] の選択肢が該当寮のタレントで補完される', () => {
    const q = makeQuestion('dq1', 1, 0)
    q.answers = ['正解', '[バゥ寮]', '[ミュゥ寮]', '[クゥ寮]']
    const segments: QuizSegment[] = [{ level: 1, count: 1, ordered: true }]
    const result = generateTextQuizQuestions([q], segments, 1, TALENTS, ANSWER_SETS, 0)
    // 寮名形式が残っていないこと
    for (const a of result[0].answers) {
      expect(a).not.toMatch(/^\[.*寮\]$/)
    }
  })

  describe('answerSets の選択肢スコープ', () => {
    const GEN1 = ['タレントA', 'タレントB', 'タレントE']
    const GEN2 = ['タレントC', 'タレントD', 'タレントF']

    it('スコープ1では世代混在セットから1期生のみ選出される', () => {
      // ランダム選出のため複数回試行する
      for (let i = 0; i < 20; i++) {
        const result = generateTextQuizQuestions(
          [makeSetQuestion('sc1', '混在セット')], ONE_SEGMENT, 1, TALENTS, ANSWER_SETS, 1,
        )
        expect(dummiesOf(result[0].answers).sort()).toEqual([...GEN1].sort())
      }
    })

    it('スコープ2では世代混在セットから2期生のみ選出される', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateTextQuizQuestions(
          [makeSetQuestion('sc2', '混在セット')], ONE_SEGMENT, 1, TALENTS, ANSWER_SETS, 2,
        )
        expect(dummiesOf(result[0].answers).sort()).toEqual([...GEN2].sort())
      }
    })

    it('スコープ0では世代混在セットの両世代から選出される', () => {
      // 20回分のダミーを集計し、両世代が現れることを確認する
      const seen = new Set<string>()
      for (let i = 0; i < 20; i++) {
        const result = generateTextQuizQuestions(
          [makeSetQuestion('sc0', '混在セット')], ONE_SEGMENT, 1, TALENTS, ANSWER_SETS, 0,
        )
        for (const d of dummiesOf(result[0].answers)) seen.add(d)
      }
      expect(GEN1.some((n) => seen.has(n))).toBe(true)
      expect(GEN2.some((n) => seen.has(n))).toBe(true)
    })

    it('talents.json に存在しないメンバーはスコープに関わらず選出される', () => {
      const result = generateTextQuizQuestions(
        [makeSetQuestion('sg1', '外部セット')], ONE_SEGMENT, 1, TALENTS, ANSWER_SETS, 2,
      )
      expect(dummiesOf(result[0].answers).sort()).toEqual(['ゲストX', 'ゲストY', 'ゲストZ'])
    })

    it('スコープ絞り込みで候補が0件になる場合は絞り込みなしにフォールバックする', () => {
      // 1期生のみのセットをスコープ2で引くと候補0件 → 絞り込まずに1期生が入る
      const result = generateTextQuizQuestions(
        [makeSetQuestion('fb1', '1期のみセット')], ONE_SEGMENT, 1, TALENTS, ANSWER_SETS, 2,
      )
      expect(dummiesOf(result[0].answers).sort()).toEqual([...GEN1].sort())
    })
  })
})
