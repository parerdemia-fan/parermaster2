import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import { selectSimilarDistractors } from '../../../shared/utils/similarity.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { SpotlightQuestion } from './types.ts'

/**
 * スポットライト問題を生成する
 * スポットライトで部分的に見えるタレント画像から名前4択に回答
 */
export function generateSpotlightQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  _difficulty: Difficulty,
): SpotlightQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    // 常に激ムズ相当: 髪型類似の紛らわしい選択肢
    const others = selectSimilarDistractors(talent, pool, 3, 'style')
    const allChoices = shuffleArray([talent, ...others])
    const correctIndex = allChoices.findIndex((t) => t.id === talent.id)

    return {
      typeId: 'spotlight',
      difficulty: 3,
      talentId: talent.id,
      talentName: talent.name,
      talentImagePath: getTalentImagePath(talent),
      answers: allChoices.map((t) => t.name),
      answerTalentIds: allChoices.map((t) => t.id),
      correctIndex,
    }
  })
}
