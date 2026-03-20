import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { NameBuildQuestion } from './types.ts'

/** ★★☆の選択肢文字数 */
const CHAR_PICK_TOTAL = 15

/**
 * 名前を作ろう問題を生成する
 * ★☆☆: 苗字・名前の組み合わせ選択（8個）
 * ★★☆: 1文字ずつ選択（合計15文字）
 */
export function generateNameBuildQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  difficulty: Difficulty,
): NameBuildQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    const choices =
      difficulty >= 2
        ? generateCharChoices(talent, pool)
        : generatePairChoices(talent, pool)

    return {
      typeId: 'name-build' as const,
      difficulty,
      talentId: talent.id,
      talentImagePath: getTalentImagePath(talent),
      correctFamilyName: talent.familyName,
      correctGivenName: talent.givenName,
      choices,
    }
  })
}

/** ★☆☆: 苗字・名前ペアの選択肢（8個） */
function generatePairChoices(talent: Talent, pool: Talent[]): string[] {
  const others = shuffleArray(pool.filter((t) => t.id !== talent.id)).slice(0, 3)
  return shuffleArray([
    talent.familyName,
    talent.givenName,
    ...others.map((t) => t.familyName),
    ...others.map((t) => t.givenName),
  ])
}

/** ★★☆: 1文字ずつの選択肢（合計15文字） */
function generateCharChoices(talent: Talent, pool: Talent[]): string[] {
  const correctChars = [...talent.familyName, ...talent.givenName]
  const distractorCount = CHAR_PICK_TOTAL - correctChars.length

  // 正解文字に含まれない文字を他タレントから収集
  const correctCharSet = new Set(correctChars)
  const otherChars = pool
    .filter((t) => t.id !== talent.id)
    .flatMap((t) => [...t.familyName, ...t.givenName])
    .filter((c) => !correctCharSet.has(c))

  // 重複を除去してシャッフルし、必要数を取得
  const uniqueOtherChars = shuffleArray([...new Set(otherChars)])
  const distractors = uniqueOtherChars.slice(0, distractorCount)

  return shuffleArray([...correctChars, ...distractors])
}
