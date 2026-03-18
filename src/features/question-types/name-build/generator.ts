import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { NameBuildQuestion } from './types.ts'

/**
 * 名前を作ろう問題を生成する
 * 顔画像を見て、選択肢から苗字と名前を選んで完成させる
 */
export function generateNameBuildQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  difficulty: Difficulty,
): NameBuildQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    const others = shuffleArray(pool.filter((t) => t.id !== talent.id)).slice(0, 3)
    const choices = shuffleArray([
      talent.familyName,
      talent.givenName,
      ...others.map((t) => t.familyName),
      ...others.map((t) => t.givenName),
    ])

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
