/**
 * scale は画像の上端（頭の位置）を固定したまま高さを伸縮させる。
 * 上半身の位置を scale によらず不変にするため（縦方向にズレると違和感）。
 * 縮んだ分は画面下にはみ出す足下が短くなるだけ。
 *
 * 画像種別ベース:
 * - KV立ち絵（1期生 833×1500 / 2期生 1200×1586〜1963）: 150dvw。
 *   下を画面外にはみ出して上半身中心の構図
 * - live2d立ち絵（KV未提供タレントのみ。800×1143前後）: 120dvw。
 *   バストアップで顔が大きいので小さめのベース + コンテナ上端を
 *   下にずらして縦位置をKVに揃える
 */
const KV_BASE_HEIGHT_DVW = 150
const LIVE2D_BASE_HEIGHT_DVW = 120
const BASE_TOP_OFFSET_DVW = 187.5
const LIVE2D_DOWN_DVW = 15

export function getKvImageStyle(scale: number, live2d: boolean): { containerTop: string; imgHeight: string } {
  if (live2d) {
    return {
      containerTop: `max(0px, calc(100dvh - ${BASE_TOP_OFFSET_DVW - LIVE2D_DOWN_DVW}dvw))`,
      imgHeight: `${LIVE2D_BASE_HEIGHT_DVW * scale}dvw`,
    }
  }
  return {
    containerTop: `max(0px, calc(100dvh - ${BASE_TOP_OFFSET_DVW}dvw))`,
    imgHeight: `${KV_BASE_HEIGHT_DVW * scale}dvw`,
  }
}
