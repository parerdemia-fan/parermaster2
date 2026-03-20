import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { NameBuildQuestion } from './types.ts'
import confusablesMap from './confusables.json'

/** ★★☆の選択肢文字数 */
const CHAR_PICK_TOTAL_MEDIUM = 15
/** ★★★の選択肢文字数 */
const CHAR_PICK_TOTAL_HARD = 35

/**
 * 名前を作ろう問題を生成する
 * ★☆☆: 苗字・名前の組み合わせ選択（8個）
 * ★★☆: 1文字ずつ選択（合計15文字）
 * ★★★: 1文字ずつ選択＋同音異字（合計35文字）
 */
export function generateNameBuildQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  difficulty: Difficulty,
): NameBuildQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    const choices =
      difficulty === 1
        ? generatePairChoices(talent, pool)
        : generateCharChoices(talent, pool, difficulty)

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

/** ★★☆/★★★: 1文字ずつの選択肢 */
function generateCharChoices(
  talent: Talent,
  pool: Talent[],
  difficulty: Difficulty,
): string[] {
  const correctChars = [...talent.familyName, ...talent.givenName]
  const total =
    difficulty === 3 ? CHAR_PICK_TOTAL_HARD : CHAR_PICK_TOTAL_MEDIUM
  const correctCharSet = new Set(correctChars)

  // ★★★: 同音異字を優先的にダミーに追加
  const confusableSet = new Set<string>()
  if (difficulty === 3) {
    const map: Record<string, string[]> = confusablesMap
    for (const char of correctChars) {
      const candidates = map[char]
      if (candidates) {
        for (const c of shuffleArray(candidates)) {
          if (!correctCharSet.has(c)) {
            confusableSet.add(c)
          }
        }
      }
    }
  }
  const confusableChars = [...confusableSet]

  // 他タレントの文字を収集（正解・同音異字と重複しないもの）
  const usedChars = new Set([...correctChars, ...confusableChars])
  const otherChars = pool
    .filter((t) => t.id !== talent.id)
    .flatMap((t) => [...t.familyName, ...t.givenName])
    .filter((c) => !usedChars.has(c))
  const uniqueOtherChars = shuffleArray([...new Set(otherChars)])

  // ダミー文字を組み立て: 同音異字 → 他タレント文字 の優先順
  const distractorCount = total - correctChars.length
  const distractors = [
    ...confusableChars.slice(0, distractorCount),
    ...uniqueOtherChars,
  ].slice(0, distractorCount)

  return shuffleArray([...correctChars, ...distractors])
}
