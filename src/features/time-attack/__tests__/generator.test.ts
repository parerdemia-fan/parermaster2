import { describe, it, expect } from 'vitest'
import { generateTimeAttackQuestions } from '../generator.ts'
import { TIME_ATTACK_SECTIONS } from '../constants.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import type { QuestionData } from '../../../shared/types/question.ts'

function makeTalent(id: string, name: string, gen: number, dorm: string): Talent {
  return {
    id, generation: gen, dormitory: dorm, name, kana: '', familyName: name.slice(0, 2), givenName: name.slice(2),
    familyKana: '', givenKana: '', nicknames: [], firstPerson: '', intro: '', dream: '',
    birthday: '', height: 160, bloodType: '', hairColor: 'black', hairStyle: 'ロング',
    eyeColorLeft: '', eyeColorRight: '', mbti: '', fanName: '', fanMark: '',
    hashtags: [], hobbies: [], skills: [], favorites: [], links: [], tone: '',
  }
}

function makeQuestion(id: string, difficulty: number): QuestionData {
  return {
    id, generation: 0, question: `問題${id}`, answers: ['正解', 'A', 'B', 'C'],
    difficulty, genre: '', sortAnswers: false, hideIcon: false,
    questionImage: null, commentImage: null, answerPool: '', comment: '', sourceUrl: '',
  }
}

// 70名のタレントを生成（1期生46名 + 2期生24名）
function createTalentPool(): Talent[] {
  const talents: Talent[] = []
  const dorms = ['wa', 'me', 'co', 'wh']
  // 1期生46名
  for (let i = 0; i < 46; i++) {
    talents.push(makeTalent(`g1_${i}`, `一期生${String(i).padStart(2, '0')}太郎`, 1, dorms[i % 4]))
  }
  // 2期生24名
  for (let i = 0; i < 24; i++) {
    talents.push(makeTalent(`g2_${i}`, `二期生${String(i).padStart(2, '0')}花子`, 2, dorms[i % 4]))
  }
  return talents
}

// difficulty 1〜7 の問題を各10問生成
function createQuestionPool(): QuestionData[] {
  const questions: QuestionData[] = []
  for (let d = 1; d <= 7; d++) {
    for (let i = 0; i < 10; i++) {
      questions.push(makeQuestion(`q_d${d}_${i}`, d))
    }
  }
  return questions
}

const TALENTS = createTalentPool()
const QUESTIONS = createQuestionPool()
const ANSWER_SETS: Record<string, string[]> = {}

describe('generateTimeAttackQuestions', () => {
  const result = generateTimeAttackQuestions(TALENTS, QUESTIONS, ANSWER_SETS)

  it('全100問を生成する', () => {
    expect(result).toHaveLength(100)
  })

  it('出題構成が定義通りのセクション順になっている', () => {
    let offset = 0
    for (const section of TIME_ATTACK_SECTIONS) {
      for (let i = 0; i < section.count; i++) {
        const q = result[offset + i]
        expect(q.typeId).toBe(section.typeId)
      }
      offset += section.count
    }
  })

  it('全問題に displayStars が設定されている', () => {
    let offset = 0
    for (const section of TIME_ATTACK_SECTIONS) {
      for (let i = 0; i < section.count; i++) {
        expect(result[offset + i].displayStars).toBe(section.displayStars)
      }
      offset += section.count
    }
  })

  it('顔名前系で各タレントが1回だけ出題される（重複なし）', () => {
    const faceNameTypes = new Set(['face-guess', 'name-guess', 'name-build', 'blur', 'spotlight', 'word-search'])
    const talentIds = result
      .filter((q) => faceNameTypes.has(q.typeId))
      .map((q) => (q as unknown as { talentId: string }).talentId)

    // 70問（全タレント数）
    expect(talentIds).toHaveLength(70)
    // 重複なし
    expect(new Set(talentIds).size).toBe(70)
  })

  it('顔名前系の問題数が全タレント数(70)と一致する', () => {
    const faceNameTypes = new Set(['face-guess', 'name-guess', 'name-build', 'blur', 'spotlight', 'word-search'])
    const totalFaceName = TIME_ATTACK_SECTIONS
      .filter((s) => faceNameTypes.has(s.typeId))
      .reduce((sum, s) => sum + s.count, 0)
    expect(totalFaceName).toBe(70)
    expect(totalFaceName).toBe(TALENTS.length)
  })

  it('テキストクイズの問題数が30問', () => {
    const textQuizCount = result.filter((q) => q.typeId === 'text-quiz').length
    expect(textQuizCount).toBe(30)
  })
})
