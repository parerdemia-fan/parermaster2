import { useState, useEffect, useRef } from 'react'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import { CHOICE_PALETTES, NAME_GUESS_ZONES, generatePattern } from '../../../shared/utils/choiceStyle.ts'
import type { BlurQuestion } from './types.ts'

/** ぼかし解除にかかる時間（ms） */
const REVEAL_DURATION = 15000
/** 初期ぼかし量（px） */
const INITIAL_BLUR = 30
/** アニメーション更新間隔（ms） */
const TICK_INTERVAL = 50

interface BlurLayoutProps {
  question: BlurQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function BlurLayout({ question, isAnswered, onAnswer }: BlurLayoutProps) {
  return (
    <BlurLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

function BlurLayoutInner({ question, isAnswered, onAnswer }: BlurLayoutProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [progress, setProgress] = useState(0) // 0〜1: 鮮明度
  const { talents } = useTalents()
  const currentIndex = useGameStore((s) => s.currentIndex)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(Date.now())

  // ぼかし解除アニメーション
  useEffect(() => {
    startTimeRef.current = Date.now()
    setProgress(0)

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const p = Math.min(elapsed / REVEAL_DURATION, 1)
      setProgress(p)
      if (p >= 1 && timerRef.current) {
        clearInterval(timerRef.current)
      }
    }, TICK_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [question.talentId])

  // 回答時にアニメーション停止＆完全鮮明化
  useEffect(() => {
    if (isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(1)
    }
  }, [isAnswered])

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const blurAmount = INITIAL_BLUR * (1 - progress)
  const grayscaleAmount = question.useGrayscale ? 1 - progress : 0
  const imageFilter = `blur(${blurAmount}px) grayscale(${grayscaleAmount})`

  const answerTalents = question.answerTalentIds.map((id) => talents.find((t) => t.id === id))

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* ぼかし画像（左側に大きく） */}
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
        }}
      >
        <img
          src={question.talentImagePath}
          alt="誰でしょう？"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: imageFilter,
            transition: isAnswered ? 'filter 0.3s' : undefined,
          }}
          draggable={false}
        />
      </div>

      {/* 進捗バー（画像の下） */}
      <div
        style={{
          position: 'absolute',
          left: '2%',
          bottom: '3cqmin',
          width: '42%',
          height: '1cqmin',
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '0.5cqmin',
          overflow: 'hidden',
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: progress < 1
              ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
              : 'linear-gradient(90deg, #34d399, #10b981)',
            borderRadius: '0.5cqmin',
            transition: isAnswered ? 'width 0.3s, background 0.3s' : undefined,
          }}
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
