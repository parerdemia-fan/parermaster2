const LEAF_PATH = 'M0,0 Q-7,-2 -6,-8 Q-6,-13 0,-10 Q6,-13 6,-8 Q7,-2 0,0Z'

export type MotifType = 'drop' | 'sakura' | 'clover' | 'sparkle'

/** シード付き簡易乱数（同じシードなら同じ値列） */
function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
}

/** モチーフSVG要素を生成 */
function motifSvg(type: MotifType, scale: number, rot: number) {
  const s = scale
  switch (type) {
    case 'drop':
      return `<path d='M0,${-17*s} Q${5*s},${-7*s} ${7*s},0 A${7*s},${7*s} 0 1,1 ${-7*s},0 Q${-5*s},${-7*s} 0,${-17*s}Z' transform='rotate(${rot})'/>`
    case 'sakura':
      return [0,72,144,216,288].map(a => `<ellipse cx='0' cy='${-7*s}' rx='${4.5*s}' ry='${7*s}' transform='rotate(${a + rot})'/>`).join('')
    case 'clover':
      return [0,90,180,270].map(a => `<path d='${LEAF_PATH}' transform='rotate(${a + rot}) scale(${s})'/>`).join('')
    case 'sparkle': {
      const r = 9 * s, ri = 3 * s
      return `<path d='M0,${-r} L${ri*0.38},${-ri*0.38} L${r},0 L${ri*0.38},${ri*0.38} L0,${r} L${-ri*0.38},${ri*0.38} L${-r},0 L${-ri*0.38},${-ri*0.38}Z' transform='rotate(${rot})'/>`
    }
  }
}

export interface MotifZone {
  x: number; y: number; w: number; h: number
}

/** 名前当て用のデフォルトゾーン（横長ボタン、右半分に配置） */
export const NAME_GUESS_ZONES: MotifZone[] = [
  { x: 220, y: 20, w: 60, h: 50 },
  { x: 320, y: 15, w: 60, h: 50 },
  { x: 420, y: 20, w: 50, h: 50 },
]

/** 顔当て用のゾーン（正方形カード、四隅付近に配置） */
export const FACE_GUESS_ZONES: MotifZone[] = [
  { x: 10, y: 10, w: 20, h: 20 },
  { x: 70, y: 10, w: 20, h: 20 },
  { x: 40, y: 70, w: 20, h: 20 },
]

/** ランダム配置の装飾SVGパターンを生成 */
export function generatePattern(
  type: MotifType,
  fill: string,
  seed: number,
  zones: MotifZone[],
  svgSize: { w: number; h: number } = { w: 500, h: 100 },
) {
  const rand = seededRandom(seed)
  const items: string[] = []
  const noRotate = type === 'drop' || type === 'sparkle'
  for (const zone of zones) {
    const x = zone.x + rand() * zone.w
    const y = zone.y + rand() * zone.h
    const baseScale = type === 'sparkle' ? 2.2 : 1.7
    const scale = baseScale + rand() * 1.0
    const rot = noRotate ? 0 : rand() * 40 - 20
    items.push(`<g transform='translate(${x.toFixed(1)},${y.toFixed(1)})'>${motifSvg(type, scale, rot)}</g>`)
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${svgSize.w}' height='${svgSize.h}'><g fill='${fill}'>${items.join('')}</g></svg>`
  return encodeURIComponent(svg)
}

/** 選択肢ボタンのパステルカラーパレット（暖色寒色交互: 水色→薄ピンク→ミントグリーン→薄紫） */
export const CHOICE_PALETTES = [
  { // 水色
    gradient: 'linear-gradient(160deg, rgba(215,238,252,0.95) 0%, rgba(170,215,242,0.95) 100%)',
    outerShadow: 'rgba(60,120,170,0.5)',
    insetShadow: 'rgba(50,100,160,0.3)',
    motif: 'drop' as MotifType,
    motifFill: 'rgba(80,150,210,0.18)',
  },
  { // 薄ピンク（サクラ）
    gradient: 'linear-gradient(160deg, rgba(252,218,228,0.95) 0%, rgba(242,180,200,0.95) 100%)',
    outerShadow: 'rgba(170,80,110,0.5)',
    insetShadow: 'rgba(160,70,100,0.3)',
    motif: 'sakura' as MotifType,
    motifFill: 'rgba(200,80,120,0.16)',
  },
  { // ミントグリーン
    gradient: 'linear-gradient(160deg, rgba(210,242,220,0.95) 0%, rgba(170,228,190,0.95) 100%)',
    outerShadow: 'rgba(60,150,90,0.5)',
    insetShadow: 'rgba(50,140,80,0.3)',
    motif: 'clover' as MotifType,
    motifFill: 'rgba(40,150,80,0.16)',
  },
  { // 薄紫（ラベンダー）
    gradient: 'linear-gradient(160deg, rgba(228,215,248,0.95) 0%, rgba(195,175,235,0.95) 100%)',
    outerShadow: 'rgba(100,70,160,0.5)',
    insetShadow: 'rgba(90,60,150,0.3)',
    motif: 'sparkle' as MotifType,
    motifFill: 'rgba(120,80,190,0.18)',
  },
]
