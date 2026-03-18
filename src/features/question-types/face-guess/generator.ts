import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
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
): FaceGuessQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  return shuffledTargets.map((talent) => {
    // TODO: ★★☆では髪色/髪型が似たタレントを優先選出
    // TODO: ★★★ではシルエットモード + 似た髪型優先
    const others = shuffleArray(pool.filter((t) => t.id !== talent.id)).slice(0, 3)
    const allChoices = shuffleArray([talent, ...others])
    const correctIndex = allChoices.findIndex((t) => t.id === talent.id)

    return {
      typeId: 'face-guess' as const,
      difficulty,
      talentId: talent.id,
      talentName: talent.name,
      answerImages: allChoices.map((t) => getTalentImagePath(t)),
      answerNames: allChoices.map((t) => t.name),
      correctIndex,
      isSilhouette: difficulty === 3,
    }
  })
}
