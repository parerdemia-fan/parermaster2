import { useEffect, useRef } from 'react'
import { PETAL_COLORS, drawPetal } from './petalUtils'

const PETALS_PER_CLICK = 3
const GRAVITY = 300 // px/s²
const LIFETIME_MS = 1000
const DRAG = 0.6 // per second (exponential drag)

interface ClickPetal {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  color: string
  elapsed: number
}

/**
 * クリック/タップ位置から桜の花びらが舞い落ちるエフェクト。
 * delta-time ベース。花びらがないときは rAF を停止。
 */
export function ClickPetalEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const petalsRef = useRef<ClickPetal[]>([])
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

    function getScale() { return canvas!.width / 500 }

    function animate(now: number) {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = now

      const ctx = ctxRef.current
      if (!ctx) return
      const petals = petalsRef.current
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)

      const scale = getScale()
      const dragFactor = DRAG ** dt
      let i = 0
      while (i < petals.length) {
        const p = petals[i]
        p.vy += GRAVITY * scale * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= dragFactor
        p.rotation += p.rotationSpeed * dt * 60
        p.elapsed += dt * 1000
        if (p.elapsed >= LIFETIME_MS) {
          petals[i] = petals[petals.length - 1]
          petals.pop()
        } else {
          const alpha = (1 - p.elapsed / LIFETIME_MS) * 0.8
          drawPetal(ctx, p.x, p.y, p.size, p.rotation, alpha, p.color)
          i++
        }
      }

      if (petals.length > 0) {
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
      const petals = petalsRef.current
      for (let j = 0; j < PETALS_PER_CLICK; j++) {
        petals.push({
          x: cx + (Math.random() - 0.5) * 10 * s,
          y: cy + (Math.random() - 0.5) * 6 * s,
          vx: (Math.random() - 0.5) * 80 * s,
          vy: (-30 + Math.random() * 20) * s,
          size: (3 + Math.random() * 3) * s,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.08,
          color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
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
  }, [])

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
