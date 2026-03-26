import type { BaseQuestion } from '../../quiz/types.ts'

export interface FaceGuessQuestion extends BaseQuestion {
  typeId: 'face-guess'
  /** 出題対象タレントID */
  talentId: string
  /** 出題対象タレント名（問題文として表示） */
  talentName: string
  /** 選択肢の顔画像パス */
  answerImages: string[]
  /** 選択肢のタレントID */
  answerTalentIds: string[]
  /** 選択肢のタレント名（回答後に表示） */
  answerNames: string[]
  /** 正解のインデックス */
  correctIndex: number
  /** シルエットモード（★★★用） */
  isSilhouette: boolean
}
