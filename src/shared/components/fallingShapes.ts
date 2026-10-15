/**
 * 舞い落ちる演出（FallingPieces / ClickFallingEffect）の形・色の定義と描画。
 * 季節テーマ（constants/season.ts）が種類（FallingKind）を選ぶ。
 */

/** 舞い落ちるものの種類 */
export type FallingKind = 'sakura' | 'autumnLeaves'

type Shape = 'petal' | 'maple' | 'ginkgo'

interface FallingVariant {
  shape: Shape
  color: string
}

export interface FallingStyle {
  /** 1枚ごとにランダムに選ぶ形・色 */
  variants: readonly FallingVariant[]
  /** 大きさの倍率 */
  sizeScale: number
  /** 回転速度の倍率（タイトルの常時演出のみ） */
  spin: number
  /** 裏返るように横幅を伸縮させる（ひらひら感） */
  flutter: boolean
}

const SAKURA_COLORS = [
  'rgba(255,183,197,0.7)',
  'rgba(255,160,180,0.6)',
  'rgba(248,200,210,0.65)',
]

export const FALLING_STYLES: Record<FallingKind, FallingStyle> = {
  sakura: {
    variants: SAKURA_COLORS.map((color) => ({ shape: 'petal', color })),
    sizeScale: 1,
    spin: 1,
    flutter: false,
  },
  autumnLeaves: {
    variants: [
      { shape: 'maple', color: 'rgba(214,58,38,0.9)' },
      { shape: 'maple', color: 'rgba(232,90,36,0.9)' },
      { shape: 'maple', color: 'rgba(240,128,40,0.9)' },
      { shape: 'ginkgo', color: 'rgba(244,190,36,0.9)' },
      { shape: 'ginkgo', color: 'rgba(250,206,64,0.9)' },
    ],
    sizeScale: 1.6,
    spin: 2.5,
    flutter: true,
  },
}

/** 1枚分の見た目（形・色・裏返りの位相と速さ）をランダムに決める */
export function pickAppearance(style: FallingStyle) {
  const variant = style.variants[Math.floor(Math.random() * style.variants.length)]
  return {
    shape: variant.shape,
    color: variant.color,
    flipPhase: Math.random() * Math.PI * 2,
    flipSpeed: style.flutter ? 0.02 + Math.random() * 0.03 : 0,
  }
}

const deg = (d: number) => (d * Math.PI) / 180
const polar = (angleDeg: number, r: number): [number, number] => [
  Math.cos(deg(angleDeg)) * r,
  Math.sin(deg(angleDeg)) * r,
]

/** モミジ: 7裂の掌状。角度は canvas 座標（下 = 90°）、長さは半径1基準 */
const MAPLE_LOBES = [
  { angle: 150, length: 0.42 },
  { angle: 188, length: 0.7 },
  { angle: 228, length: 0.9 },
  { angle: 270, length: 1 },
  { angle: 312, length: 0.9 },
  { angle: 352, length: 0.7 },
  { angle: 390, length: 0.42 },
]

function buildMaplePath(): Path2D {
  const path = new Path2D()
  path.moveTo(...polar(90, 0.15))
  MAPLE_LOBES.forEach((lobe, i) => {
    const prev = MAPLE_LOBES[i - 1]
    if (prev) path.lineTo(...polar((prev.angle + lobe.angle) / 2, 0.33))
    path.lineTo(...polar(lobe.angle - 15, lobe.length * 0.55))
    path.lineTo(...polar(lobe.angle, lobe.length))
    path.lineTo(...polar(lobe.angle + 15, lobe.length * 0.55))
  })
  path.closePath()
  return path
}

/** イチョウ: 扇形で上辺中央に切れ込み */
function buildGinkgoPath(): Path2D {
  const apexY = 0.3
  const r = 1.05
  const path = new Path2D()
  path.moveTo(0, apexY)
  path.arc(0, apexY, r, deg(-145), deg(-96))
  path.lineTo(0, apexY - r * 0.72)
  path.arc(0, apexY, r, deg(-84), deg(-35))
  path.closePath()
  return path
}

/** 葉柄（モミジ・イチョウ共通）。半径1基準 */
const STEM: Record<Exclude<Shape, 'petal'>, [number, number, number, number]> = {
  maple: [0, 0.15, 0.04, 0.75],
  ginkgo: [0, 0.3, 0.06, 0.9],
}

let leafPaths: Record<Exclude<Shape, 'petal'>, Path2D> | null = null
function getLeafPaths() {
  // Path2D はブラウザ API のため、モジュール読み込み時ではなく初回描画時に作る
  leafPaths ??= { maple: buildMaplePath(), ginkgo: buildGinkgoPath() }
  return leafPaths
}

/**
 * 1枚を描画する
 * @param flipPhase 裏返りの位相。横幅を cos で伸縮させる（flutter なしなら 0 を渡す）
 */
export function drawFallingPiece(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  y: number,
  size: number,
  rotation: number,
  flipPhase: number,
  alpha: number,
  color: string,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color

  if (shape === 'petal') {
    // 花びら: 2つの楕円で花びら形状を表現
    ctx.beginPath()
    ctx.ellipse(-size * 0.15, 0, size * 0.5, size, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(size * 0.15, 0, size * 0.5, size, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // 真横（幅0）で消えないよう最小幅を残す
    const c = Math.cos(flipPhase)
    const flip = Math.abs(c) < 0.15 ? 0.15 * (c < 0 ? -1 : 1) : c
    ctx.scale(size * flip, size)
    ctx.fill(getLeafPaths()[shape])
    const [x1, y1, x2, y2] = STEM[shape]
    ctx.strokeStyle = color
    ctx.lineWidth = 0.07
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.restore()
}
