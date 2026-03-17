import type { Difficulty } from '../../stores/settingsStore.ts'

export interface BaseQuestion {
  /** 問題タイプID */
  typeId: string
  /** 難易度 */
  difficulty: Difficulty
}

export interface AnswerRecord {
  isCorrect: boolean
}
