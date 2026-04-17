/**
 * scale は画像の上端（頭の位置）を固定したまま高さを伸縮させる。
 * 上半身の位置を scale によらず不変にするため（縦方向にズレると違和感）。
 * 縮んだ分は画面下にはみ出す足下が短くなるだけ。
 */
export function getKvImageStyle(scale: number): { containerTop: string; imgHeight: string } {
  return {
    containerTop: 'max(0px, calc(100dvh - 187.5dvw))',
    imgHeight: `${150 * scale}dvw`,
  }
}
