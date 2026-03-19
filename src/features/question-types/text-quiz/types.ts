import type { BaseQuestion } from '../../quiz/types.ts'

export interface TextQuizQuestion extends BaseQuestion {
  typeId: 'text-quiz'
  questionId: string
  question: string
  /** シャッフル済み選択肢 */
  answers: string[]
  /** シャッフル後の正解インデックス */
  correctIndex: number
  genre: string
  comment: string
  sourceUrl: string
  questionImage: string | null
  commentImage: string | null
  /** 回答前にタレントアイコンを隠すかどうか */
  hideIcon: boolean
  /** 全選択肢がタレント名の場合、シャッフル済み選択肢順のタレントID配列。一部でも非タレント名なら null */
  answerTalentIds: string[] | null
}
