import { useEffect, useRef } from 'react'
import { FALLING_STYLES, drawFallingPiece, pickAppearance, type FallingKind } from './fallingShapes.ts'

const PIECES_PER_CLICK = 3
const GRAVITY = 300 // px/s²
const LIFETIME_MS = 1000
const DRAG = 0.6 // per second (exponential drag)

interface ClickPiece extends ReturnType<typeof pickAppearance> {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  elapsed: number
}

/**
 * クリック/タップ位置から季節の花びら・葉がこぼれ落ちるエフェクト。
 * delta-time ベース。描画中のものがないときは rAF を停止。
 */
export function ClickFallingEffect({ kind }: { kind: FallingKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const piecesRef = useRef<ClickPiece[]>([])
  const rafRef = useRef(0)
  const runningRef = useRef(false)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    function syncSize() {
      const r = parent!.getBoundingClientRect()
      canvas!.width = r.width
      canvas!.height = r.height
    }
    syncSize()
    ctxRef.current = canvas.getContext('2d')

    const style = FALLING_STYLES[kind]
    function getScale() { return canvas!.width / 500 }

    function animate(now: number) {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = now

      const ctx = ctxRef.current
      if (!ctx) return
      const pieces = piecesRef.current
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      const scale = getScale()
      const dragFactor = DRAG ** dt
      let i = 0
      while (i < pieces.length) {
        const p = pieces[i]
        p.vy += GRAVITY * scale * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= dragFactor
        p.rotation += p.rotationSpeed * dt * 60
        p.flipPhase += p.flipSpeed * dt * 60
        p.elapsed += dt * 1000
        if (p.elapsed >= LIFETIME_MS) {
          pieces[i] = pieces[pieces.length - 1]
          pieces.pop()
        } else {
          const alpha = (1 - p.elapsed / LIFETIME_MS) * 0.8
          drawFallingPiece(ctx, p.shape, p.x, p.y, p.size, p.rotation, p.flipPhase, alpha, p.color)
          i++
        }
      }

      if (pieces.length > 0) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        runningRef.current = false
      }
    }

    function startLoop() {
      if (!runningRef.current) {
        runningRef.current = true
        lastTimeRef.current = performance.now()
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    function handleClick(e: MouseEvent) {
      if (!canvasRef.current) return
      const r = canvasRef.current.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      const s = getScale()
      const pieces = piecesRef.current
      for (let j = 0; j < PIECES_PER_CLICK; j++) {
        pieces.push({
          ...pickAppearance(style),
          x: cx + (Math.random() - 0.5) * 10 * s,
          y: cy + (Math.random() - 0.5) * 6 * s,
          vx: (Math.random() - 0.5) * 80 * s,
          vy: (-30 + Math.random() * 20) * s,
          size: (3 + Math.random() * 3) * s * style.sizeScale,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.08,
          elapsed: 0,
        })
      }
      startLoop()
    }

    const handleResize = () => syncSize()
    window.addEventListener('resize', handleResize)
    parent.addEventListener('click', handleClick, true)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
      parent.removeEventListener('click', handleClick, true)
    }
  }, [kind])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  )
}
