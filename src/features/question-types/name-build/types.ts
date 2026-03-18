import type { BaseQuestion } from '../../quiz/types.ts'

export interface NameBuildQuestion extends BaseQuestion {
  typeId: 'name-build'
  /** 出題対象タレントID */
  talentId: string
  /** 出題タレントの顔画像パス */
  talentImagePath: string
  /** 正解の苗字 */
  correctFamilyName: string
  /** 正解の名前 */
  correctGivenName: string
  /** 選択肢テキスト（苗字3+名前3+正解苗字+正解名前 = 8個、シャッフル済み） */
  choices: string[]
}
