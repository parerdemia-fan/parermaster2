import type { BaseQuestion } from '../../quiz/types.ts'

export interface NameGuessQuestion extends BaseQuestion {
  typeId: 'name-guess'
  /** 出題対象タレントID */
  talentId: string
  /** 出題対象タレント名 */
  talentName: string
  /** 出題タレントの顔画像パス */
  talentImagePath: string
  /** 選択肢テキスト */
  answers: string[]
  /** 選択肢の読み仮名（カタカナ） */
  answerKanas: string[]
  /** 選択肢タレントID（顔画像表示用） */
  answerTalentIds: string[]
  /** 正解のインデックス */
  correctIndex: number
  /** シルエットモード（★★★用） */
  isSilhouette: boolean
}
