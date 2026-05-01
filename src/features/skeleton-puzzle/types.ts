/** パズルの種類 */
export type PuzzleVariant = 'gen1' | 'gen2' | 'all'

/** セルの内容: null=黒マス、string=ひらがな1文字 */
export type CellContent = string | null

/** ワード（タレント1名分 or 特殊ワード） */
export interface PuzzleWord {
  /** ワードID（0始まり連番） */
  wordId: number
  /** 対応タレントID（null = タレントに紐付かない特殊ワード。拡張用） */
  talentId: string | null
  /** ひらがな名（点なし） */
  hiragana: string
  /** グリッド上の開始行 */
  startRow: number
  /** グリッド上の開始列 */
  startCol: number
  /** 方向 */
  direction: 'across' | 'down'
  /** 文字数 */
  length: number
}

/** 隠しメッセージ用の番号付きセル */
export interface NumberedCell {
  /** メッセージ中の順番（1始まり） */
  order: number
  row: number
  col: number
}

/** パズルデータ（JSONとして配布） */
export interface PuzzleData {
  variant: PuzzleVariant
  /** グリッド行数 */
  rows: number
  /** グリッド列数 */
  cols: number
  /** 正解グリッド（null=黒マス、string=ひらがな1文字） */
  grid: CellContent[][]
  /** 全ワード定義 */
  words: PuzzleWord[]
  /** 番号付きセル（隠しメッセージ用） */
  numberedCells: NumberedCell[]
  /** 隠しメッセージの正解テキスト */
  hiddenMessage: string
  /** 初期開示ワードのwordId配列 */
  initialRevealedWordIds: number[]
}

/** プレイヤーの配置（wordId → talentId or 特殊ワード識別子） */
export type Placements = Record<number, string>

/** プレイヤーの進捗データ（localStorage保存用） */
export interface SkeletonProgress {
  /** 配置済みワード: wordId → talentId */
  placements: Placements
  /** 隠しメッセージが完成したか */
  messageCompleted: boolean
  /** 全マス完成したか */
  puzzleCompleted: boolean
}

/** グリッド上のセル座標 */
export interface CellPosition {
  row: number
  col: number
}

/** 選択中のワードスロット情報 */
export interface SelectedSlot {
  word: PuzzleWord
}
