import type { NameBuildQuestion } from './types.ts'

interface NameBuildLayoutProps {
  question: NameBuildQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function NameBuildLayout({
  question,
  isAnswered,
  onAnswer,
}: NameBuildLayoutProps) {
  return (
    <NameBuildLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

import { useState } from 'react'

function NameBuildLayoutInner({
  question,
  isAnswered,
  onAnswer,
}: NameBuildLayoutProps) {
  const [slots, setSlots] = useState<[string | null, string | null]>([null, null])

  const handleChoiceClick = (choice: string) => {
    if (isAnswered) return
    if (choice === slots[0] || choice === slots[1]) return

    if (slots[0] === null) {
      setSlots([choice, slots[1]])
    } else if (slots[1] === null) {
      setSlots([slots[0], choice])
    }
  }

  const handleClear = () => {
    if (isAnswered) return
    setSlots([null, null])
  }

  const handleSubmit = () => {
    if (isAnswered || slots[0] === null || slots[1] === null) return
    const isCorrect =
      slots[0] === question.correctFamilyName &&
      slots[1] === question.correctGivenName
    onAnswer(isCorrect)
  }

  const isCorrect =
    isAnswered &&
    slots[0] === question.correctFamilyName &&
    slots[1] === question.correctGivenName

  const bothFilled = slots[0] !== null && slots[1] !== null

  return (
    <div
      className="flex flex-col items-center"
      style={{
        flex: 1,
        width: '100%',
        padding: '2cqmin 3cqmin',
        gap: '2cqmin',
      }}
    >
      {/* 顔画像: 25cqmin */}
      <img
        src={question.talentImagePath}
        alt="誰でしょう？"
        style={{
          width: '25cqmin',
          height: '25cqmin',
          objectFit: 'cover',
          borderRadius: '3cqmin',
          border: '0.4cqmin solid rgba(255,255,255,0.8)',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.2)',
        }}
        draggable={false}
      />

      {/* 回答枠（苗字 + 名前）: 8cqmin */}
      <div
        className="flex items-center justify-center"
        style={{ gap: '2cqmin', height: '8cqmin' }}
      >
        <Slot
          label="苗字"
          value={slots[0]}
          isAnswered={isAnswered}
          isCorrectSlot={isAnswered && slots[0] === question.correctFamilyName}
          correctValue={question.correctFamilyName}
        />
        <Slot
          label="名前"
          value={slots[1]}
          isAnswered={isAnswered}
          isCorrectSlot={isAnswered && slots[1] === question.correctGivenName}
          correctValue={question.correctGivenName}
        />
      </div>

      {/* 正誤フィードバック */}
      {isAnswered && (
        <div
          className="font-bold"
          style={{
            fontSize: '4cqmin',
            color: isCorrect ? '#22c55e' : '#ef4444',
            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            lineHeight: 1,
          }}
        >
          {isCorrect ? '正解！' : '不正解..'}
        </div>
      )}

      {/* 選択肢（2行×4列）: 18cqmin */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5cqmin',
          width: '100%',
          maxWidth: '85cqmin',
        }}
      >
        {question.choices.map((choice, i) => {
          const isUsed = choice === slots[0] || choice === slots[1]
          let bg = 'rgba(255,255,255,0.85)'
          let borderColor = 'rgba(255,255,255,0.5)'
          let color = '#333'
          let opacity = isUsed && !isAnswered ? 0.4 : 1

          if (isAnswered) {
            const isCorrectFamily = choice === question.correctFamilyName
            const isCorrectGiven = choice === question.correctGivenName
            if (isCorrectFamily || isCorrectGiven) {
              bg = 'rgba(34,197,94,0.85)'
              borderColor = '#22c55e'
              color = 'white'
            } else if (isUsed) {
              bg = 'rgba(239,68,68,0.85)'
              borderColor = '#ef4444'
              color = 'white'
            } else {
              opacity = 0.4
            }
          }

          return (
            <button
              key={i}
              className="font-bold transition active:scale-98"
              style={{
                height: '8cqmin',
                fontSize: '3cqmin',
                borderRadius: '1.5cqmin',
                border: `0.3cqmin solid ${borderColor}`,
                background: bg,
                color,
                opacity,
                cursor: isAnswered || isUsed ? 'default' : 'pointer',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
              }}
              disabled={isAnswered || isUsed}
              onClick={() => handleChoiceClick(choice)}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {/* クリア＋決定ボタン: 8cqmin */}
      {!isAnswered && (
        <div
          className="flex justify-center"
          style={{ gap: '3cqmin' }}
        >
          <button
            className="font-bold transition active:scale-98"
            style={{
              height: '7cqmin',
              padding: '0 5cqmin',
              fontSize: '3cqmin',
              borderRadius: '1.5cqmin',
              border: '0.3cqmin solid rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.7)',
              color: '#666',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
            onClick={handleClear}
          >
            クリア
          </button>
          <button
            className="font-bold transition active:scale-98"
            style={{
              height: '7cqmin',
              padding: '0 5cqmin',
              fontSize: '3cqmin',
              borderRadius: '1.5cqmin',
              border: '0.3cqmin solid',
              borderColor: bothFilled ? '#3b82f6' : 'rgba(255,255,255,0.5)',
              background: bothFilled ? 'rgba(59,130,246,0.85)' : 'rgba(255,255,255,0.5)',
              color: bothFilled ? 'white' : '#aaa',
              cursor: bothFilled ? 'pointer' : 'default',
              backdropFilter: 'blur(4px)',
            }}
            disabled={!bothFilled}
            onClick={handleSubmit}
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}

function Slot({
  label,
  value,
  isAnswered,
  isCorrectSlot,
  correctValue,
}: {
  label: string
  value: string | null
  isAnswered: boolean
  isCorrectSlot: boolean
  correctValue: string
}) {
  let bg = 'rgba(255,255,255,0.3)'
  let borderColor = 'rgba(255,255,255,0.6)'
  let textColor = 'white'

  if (isAnswered && value !== null) {
    if (isCorrectSlot) {
      bg = 'rgba(34,197,94,0.3)'
      borderColor = '#22c55e'
    } else {
      bg = 'rgba(239,68,68,0.3)'
      borderColor = '#ef4444'
    }
  }

  const displayValue = isAnswered ? (isCorrectSlot ? value : correctValue) : value

  return (
    <div
      className="flex items-center justify-center font-bold"
      style={{
        minWidth: '20cqmin',
        height: '7cqmin',
        fontSize: '3.5cqmin',
        borderRadius: '1.5cqmin',
        border: `0.4cqmin dashed ${borderColor}`,
        background: bg,
        color: textColor,
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {displayValue ?? (
        <span style={{ fontSize: '2.5cqmin', opacity: 0.6 }}>{label}</span>
      )}
    </div>
  )
}
