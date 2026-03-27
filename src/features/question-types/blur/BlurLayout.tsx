import { useState, useEffect, useRef } from 'react'
import { TalentChoiceButtons } from '../../../shared/components/TalentChoiceButtons.tsx'
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
