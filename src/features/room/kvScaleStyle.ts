/**
 * scale は画像の上端（頭の位置）を固定したまま高さを伸縮させる。
 * 上半身の位置を scale によらず不変にするため（縦方向にズレると違和感）。
 * 縮んだ分は画面下にはみ出す足下が短くなるだけ。
 *
 * 世代別ベース:
 * - 1期生（kv/orig 833×1500）: 150dvw。下を画面外にはみ出して上半身中心の構図
 * - 2期生（live2d/orig 800×1143前後）: 120dvw。バストアップで顔が大きいので
 *   小さめのベース + コンテナ上端を下にずらして縦位置を1期生に揃える
 */
const GEN1_BASE_HEIGHT_DVW = 150
const GEN2_BASE_HEIGHT_DVW = 120
const BASE_TOP_OFFSET_DVW = 187.5
const GEN2_DOWN_DVW = 15

export function getKvImageStyle(scale: number, generation: 1 | 2 = 1): { containerTop: string; imgHeight: string } {
  if (generation === 2) {
    return {
      containerTop: `max(0px, calc(100dvh - ${BASE_TOP_OFFSET_DVW - GEN2_DOWN_DVW}dvw))`,
      imgHeight: `${GEN2_BASE_HEIGHT_DVW * scale}dvw`,
    }
  }
  return {
    containerTop: `max(0px, calc(100dvh - ${BASE_TOP_OFFSET_DVW}dvw))`,
    imgHeight: `${GEN1_BASE_HEIGHT_DVW * scale}dvw`,
  }
}
