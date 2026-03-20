import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import { selectSimilarDistractors } from '../../../shared/utils/similarity.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { NameGuessQuestion } from './types.ts'

/**
 * 名前当て問題を生成する
 * 顔画像を見て4択から正しい名前を選ぶ
 */
export function generateNameGuessQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  difficulty: Difficulty,
): NameGuessQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    const others =
      difficulty >= 2
        ? selectSimilarDistractors(talent, pool, 3)
        : shuffleArray(pool.filter((t) => t.id !== talent.id)).slice(0, 3)
    // TODO: ★★★では出題画像がシルエット + 似た髪型優先
    const allChoices = shuffleArray([talent, ...others])
    const correctIndex = allChoices.findIndex((t) => t.id === talent.id)

    return {
      typeId: 'name-guess',
      difficulty,
      talentId: talent.id,
      talentName: talent.name,
      talentImagePath: getTalentImagePath(talent),
      answers: allChoices.map((t) => t.name),
      correctIndex,
      isSilhouette: difficulty === 3,
    }
  })
}
