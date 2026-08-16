import type { StandingImageVariant } from '../../shared/utils/talent.ts'
import { IMAGE_WIDTH_PX, HEAD_UNIT_PX, getChinY } from './kvMetrics.ts'

/**
 * 立ち絵の表示サイズ・縦位置の計算（仕様は docs/room-area.md「立ち絵のサイズ・縦位置」）。
 *
 * - サイズ: 表示上の頭サイズ U を全タレント共通にする。画像の表示指定は「高さ」ではなく「幅」。
 *   2期生KVは画像高さが個体ごとに違う（見かけの身長にほぼ比例する）ため、高さ基準では
 *   背が高いキャラほど小さく描画される逆転が起きる。幅は世代内で固定なのでこれを避けられる。
 * - 縦位置: 画像上端ではなく顎の位置で合わせ、そこに身長差のオフセットを足す。
 *   頭頂は髪型・帽子で変動し、足元はポーズ（足上げ・開脚）で変動するため基準にしない。
 */

/** 基準単位 U（1期生の瞳中心→顎に相当）を実寸何cmとみなすか */
const CM_PER_FACE = 11

/** 頭サイズの基準値（dvw）。従来の 1期生 150dvw 表示と同じ顔サイズになる値 */
const BASE_FACE_DVW = 7.8

/** テーブル画像の高さ（dvw）。room_table.png は 1000×408 を width:100% で敷いている */
const TABLE_TOP_DVW = 40.8

/** 基準身長のタレントの顎が、テーブル上端から何 U 上に来るか */
const CHIN_ABOVE_TABLE_U = 4.83

/** 身長オフセットの基準（cm）。全タレントの平均身長 */
const BASE_HEIGHT_CM = 158

/** 身長差の反映率。1.0 で実寸比例（0 で全員同じ高さ） */
const HEIGHT_REFLECT = 0.6

/** 顎から頭頂までに確保する余裕（U）。狭い画面で U を縮めて頭が切れるのを防ぐ */
const HEAD_ROOM_U = 8.7

export interface StandingStyle {
  /** 立ち絵コンテナの top（表示領域の上端から） */
  containerTop: string
  /** img の width */
  imgWidth: string
}

/** チェック画面から既定値を上書きするためのパラメータ */
export interface StandingParams {
  /** 顔サイズの基準値（dvw） */
  baseFaceDvw?: number
  /** 基準身長のタレントの顎がテーブル上端から何 U 上に来るか */
  chinAboveTableU?: number
  /** 身長差の反映率 */
  heightReflect?: number
}

export const DEFAULT_STANDING_PARAMS: Required<StandingParams> = {
  baseFaceDvw: BASE_FACE_DVW,
  chinAboveTableU: CHIN_ABOVE_TABLE_U,
  heightReflect: HEIGHT_REFLECT,
}

export interface StandingStyleOptions {
  /** 立ち絵を表示する領域の高さ（CSS式）。談話室は `calc(100dvh - 75dvw)` */
  areaHeightCss: string
  /**
   * 1dvw に相当する長さ（calc 内で使える CSS 式）。既定は実画面の `1dvw`。
   * チェック画面は横長のPCでも談話室の比率を再現したいので、仮想ビューポート幅から算出した式を渡す。
   */
  vwCss?: string
  /** 個別の頭サイズ補正倍率（既定 1.0）。kvScaleMap.ts の HEAD_SCALE_MAP 由来 */
  headScale?: number
  /** 既定パラメータの上書き（チェック画面用） */
  params?: StandingParams
}

export function getStandingStyle(
  talentId: string,
  variant: StandingImageVariant,
  heightCm: number,
  opts: StandingStyleOptions,
): StandingStyle {
  const { areaHeightCss, vwCss = '1dvw', headScale = 1, params = {} } = opts
  const { baseFaceDvw, chinAboveTableU, heightReflect } = { ...DEFAULT_STANDING_PARAMS, ...params }
  const headUnitPx = HEAD_UNIT_PX[variant]
  const widthU = IMAGE_WIDTH_PX[variant] / headUnitPx
  const chinU = getChinY(talentId, variant) / headUnitPx
  const heightOffsetU = ((heightCm - BASE_HEIGHT_CM) / CM_PER_FACE) * heightReflect

  const tableTop = `${TABLE_TOP_DVW} * ${vwCss}`
  // U = 頭サイズの基準。領域が縦に狭いときだけ全員一律に縮小する（3体の相対関係は保たれる）
  const unit = `min(calc(${baseFaceDvw.toFixed(3)} * ${vwCss}), calc((${areaHeightCss} - (${tableTop})) / ${HEAD_ROOM_U}))`
  // headScale は画像の拡縮にだけ効かせる。顎の目標高さ（テーブル上端からの距離）には掛けないので、
  // 倍率をいじっても身長の見え方は変わらない。画像内の顎位置 chinU は画像と一緒に伸縮する
  const chinOffsetU = chinAboveTableU + heightOffsetU + chinU * headScale

  return {
    containerTop: `calc(${areaHeightCss} - (${tableTop}) - ${unit} * ${chinOffsetU.toFixed(3)})`,
    imgWidth: `calc(${unit} * ${(widthU * headScale).toFixed(3)})`,
  }
}

/** 談話室エリアの高さ（4:3ゲームエリアの下） */
export const ROOM_AREA_HEIGHT_CSS = 'calc(100dvh - 75dvw)'

/** テーブル画像の高さ（dvw）。チェック画面の基準線描画で使う */
export const TABLE_TOP_DVW_VALUE = TABLE_TOP_DVW
