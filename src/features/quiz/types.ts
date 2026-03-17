export interface ProcessedQuestion {
  /** 問題タイプID */
  typeId: string
  /** 出題対象タレントID */
  talentId: string
  /** 出題対象タレント名 */
  talentName: string
  /** 出題タレントの顔画像パス */
  talentImagePath: string
  /** 選択肢テキスト */
  answers: string[]
  /** 正解のインデックス */
  correctIndex: number
}

export interface AnswerRecord {
  selectedAnswer: number
  isCorrect: boolean
}
