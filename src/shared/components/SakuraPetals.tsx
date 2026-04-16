import { useEffect, useRef } from 'react'
import { PETAL_COLORS, drawPetal } from './petalUtils'

const PETAL_COUNT = 15

interface Petal {
  x: number
  y: number
  size: number
  speed: number
  swayAmp: number
  swaySpeed: number
  swayOffset: number
  rotation: number
  rotationSpeed: number
  color: string
  opacity: number
}

function createPetal(canvasW: number, canvasH: number, startAbove: boolean): Petal {
  return {
    x: Math.random() * canvasW,
    y: startAbove ? -10 - Math.random() * canvasH * 0.3 : Math.random() * canvasH,
    size: 3 + Math.random() * 4,
    speed: 0.3 + Math.random() * 0.5,
    swayAmp: 15 + Math.random() * 25,
    swaySpeed: 0.005 + Math.random() * 0.01,
    swayOffset: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    opacity: 0.5 + Math.random() * 0.4,
  }
}

function drawSakuraPetal(ctx: CanvasRenderingContext2D, p: Petal) {
  drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.opacity, p.color)
}

export function SakuraPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = rect.width / 500
    const petals: Petal[] = Array.from({ length: PETAL_COUNT }, () =>
      createPetal(rect.width, rect.height, false),
    )
    // スケールに応じてサイズ調整
    for (const p of petals) {
      p.size *= scale
      p.swayAmp *= scale
      p.speed *= scale
    }

    let rafId: number
    let time = 0
    let paused = false

    function animate() {
      if (paused) return
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      time++

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i]
        p.y += p.speed
        p.x += Math.sin(time * p.swaySpeed + p.swayOffset) * p.swayAmp * 0.02
        p.rotation += p.rotationSpeed

        // 画面下に出たらリセット
        if (p.y > canvas!.height + 10) {
          const newP = createPetal(canvas!.width, canvas!.height, true)
          newP.size *= scale
          newP.swayAmp *= scale
          newP.speed *= scale
          petals[i] = newP
        }

        drawSakuraPetal(ctx!, p)
      }

      rafId = requestAnimationFrame(animate)
    }

    function onVisibilityChange() {
      if (document.hidden) {
        paused = true
        cancelAnimationFrame(rafId)
      } else {
        paused = false
        rafId = requestAnimationFrame(animate)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}
