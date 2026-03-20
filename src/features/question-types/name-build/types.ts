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
  /** 選択肢（★☆☆: 苗字・名前の文字列8個 / ★★☆: 1文字ずつ15個 / ★★★: 同音異字含む35個、シャッフル済み） */
  choices: string[]
}
