import { useState, useEffect, useRef, useCallback } from 'react'
import { TalentChoiceButtons } from '../../../shared/components/TalentChoiceButtons.tsx'
import type { SpotlightQuestion } from './types.ts'

/** スポットライト半径の初期値（画像幅に対する割合） */
const SPOTLIGHT_RADIUS_START = 0.075
/** スポットライト半径の最大値（画像幅に対する割合） */
const SPOTLIGHT_RADIUS_END = 0.225
/** スポットライトが最大になるまでの時間（ms） */
const GROW_DURATION = 15000
/** スポットライトの移動速度（1フレームあたりの最大移動量、画像幅に対する割合） */
const MOVE_SPEED = 0.008
/** ターゲット到達判定の閾値 */
const TARGET_THRESHOLD = 0.02

interface SpotlightLayoutProps {
  question: SpotlightQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function SpotlightLayout({ question, isAnswered, onAnswer }: SpotlightLayoutProps) {
  return (
    <SpotlightLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

function SpotlightLayoutInner({ question, isAnswered, onAnswer }: SpotlightLayoutProps) {
  const [selected, setSelected] = useState<number | null>(null)

  // スポットライト位置（0〜1の正規化座標）と半径
  const [spotX, setSpotX] = useState(0.5)
  const [spotY, setSpotY] = useState(0.5)
  const [spotRadius, setSpotRadius] = useState(SPOTLIGHT_RADIUS_START)
  const targetRef = useRef({ x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.6 + 0.2 })
  const posRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef(Date.now())

  const pickNewTarget = useCallback(() => {
    targetRef.current = {
      x: Math.random() * 0.7 + 0.15,
      y: Math.random() * 0.7 + 0.15,
    }
  }, [])

  // スポットライトアニメーション
  useEffect(() => {
    if (isAnswered) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    startTimeRef.current = Date.now()

    const animate = () => {
      const pos = posRef.current
      const target = targetRef.current
      const dx = target.x - pos.x
      const dy = target.y - pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < TARGET_THRESHOLD) {
        pickNewTarget()
      } else {
        const step = Math.min(MOVE_SPEED, dist)
        pos.x += (dx / dist) * step
        pos.y += (dy / dist) * step
      }

      // 半径を時間経過で拡大
      const elapsed = Date.now() - startTimeRef.current
      const progress = Math.min(elapsed / GROW_DURATION, 1)
      setSpotRadius(SPOTLIGHT_RADIUS_START + (SPOTLIGHT_RADIUS_END - SPOTLIGHT_RADIUS_START) * progress)

      setSpotX(pos.x)
      setSpotY(pos.y)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isAnswered, pickNewTarget])

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  // スポットライトのマスク（回答後は全体表示）
  const radiusPct = spotRadius * 100
  const maskStyle = isAnswered
    ? undefined
    : {
        maskImage: `radial-gradient(circle at ${spotX * 100}% ${spotY * 100}%, black 0%, black ${radiusPct}%, transparent ${radiusPct + 5}%)`,
        WebkitMaskImage: `radial-gradient(circle at ${spotX * 100}% ${spotY * 100}%, black 0%, black ${radiusPct}%, transparent ${radiusPct + 5}%)`,
      }

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* スポットライト画像（左側に大きく） */}
      <div
        style={{
          position: 'absolute',
          left: '2%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '42%',
          aspectRatio: '1',
          borderRadius: '3cqmin',
          overflow: 'hidden',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.3)',
          zIndex: 2,
          background: '#000',
        }}
      >
        <img
          src={question.talentImagePath}
          alt="誰でしょう？"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: isAnswered ? 'mask-image 0.3s' : undefined,
            ...maskStyle,
          }}
          draggable={false}
        />
      </div>

      {/* 選択肢（右半分） */}
      <div
        className="flex flex-col justify-center"
        style={{
          position: 'absolute',
          top: '12cqmin',
          right: '2.5cqmin',
          bottom: '2cqmin',
          width: '48%',
          gap: '2cqmin',
          zIndex: 3,
        }}
      >
        <TalentChoiceButtons
          answers={question.answers}
          answerTalentIds={question.answerTalentIds}
          correctIndex={question.correctIndex}
          isAnswered={isAnswered}
          selected={selected}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}
