import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import { selectSimilarDistractors } from '../../../shared/utils/similarity.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { FaceGuessQuestion } from './types.ts'

/**
 * 顔当て問題を生成する
 * タレント名を見て4択の顔画像から正しい顔を選ぶ
 */
export function generateFaceGuessQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  difficulty: Difficulty,
  generationPool?: Talent[],
): FaceGuessQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    const others =
      difficulty === 3 && generationPool
        ? selectSimilarDistractors(talent, generationPool, 3, 'style')
        : difficulty >= 2
          ? selectSimilarDistractors(talent, pool, 3)
          : shuffleArray(pool.filter((t) => t.id !== talent.id)).slice(0, 3)
    const allChoices = shuffleArray([talent, ...others])
    const correctIndex = allChoices.findIndex((t) => t.id === talent.id)

    return {
      typeId: 'face-guess' as const,
      difficulty,
      talentId: talent.id,
      talentName: talent.name,
      answerImages: allChoices.map((t) => getTalentImagePath(t)),
      answerTalentIds: allChoices.map((t) => t.id),
      answerNames: allChoices.map((t) => t.name),
      correctIndex,
      isSilhouette: difficulty === 3,
    }
  })
}
