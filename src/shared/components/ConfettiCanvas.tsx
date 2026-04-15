import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 50
const BURST_DURATION_MS = 2000
const FADE_START_MS = BURST_DURATION_MS * 0.6
const COLORS = ['#FFD700', '#FF69B4', '#4ADE80', '#FFFFFF', '#FB923C', '#60A5FA', '#F472B6']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  rotation: number
  rotationSpeed: number
  color: string
  opacity: number
  gravity: number
  birthTime: number
}

function createParticles(centerX: number, centerY: number, scale: number, birthTime: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = (2 + Math.random() * 4) * scale
    return {
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2 * scale,
      width: (3 + Math.random() * 5) * scale,
      height: (2 + Math.random() * 3) * scale,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 1,
      gravity: 0.15 * scale,
      birthTime,
    }
  })
}

interface ConfettiCanvasProps {
  triggerKey: number
  /** trueの場合、ランダムな位置で繰り返し発生する */
  repeat?: boolean
  /** 繰り返しの間隔（ms）。デフォルト800 */
  repeatInterval?: number
}

export function ConfettiCanvas({ triggerKey, repeat, repeatInterval = 800 }: ConfettiCanvasProps) {
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
    const allParticles: Particle[] = []
    let rafId: number
    let intervalId: ReturnType<typeof setInterval> | null = null
    const startTime = performance.now()

    // 初回バースト
    allParticles.push(...createParticles(
      repeat ? Math.random() * rect.width : rect.width / 2,
      repeat ? Math.random() * rect.height * 0.6 : rect.height / 2,
      scale,
      startTime,
    ))

    // リピートモード: 定期的にランダム位置から追加
    if (repeat) {
      intervalId = setInterval(() => {
        allParticles.push(...createParticles(
          Math.random() * rect.width,
          Math.random() * rect.height * 0.6,
          scale * (0.6 + Math.random() * 0.4),
          performance.now(),
        ))
      }, repeatInterval)
    }

    function animate(now: number) {
      // 単発モード: 時間切れで停止
      if (!repeat && now - startTime > BURST_DURATION_MS) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        return
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      for (let i = allParticles.length - 1; i >= 0; i--) {
        const p = allParticles[i]
        const age = now - p.birthTime

        p.vy += p.gravity
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.rotation += p.rotationSpeed

        if (age > FADE_START_MS) {
          p.opacity = Math.max(0, 1 - (age - FADE_START_MS) / (BURST_DURATION_MS - FADE_START_MS))
        }

        // 寿命切れのパーティクルを除去
        if (age > BURST_DURATION_MS) {
          allParticles.splice(i, 1)
          continue
        }

        ctx!.save()
        ctx!.globalAlpha = p.opacity
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rotation)
        ctx!.fillStyle = p.color
        ctx!.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
        ctx!.restore()
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [triggerKey, repeat, repeatInterval])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 29,
      }}
    />
  )
}
