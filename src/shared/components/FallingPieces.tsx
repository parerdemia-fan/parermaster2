import { useEffect, useRef } from 'react'
import { FALLING_STYLES, drawFallingPiece, pickAppearance, type FallingKind, type FallingStyle } from './fallingShapes.ts'
import { isPageActive, onPageActiveChange } from '../utils/pageActivity.ts'

const PIECE_COUNT = 15

interface Piece extends ReturnType<typeof pickAppearance> {
  x: number
  y: number
  size: number
  speed: number
  swayAmp: number
  swaySpeed: number
  swayOffset: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

function createPiece(style: FallingStyle, canvasW: number, canvasH: number, startAbove: boolean): Piece {
  return {
    ...pickAppearance(style),
    x: Math.random() * canvasW,
    y: startAbove ? -10 - Math.random() * canvasH * 0.3 : Math.random() * canvasH,
    size: (3 + Math.random() * 4) * style.sizeScale,
    speed: 0.3 + Math.random() * 0.5,
    swayAmp: 15 + Math.random() * 25,
    swaySpeed: 0.005 + Math.random() * 0.01,
    swayOffset: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02 * style.spin,
    opacity: 0.5 + Math.random() * 0.4,
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, p: Piece) {
  drawFallingPiece(ctx, p.shape, p.x, p.y, p.size, p.rotation, p.flipPhase, p.opacity, p.color)
}

/** タイトル画面で季節の花びら・葉が常時舞い落ちる演出 */
export function FallingPieces({ kind }: { kind: FallingKind }) {
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

    const style = FALLING_STYLES[kind]
    const scale = rect.width / 500
    const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, () =>
      createPiece(style, rect.width, rect.height, false),
    )
    // スケールに応じてサイズ調整
    for (const p of pieces) {
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

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i]
        p.y += p.speed
        p.x += Math.sin(time * p.swaySpeed + p.swayOffset) * p.swayAmp * 0.02
        p.rotation += p.rotationSpeed
        p.flipPhase += p.flipSpeed

        // 画面下に出たらリセット
        if (p.y > canvas!.height + 10) {
          const newP = createPiece(style, canvas!.width, canvas!.height, true)
          newP.size *= scale
          newP.swayAmp *= scale
          newP.speed *= scale
          pieces[i] = newP
        }

        drawPiece(ctx!, p)
      }

      rafId = requestAnimationFrame(animate)
    }

    // タブ非表示・ウィンドウ非フォーカス中は描画を止める（発熱対策）
    const unsubscribe = onPageActiveChange((active) => {
      paused = !active
      if (active) {
        rafId = requestAnimationFrame(animate)
      } else {
        cancelAnimationFrame(rafId)
      }
    })

    paused = !isPageActive()
    if (!paused) rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      unsubscribe()
    }
  }, [kind])

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
