import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 50
const DURATION_MS = 2000
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
}

function createParticles(centerX: number, centerY: number, scale: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = (2 + Math.random() * 4) * scale
    return {
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2 * scale, // bias upward
      width: (3 + Math.random() * 5) * scale,
      height: (2 + Math.random() * 3) * scale,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 1,
      gravity: 0.15 * scale,
    }
  })
}

export function ConfettiCanvas({ triggerKey }: { triggerKey: number }) {
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

    const scale = rect.width / 500 // normalize to ~500px base
    const particles = createParticles(rect.width / 2, rect.height / 2, scale)
    const startTime = performance.now()
    let rafId: number

    function animate(now: number) {
      const elapsed = now - startTime
      if (elapsed > DURATION_MS) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        return
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      const fadeStart = DURATION_MS * 0.6
      for (const p of particles) {
        p.vy += p.gravity
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.rotation += p.rotationSpeed

        if (elapsed > fadeStart) {
          p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / (DURATION_MS - fadeStart))
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

    return () => cancelAnimationFrame(rafId)
  }, [triggerKey])

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
