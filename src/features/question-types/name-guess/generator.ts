import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import type { NameGuessQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getTalentImagePath(talent: Talent): string {
  // 2期生: face/, 1期生: kv/sq/
  if (talent.generation === 2) {
    return `${BASE}data/images/face/${talent.id}.png`
  }
  return `${BASE}data/images/kv/sq/${talent.id}.png`
}

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
    // TODO: ★★☆では髪色/髪型が似たタレントを優先選出
    // TODO: ★★★ではシルエットモード + 似た髪型優先
    const others = shuffleArray(pool.filter((t) => t.id !== talent.id)).slice(0, 3)
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
