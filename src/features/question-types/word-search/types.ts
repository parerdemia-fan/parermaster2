import type { BaseQuestion } from '../../quiz/types.ts'

export interface WordSearchQuestion extends BaseQuestion {
  typeId: 'word-search'
  /** 出題対象タレントID */
  talentId: string
  /** 出題対象タレント名 */
  talentName: string
  /** 文字グリッド（rows × cols） */
  grid: string[][]
  /** 正解セルの座標 [{row, col}, ...] */
  answerCells: { row: number; col: number }[]
}
