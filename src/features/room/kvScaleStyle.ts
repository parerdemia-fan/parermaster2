import type { StandingImageVariant } from '../../shared/utils/talent.ts'

/**
 * scale は画像の上端（頭の位置）を固定したまま高さを伸縮させる。
 * 上半身の位置を scale によらず不変にするため（縦方向にズレると違和感）。
 * 縮んだ分は画面下にはみ出す足下が短くなるだけ。
 *
 * バリアント別ベース（バリアント定義は shared/utils/talent.ts）:
 * - kv1: 150dvw。下を画面外にはみ出して上半身中心の構図
 * - kv2: 120dvw（kv1 の0.8倍）。1期生より横長のため等高だとキャラが大きく
 *   描画される分を縮小。画像内上余白が約1%しかないので（kv1 は約10%）、
 *   コンテナを 14dvw 下げて頭の位置を kv1 に揃える
 * - live2d: 120dvw。バストアップで顔が大きいので小さめのベース +
 *   コンテナを 15dvw 下げて縦位置をKVに揃える
 */
const BASE_HEIGHT_DVW: Record<StandingImageVariant, number> = {
  kv1: 150,
  kv2: 120,
  live2d: 120,
}
const DOWN_DVW: Record<StandingImageVariant, number> = {
  kv1: 0,
  kv2: 14,
  live2d: 15,
}
const BASE_TOP_OFFSET_DVW = 187.5

export function getKvImageStyle(scale: number, variant: StandingImageVariant): { containerTop: string; imgHeight: string } {
  return {
    containerTop: `max(0px, calc(100dvh - ${BASE_TOP_OFFSET_DVW - DOWN_DVW[variant]}dvw))`,
    imgHeight: `${BASE_HEIGHT_DVW[variant] * scale}dvw`,
  }
}
