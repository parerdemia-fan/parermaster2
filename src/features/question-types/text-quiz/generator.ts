import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { QuestionData } from '../../../shared/types/question.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import type { TextQuizQuestion } from './types.ts'

/**
 * 問題構成の1セグメント
 * @param level questions.json の difficulty 値（1〜7）
 * @param count 出題数
 * @param ordered true なら順番通り、false ならランダム
 */
export interface QuizSegment {
  level: number
  count: number
  ordered: boolean
}

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
 * @param pool 出題候補の問題データ（世代フィルタ済み）
 * @param segments 問題構成定義（レベル・問題数・順序の配列）
 * @param difficulty 設定難易度（UIの難易度表示用）
 */
export function generateTextQuizQuestions(
  pool: QuestionData[],
  segments: QuizSegment[],
  difficulty: Difficulty,
  talents: Talent[],
  answerSets: Record<string, string[]>,
): TextQuizQuestion[] {
  // 難易度ごとにグループ分け
  const byLevel = new Map<number, QuestionData[]>()
  for (const q of pool) {
    const group = byLevel.get(q.difficulty) ?? []
    group.push(q)
    byLevel.set(q.difficulty, group)
  }

  // セグメント定義に従って問題を選出
  const selected: QuestionData[] = []
  for (const seg of segments) {
    const group = byLevel.get(seg.level) ?? []
    if (seg.ordered) {
      // 順番通り（IDやデータ順）
      selected.push(...group.slice(0, seg.count))
    } else {
      // ランダム
      selected.push(...shuffleArray(group).slice(0, seg.count))
    }
  }

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
