import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import type { FaceGuessQuestion } from './types.ts'

interface FaceGuessLayoutProps {
  question: FaceGuessQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function FaceGuessLayout({
  question,
  isAnswered,
  onAnswer,
}: FaceGuessLayoutProps) {
  return (
    <FaceGuessLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

function FaceGuessLayoutInner({
  question,
  isAnswered,
  onAnswer,
}: FaceGuessLayoutProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const isCorrect = selected !== null && selected === question.correctIndex

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        flex: 1,
        width: '100%',
        padding: '0 3cqmin',
        gap: '2cqmin',
      }}
    >
      {/* 問題文: タレント名 + 正誤表示 */}
      <div className="flex items-center justify-center" style={{ gap: '2cqmin' }}>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {question.talentName}
        </span>
        {isAnswered && (
          <span
            className="font-bold"
            style={{
              fontSize: '4cqmin',
              color: isCorrect ? '#22c55e' : '#ef4444',
              textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {isCorrect ? '正解！' : '不正解..'}
          </span>
        )}
      </div>

      {/* 2x2 顔画像グリッド */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2cqmin',
          width: '52cqmin',
        }}
      >
        {question.answerImages.map((imagePath, i) => {
          let borderColor = 'rgba(255,255,255,0.8)'
          let opacity = 1
          let shadow = '0 0.5cqmin 2cqmin rgba(0,0,0,0.2)'

          if (isAnswered) {
            if (i === question.correctIndex) {
              borderColor = '#22c55e'
              shadow = '0 0 1.5cqmin rgba(34,197,94,0.6)'
            } else if (i === selected) {
              borderColor = '#ef4444'
              shadow = '0 0 1.5cqmin rgba(239,68,68,0.6)'
            } else {
              opacity = 0.4
            }
          }

          return (
            <button
              key={i}
              className="transition active:scale-97"
              style={{
                padding: 0,
                border: `0.5cqmin solid ${borderColor}`,
                borderRadius: '2cqmin',
                background: 'none',
                cursor: isAnswered ? 'default' : 'pointer',
                opacity,
                boxShadow: shadow,
                overflow: 'hidden',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              <img
                src={imagePath}
                alt={isAnswered ? question.answerNames[i] : '選択肢'}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  display: 'block',
                  filter: question.isSilhouette && !isAnswered
                    ? SILHOUETTE_FILTER
                    : undefined,
                  transition: 'filter 0.3s',
                }}
                draggable={false}
              />
              {/* 回答後に名前を表示 */}
              {isAnswered && (
                <div
                  className="font-bold"
                  style={{
                    fontSize: '2.5cqmin',
                    padding: '0.5cqmin',
                    background: i === question.correctIndex
                      ? 'rgba(34,197,94,0.85)'
                      : 'rgba(0,0,0,0.5)',
                    color: 'white',
                    textAlign: 'center',
                  }}
                >
                  {question.answerNames[i]}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
