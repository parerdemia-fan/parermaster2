import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import { selectSimilarDistractors } from '../../../shared/utils/similarity.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { BlurQuestion } from './types.ts'

/**
 * ぼかし問題を生成する
 * ぼかされた顔画像が徐々に鮮明になる中で4択から正しい名前を選ぶ
 */
export function generateBlurQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  _difficulty: Difficulty,
): BlurQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    // 常に激ムズ相当: 髪型類似の紛らわしい選択肢 + モノクロ→カラー変化
    const others = selectSimilarDistractors(talent, pool, 3, 'style')
    const allChoices = shuffleArray([talent, ...others])
    const correctIndex = allChoices.findIndex((t) => t.id === talent.id)

    return {
      typeId: 'blur',
      difficulty: 3,
      talentId: talent.id,
      talentName: talent.name,
      talentImagePath: getTalentImagePath(talent),
      answers: allChoices.map((t) => t.name),
      answerTalentIds: allChoices.map((t) => t.id),
      correctIndex,
      useGrayscale: true,
    }
  })
}
