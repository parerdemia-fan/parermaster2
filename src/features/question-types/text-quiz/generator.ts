import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { QuestionData } from '../../../shared/types/question.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import type { TextQuizQuestion } from './types.ts'

/**
 * [セット名] 形式かどうか判定し、セット名を返す
 */
function extractSetName(answer: string): string | null {
  const match = answer.match(/^\[(.+)\]$/)
  return match ? match[1] : null
}

/**
 * 空の選択肢と [セット名] 形式の選択肢を補完する
 * @param generation 問題の世代（0=全員、1=1期生、2=2期生）
 */
function fillAnswers(
  answers: string[],
  talents: Talent[],
  answerSets: Record<string, string[]>,
  generation: number,
): string[] {
  const result = [...answers]
  const used = new Set(result.filter((a) => a !== '' && !extractSetName(a)))

  // 空文字列補完用のタレントプール（世代でフィルタリング）
  const talentPool = generation === 0
    ? talents
    : talents.filter((t) => t.generation === generation)

  for (let i = 0; i < result.length; i++) {
    // [セット名] 形式
    const setName = extractSetName(result[i])
    if (setName) {
      const members = answerSets[setName]
      if (members) {
        const candidates = members.filter((m) => !used.has(m))
        if (candidates.length > 0) {
          result[i] = candidates[Math.floor(Math.random() * candidates.length)]
          used.add(result[i])
          continue
        }
      }
      result[i] = ''
    }

    // 空文字列 → タレント名からランダムに補完
    if (result[i] === '') {
      const shuffled = shuffleArray(talentPool)
      const talent = shuffled.find((t) => !used.has(t.name))
      if (talent) {
        result[i] = talent.name
        used.add(result[i])
      }
    }
  }

  return result
}

/**
 * 全選択肢がタレント名ならタレントID配列を返す。1つでも非タレント名なら null
 */
function resolveAnswerTalentIds(
  answers: string[],
  talentNameToId: Map<string, string>,
): string[] | null {
  const ids: string[] = []
  for (const answer of answers) {
    const id = talentNameToId.get(answer) ?? talentNameToId.get(answer.replace(/\s/g, ''))
    if (!id) return null
    ids.push(id)
  }
  return ids
}

/**
 * テキストクイズ問題を生成する
 */
export function generateTextQuizQuestions(
  pool: QuestionData[],
  maxCount: number,
  difficulty: Difficulty,
  talents: Talent[],
  answerSets: Record<string, string[]>,
): TextQuizQuestion[] {
  // 難易度ごとにグループ分け
  const byDifficulty = new Map<number, QuestionData[]>()
  for (const q of pool) {
    const group = byDifficulty.get(q.difficulty) ?? []
    group.push(q)
    byDifficulty.set(q.difficulty, group)
  }

  // 各難易度を均等に選出
  const diffLevels = [...byDifficulty.keys()].sort((a, b) => a - b)
  const perLevel = Math.floor(maxCount / diffLevels.length)
  const remainder = maxCount % diffLevels.length

  const selected: QuestionData[] = []
  for (let i = 0; i < diffLevels.length; i++) {
    const group = byDifficulty.get(diffLevels[i])!
    const count = Math.min(perLevel + (i < remainder ? 1 : 0), group.length)
    selected.push(...shuffleArray(group).slice(0, count))
  }

  // 難易度順にソート
  selected.sort((a, b) => a.difficulty - b.difficulty)

  // タレント名→IDのルックアップマップ
  const talentNameToId = new Map<string, string>()
  for (const t of talents) {
    talentNameToId.set(t.name, t.id)
    talentNameToId.set(t.name.replace(/\s/g, ''), t.id)
  }

  return selected.map((q) => {
    // 選択肢を補完
    const filled = fillAnswers(q.answers, talents, answerSets, q.generation)
    const correctAnswer = filled[0]

    const shuffled = q.sortAnswers ? [...filled].sort() : shuffleArray(filled)
    const correctIndex = shuffled.indexOf(correctAnswer)

    // 全選択肢がタレント名か判定
    const answerTalentIds = resolveAnswerTalentIds(shuffled, talentNameToId)

    return {
      typeId: 'text-quiz' as const,
      difficulty,
      questionId: q.id,
      question: q.question,
      answers: shuffled,
      correctIndex,
      genre: q.genre,
      comment: q.comment,
      sourceUrl: q.sourceUrl,
      questionImage: q.questionImage,
      commentImage: q.commentImage,
      hideIcon: q.hideIcon,
      answerTalentIds,
    }
  })
}
