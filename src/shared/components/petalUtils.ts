/** 桜の花びらの共通カラーパレット（SakuraPetals / ClickPetalEffect で共用） */
export const PETAL_COLORS = [
  'rgba(255,183,197,0.7)',
  'rgba(255,160,180,0.6)',
  'rgba(248,200,210,0.65)',
]

/** 花びらを1枚描画する（2つの楕円弧で花びら形状を表現） */
export function drawPetal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number,
  color: string,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(-size * 0.15, 0, size * 0.5, size, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(size * 0.15, 0, size * 0.5, size, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
