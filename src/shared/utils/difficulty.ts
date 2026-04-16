import type { Difficulty } from '../../stores/settingsStore.ts'

/** 設定難易度 × 問題タイプ → 表示用★数（0.5刻み、最大5） */
const DIFFICULTY_MATRIX: Record<string, Record<Difficulty, number>> = {
  'face-guess': { 1: 1, 2: 2.5, 3: 4 },
  'name-guess': { 1: 1.5, 2: 3, 3: 4.5 },
  'name-build': { 1: 2, 2: 3.5, 3: 5 },
  'text-quiz':  { 1: 1.5, 2: 3, 3: 4.5 },
}

/** text-quiz の difficulty 値 → 表示用★数（d0は★1として表示） */
function textQuizStars(d: number): number {
  return d === 0 ? 1 : d
}

/**
 * 問題の表示用難易度（★数）を返す
 * @param typeId 問題タイプID
 * @param settingDifficulty 設定難易度 (1/2/3)
 * @param questionDifficulty text-quiz用: 問題データのdifficulty値 (0-8)
 */
export function getDisplayDifficulty(
  typeId: string,
  settingDifficulty: Difficulty,
  questionDifficulty?: number,
): number {
  if (typeId === 'text-quiz' && questionDifficulty !== undefined) {
    return textQuizStars(questionDifficulty)
  }
  return DIFFICULTY_MATRIX[typeId]?.[settingDifficulty] ?? 1
}
