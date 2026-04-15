import type { Difficulty } from '../../stores/settingsStore.ts'

export interface BaseQuestion {
  /** 問題タイプID */
  typeId: string
  /** 難易度 */
  difficulty: Difficulty
  /** タイムアタック用: 表示用★数（設定されていれば getDisplayDifficulty を上書き） */
  displayStars?: number
}

export interface AnswerRecord {
  isCorrect: boolean
  /** 選択した選択肢のインデックス（戻って閲覧する際に使用） */
  selectedIndex?: number
}
