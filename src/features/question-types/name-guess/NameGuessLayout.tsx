import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import type { NameGuessQuestion } from './types.ts'

interface NameGuessLayoutProps {
  question: NameGuessQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function NameGuessLayout({
  question,
  isAnswered,
  onAnswer,
}: NameGuessLayoutProps) {
  // 選択状態はDOM上のdata属性で管理（再レンダリング不要な正誤表示はisAnsweredで制御）
  // → 実際にはどのボタンを押したか覚える必要があるのでstateが必要
  return (
    <NameGuessLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

import { useState } from 'react'

function NameGuessLayoutInner({
  question,
  isAnswered,
  onAnswer,
}: NameGuessLayoutProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const isCorrect = selected !== null && selected === question.correctIndex

  return (
    <div
      className="flex items-center justify-center"
      style={{
        flex: 1,
        width: '100%',
        padding: '0 3cqmin',
        gap: '4cqmin',
      }}
    >
      {/* 左: 顔画像 */}
      <div
        className="flex flex-col items-center"
        style={{ flex: '0 0 auto' }}
      >
        <img
          src={question.talentImagePath}
          alt="誰でしょう？"
          style={{
            width: '30cqmin',
            height: '30cqmin',
            objectFit: 'cover',
            borderRadius: '3cqmin',
            border: '0.4cqmin solid rgba(255,255,255,0.8)',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.2)',
            filter: question.isSilhouette && !isAnswered
              ? SILHOUETTE_FILTER
              : undefined,
            transition: 'filter 0.3s',
          }}
          draggable={false}
        />
        {isAnswered && (
          <div
            className="font-bold"
            style={{
              marginTop: '2cqmin',
              fontSize: '5cqmin',
              color: isCorrect ? '#22c55e' : '#ef4444',
              textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {isCorrect ? '正解！' : '不正解..'}
          </div>
        )}
      </div>

      {/* 右: 選択肢 */}
      <div
        className="flex flex-col"
        style={{ gap: '2cqmin', flex: '1 1 auto', maxWidth: '55cqmin' }}
      >
        {question.answers.map((answer, i) => {
          let bg = 'rgba(255,255,255,0.85)'
          let borderColor = 'rgba(255,255,255,0.5)'
          let color = '#333'
          let opacity = 1

          if (isAnswered) {
            if (i === question.correctIndex) {
              bg = 'rgba(34,197,94,0.85)'
              borderColor = '#22c55e'
              color = 'white'
            } else if (i === selected) {
              bg = 'rgba(239,68,68,0.85)'
              borderColor = '#ef4444'
              color = 'white'
            } else {
              opacity = 0.5
            }
          }

          return (
            <button
              key={i}
              className="font-bold transition active:scale-98"
              style={{
                height: '9cqmin',
                fontSize: '3.5cqmin',
                padding: '0 3cqmin',
                borderRadius: '2cqmin',
                border: `0.3cqmin solid ${borderColor}`,
                background: bg,
                color,
                opacity,
                cursor: isAnswered ? 'default' : 'pointer',
                textAlign: 'left',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              {answer}
            </button>
          )
        })}
      </div>
    </div>
  )
}
