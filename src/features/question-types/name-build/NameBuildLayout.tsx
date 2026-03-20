import { useState } from 'react'
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
  return question.difficulty >= 2 ? (
    <CharPickLayout
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  ) : (
    <PairPickLayout
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

// ─── ★☆☆ 苗字・名前ペア選択 ───────────────────────────

function PairPickLayout({
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
      <FaceImage src={question.talentImagePath} />

      {/* 回答枠（苗字 + 名前）: 8cqmin */}
      <div
        className="flex items-center justify-center"
        style={{ gap: '2cqmin', height: '8cqmin' }}
      >
        <PairSlot
          label="苗字"
          value={slots[0]}
          isAnswered={isAnswered}
          isCorrectSlot={isAnswered && slots[0] === question.correctFamilyName}
          correctValue={question.correctFamilyName}
        />
        <PairSlot
          label="名前"
          value={slots[1]}
          isAnswered={isAnswered}
          isCorrectSlot={isAnswered && slots[1] === question.correctGivenName}
          correctValue={question.correctGivenName}
        />
      </div>

      {/* 正誤フィードバック */}
      {isAnswered && <Feedback isCorrect={isCorrect} />}

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
        <ActionButtons
          canSubmit={bothFilled}
          onClear={handleClear}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// ─── ★★☆ 1文字ずつ選択 ─────────────────────────────

function CharPickLayout({
  question,
  isAnswered,
  onAnswer,
}: NameBuildLayoutProps) {
  const familyLen = question.correctFamilyName.length
  const givenLen = question.correctGivenName.length
  const totalSlots = familyLen + givenLen
  const isHard = question.difficulty === 3

  // 選択済み選択肢インデックス（選択順）
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  // 導出値
  const filledChars = selectedIndices.map((i) => question.choices[i])
  const usedSet = new Set(selectedIndices)
  const allFilled = selectedIndices.length >= totalSlots

  const handleChoiceClick = (index: number) => {
    if (isAnswered || usedSet.has(index) || allFilled) return
    setSelectedIndices([...selectedIndices, index])
  }

  const handleBackspace = () => {
    if (isAnswered || selectedIndices.length === 0) return
    setSelectedIndices(selectedIndices.slice(0, -1))
  }

  const handleClear = () => {
    if (isAnswered) return
    setSelectedIndices([])
  }

  const handleSubmit = () => {
    if (isAnswered || !allFilled) return
    const builtFamily = filledChars.slice(0, familyLen).join('')
    const builtGiven = filledChars.slice(familyLen).join('')
    const isCorrect =
      builtFamily === question.correctFamilyName &&
      builtGiven === question.correctGivenName
    onAnswer(isCorrect)
  }

  const builtFamily = filledChars.slice(0, familyLen).join('')
  const builtGiven = filledChars.slice(familyLen).join('')
  const isCorrect =
    isAnswered &&
    builtFamily === question.correctFamilyName &&
    builtGiven === question.correctGivenName

  // 正解の文字配列
  const correctChars = [...question.correctFamilyName, ...question.correctGivenName]

  return (
    <div
      className="flex flex-col items-center"
      style={{
        flex: 1,
        width: '100%',
        padding: '2cqmin 3cqmin',
        gap: '1.5cqmin',
      }}
    >
      {/* 顔画像（★★★は選択肢が多いためさらに小さく） */}
      <FaceImage src={question.talentImagePath} size={isHard ? '18cqmin' : '22cqmin'} />

      {/* 文字スロット */}
      <div
        className="flex items-center justify-center"
        style={{ gap: '1cqmin', height: '8cqmin', flexWrap: 'wrap' }}
      >
        {/* 苗字スロット */}
        {[...question.correctFamilyName].map((correctChar, i) => (
          <CharSlot
            key={`f-${i}`}
            value={filledChars[i] ?? null}
            isAnswered={isAnswered}
            isCorrectSlot={isAnswered && filledChars[i] === correctChar}
            correctValue={correctChar}
            isCurrent={!isAnswered && filledChars.length === i}
          />
        ))}
        {/* 区切り */}
        <div style={{ width: '2cqmin' }} />
        {/* 名前スロット */}
        {[...question.correctGivenName].map((correctChar, i) => {
          const slotIndex = familyLen + i
          return (
            <CharSlot
              key={`g-${i}`}
              value={filledChars[slotIndex] ?? null}
              isAnswered={isAnswered}
              isCorrectSlot={isAnswered && filledChars[slotIndex] === correctChar}
              correctValue={correctChar}
              isCurrent={!isAnswered && filledChars.length === slotIndex}
            />
          )
        })}
      </div>

      {/* 正誤フィードバック */}
      {isAnswered && <Feedback isCorrect={isCorrect} />}

      {/* 選択肢グリッド: ★★☆=5列×3行(15文字), ★★★=7列×5行(35文字) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${isHard ? 7 : 5}, 1fr)`,
          gap: isHard ? '0.8cqmin' : '1.2cqmin',
          width: '100%',
          maxWidth: '85cqmin',
        }}
      >
        {question.choices.map((char, i) => {
          const isUsed = usedSet.has(i)
          let bg = 'rgba(255,255,255,0.85)'
          let borderColor = 'rgba(255,255,255,0.5)'
          let color = '#333'
          let opacity = isUsed && !isAnswered ? 0.4 : 1

          if (isAnswered) {
            const isCorrectChar = correctChars.includes(char)
            if (isCorrectChar) {
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
                height: isHard ? '6.5cqmin' : '8cqmin',
                fontSize: isHard ? '3cqmin' : '3.5cqmin',
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
              onClick={() => handleChoiceClick(i)}
            >
              {char}
            </button>
          )
        })}
      </div>

      {/* クリア＋1文字戻す＋決定ボタン */}
      {!isAnswered && (
        <div
          className="flex justify-center"
          style={{ gap: '2cqmin' }}
        >
          <ActionButton
            label="クリア"
            onClick={handleClear}
            variant="secondary"
          />
          <ActionButton
            label="1字戻す"
            onClick={handleBackspace}
            variant="secondary"
            disabled={selectedIndices.length === 0}
          />
          <ActionButton
            label="OK"
            onClick={handleSubmit}
            variant={allFilled ? 'primary' : 'disabled'}
            disabled={!allFilled}
          />
        </div>
      )}
    </div>
  )
}

// ─── 共通コンポーネント ─────────────────────────────

function FaceImage({ src, size = '25cqmin' }: { src: string; size?: string }) {
  return (
    <img
      src={src}
      alt="誰でしょう？"
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '3cqmin',
        border: '0.4cqmin solid rgba(255,255,255,0.8)',
        boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.2)',
      }}
      draggable={false}
    />
  )
}

function Feedback({ isCorrect }: { isCorrect: boolean }) {
  return (
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
  )
}

function PairSlot({
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
  const textColor = 'white'

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

function CharSlot({
  value,
  isAnswered,
  isCorrectSlot,
  correctValue,
  isCurrent,
}: {
  value: string | null
  isAnswered: boolean
  isCorrectSlot: boolean
  correctValue: string
  isCurrent: boolean
}) {
  let bg = 'rgba(255,255,255,0.3)'
  let borderColor = isCurrent ? 'rgba(59,130,246,0.8)' : 'rgba(255,255,255,0.6)'

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
        width: '7cqmin',
        height: '7cqmin',
        fontSize: '3.5cqmin',
        borderRadius: '1cqmin',
        border: `0.4cqmin ${value ? 'solid' : 'dashed'} ${borderColor}`,
        background: bg,
        color: 'white',
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(4px)',
        transition: 'border-color 0.15s',
      }}
    >
      {displayValue ?? ''}
    </div>
  )
}

function ActionButtons({
  canSubmit,
  onClear,
  onSubmit,
}: {
  canSubmit: boolean
  onClear: () => void
  onSubmit: () => void
}) {
  return (
    <div
      className="flex justify-center"
      style={{ gap: '3cqmin' }}
    >
      <ActionButton label="クリア" onClick={onClear} variant="secondary" />
      <ActionButton
        label="OK"
        onClick={onSubmit}
        variant={canSubmit ? 'primary' : 'disabled'}
        disabled={!canSubmit}
      />
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  variant,
  disabled = false,
}: {
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary' | 'disabled'
  disabled?: boolean
}) {
  return (
    <button
      className="font-bold transition active:scale-98"
      style={{
        height: '7cqmin',
        padding: '0 5cqmin',
        fontSize: '3cqmin',
        borderRadius: '1.5cqmin',
        border: '0.3cqmin solid',
        borderColor:
          variant === 'primary'
            ? '#3b82f6'
            : 'rgba(255,255,255,0.5)',
        background:
          variant === 'primary'
            ? 'rgba(59,130,246,0.85)'
            : variant === 'secondary'
              ? 'rgba(255,255,255,0.7)'
              : 'rgba(255,255,255,0.5)',
        color:
          variant === 'primary'
            ? 'white'
            : variant === 'secondary'
              ? '#666'
              : '#aaa',
        cursor: disabled ? 'default' : 'pointer',
        backdropFilter: 'blur(4px)',
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
