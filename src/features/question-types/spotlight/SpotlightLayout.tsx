import { useState, useEffect, useRef, useCallback } from 'react'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import { CHOICE_PALETTES, NAME_GUESS_ZONES, generatePattern } from '../../../shared/utils/choiceStyle.ts'
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
  const { talents } = useTalents()
  const currentIndex = useGameStore((s) => s.currentIndex)

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

  const answerTalents = question.answerTalentIds.map((id) => talents.find((t) => t.id === id))

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
        {question.answers.map((answer, i) => {
          const answerTalent = answerTalents[i]
          const faceImagePath = answerTalent ? getTalentImagePath(answerTalent) : undefined

          const palette = CHOICE_PALETTES[i % CHOICE_PALETTES.length]
          const patternSvg = generatePattern(palette.motif, palette.motifFill, i * 1000 + currentIndex * 7, NAME_GUESS_ZONES)
          let bg = `url("data:image/svg+xml,${patternSvg}") center / 100% auto no-repeat, ${palette.gradient}`
          let borderColor = 'rgba(255,255,255,0.7)'
          let color = '#333'
          let opacity = 1
          let boxShadow = `0 0.5cqmin 1.5cqmin ${palette.outerShadow}, inset 0 1cqmin 3cqmin ${palette.insetShadow}`
          let textShadow = '0 0.1cqmin 0.3cqmin rgba(0,0,0,0.15)'

          if (isAnswered) {
            if (i === question.correctIndex) {
              bg = 'linear-gradient(135deg, rgba(34,197,94,0.92), rgba(22,163,74,0.92))'
              borderColor = 'rgba(255,255,255,0.8)'
              color = 'white'
              boxShadow = '0 0.4cqmin 1.2cqmin rgba(22,163,74,0.4), inset 0 0.8cqmin 2cqmin rgba(0,80,30,0.2)'
              textShadow = '0 1px 3px rgba(0,0,0,0.3)'
            } else if (i === selected) {
              bg = 'linear-gradient(135deg, rgba(239,68,68,0.92), rgba(220,38,38,0.92))'
              borderColor = 'rgba(255,255,255,0.8)'
              color = 'white'
              boxShadow = '0 0.4cqmin 1.2cqmin rgba(220,38,38,0.4), inset 0 0.8cqmin 2cqmin rgba(100,0,0,0.2)'
              textShadow = '0 1px 3px rgba(0,0,0,0.3)'
            } else {
              opacity = 0.4
            }
          }

          return (
            <button
              key={i}
              className="font-bold transition active:scale-98"
              style={{
                position: 'relative',
                height: '13cqmin',
                fontSize: answer.length <= 8 ? '5cqmin'
                  : answer.length <= 9 ? '4.5cqmin'
                  : '3.8cqmin',
                padding: 0,
                borderRadius: '2cqmin',
                border: `0.5cqmin solid ${borderColor}`,
                background: bg,
                color,
                opacity,
                cursor: isAnswered ? 'default' : 'pointer',
                boxShadow,
                textShadow,
                overflow: 'hidden',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              {/* 顔画像 */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '13cqmin',
                  height: '100%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isAnswered ? 'transparent' : 'rgba(0,0,0,0.06)',
                }}
              >
                {isAnswered && faceImagePath ? (
                  <img
                    src={faceImagePath}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    draggable={false}
                  />
                ) : (
                  <span style={{ fontSize: '7cqmin', opacity: 0.25 }}>👤</span>
                )}
              </div>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2cqmin 0 7cqmin',
                  pointerEvents: 'none',
                }}
              >
                {answer}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
