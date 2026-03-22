import { useState } from 'react'
import { useGameStore } from '../../../stores/gameStore.ts'
import type { NameBuildQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL
const COMMENT_IMAGE = `${BASE}data/images/kv/sq/25ME006.png`
const COMMENT_NAME = '灯野ぺけ。'
const COMMENT_BEFORE = 'この子の名前、作れる〜？'
const COMMENT_CORRECT = 'すごい！正解だよ〜！'
const COMMENT_WRONG = 'あちゃ〜、残念！'

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

// ─── 共通ヘッダー＋アシスタント ─────────────────────

function QuizHeader({ isAnswered, isCorrect }: { isAnswered: boolean; isCorrect: boolean }) {
  const currentIndex = useGameStore((s) => s.currentIndex)
  const questions = useGameStore((s) => s.questions)
  const total = questions.length
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  return (
    <>
      {/* 最上部左: シャープラベル */}
      <div
        className="font-bold"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          fontSize: '3.2cqmin',
          padding: '1cqmin 3.5cqmin 1cqmin 2.5cqmin',
          background: 'linear-gradient(135deg, #d6336c 0%, #e8789e 100%)',
          color: 'white',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.5cqmin) 100%, 0 100%)',
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        🔤 名前を作ろう
      </div>

      {/* 最上部中央: 問題文 */}
      <div
        className="font-bold"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: '3.8cqmin',
          padding: '0.8cqmin 5cqmin',
          background: 'rgba(255,255,255,0.92)',
          borderRadius: '0 0 1.2cqmin 1.2cqmin',
          color: '#333',
          boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.12)',
          border: '0.15cqmin solid rgba(0,0,0,0.06)',
          whiteSpace: 'nowrap',
        }}
      >
        この生徒の名前を作ろう！
      </div>

      {/* 進捗バー（中央） */}
      <div
        style={{
          position: 'absolute',
          top: '9cqmin',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30%',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.3cqmin' }}>
          <span style={{
            fontSize: '2.2cqmin',
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 6px rgba(0,0,0,0.2)',
            fontWeight: 'bold',
          }}>
            達成度: {currentIndex + 1}/{total}
          </span>
        </div>
        <div
          style={{
            height: '1.5cqmin',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '1cqmin',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #4ade80, #22c55e)',
              borderRadius: '1cqmin',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* アシスタント（右上） */}
      <div
        style={{
          position: 'absolute',
          top: '5cqmin',
          right: '2cqmin',
          zIndex: 10,
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              height: '10cqmin',
              borderRadius: '1.5cqmin',
              overflow: 'hidden',
              border: '0.3cqmin double rgba(150,150,150,0.6)',
              boxShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.12)',
            }}
          >
            <div
              style={{
                position: 'relative',
                padding: '1.8cqmin 1.5cqmin 1.8cqmin 2cqmin',
                fontSize: '1.9cqmin',
                color: '#444',
                lineHeight: 1.5,
                maxWidth: '18cqmin',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {!isAnswered
                ? COMMENT_BEFORE
                : isCorrect
                  ? COMMENT_CORRECT
                  : COMMENT_WRONG}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-0.8cqmin',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderTop: '1.2cqmin solid transparent',
                  borderBottom: '1.2cqmin solid transparent',
                  borderLeft: '1.2cqmin solid white',
                }}
              />
            </div>
            <div
              style={{
                width: '13cqmin',
                flexShrink: 0,
                background: 'rgba(255, 225, 200, 0.6)',
              }}
            />
          </div>
          <img
            src={COMMENT_IMAGE}
            alt={COMMENT_NAME}
            style={{
              position: 'absolute',
              right: '-0.5cqmin',
              bottom: 0,
              width: '14cqmin',
              clipPath: 'inset(-999px -999px 0 -999px)',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '-1.5cqmin',
            display: 'flex',
            justifyContent: 'flex-end',
            paddingRight: '0.5cqmin',
          }}
        >
          <div
            style={{
              padding: '0.3cqmin 2cqmin',
              fontSize: '1.6cqmin',
              color: 'white',
              background: 'linear-gradient(135deg, #f0a050, #e08830)',
              borderRadius: '1cqmin',
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {COMMENT_NAME}
          </div>
        </div>
      </div>
    </>
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
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      <QuizHeader isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* 左側: 顔画像 */}
      <FaceImage src={question.talentImagePath} size="35cqmin" top="16cqmin" left="5cqmin" />

      {/* 右側: スロット＋グリッド＋ボタン */}
      <div
        style={{
          position: 'absolute',
          top: '16cqmin',
          right: '2.5cqmin',
          bottom: '10cqmin',
          width: '55%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2cqmin',
          justifyContent: 'center',
        }}
      >
        {/* 回答枠（苗字 + 名前） */}
        <div
          className="flex items-center justify-center"
          style={{ gap: '2cqmin' }}
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

        {/* 選択肢（2行×4列） */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5cqmin',
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
                  fontSize: choice.length <= 3 ? '3cqmin'
                    : choice.length <= 5 ? '2.6cqmin'
                    : choice.length <= 7 ? '2.2cqmin'
                    : '1.8cqmin',
                  borderRadius: '1.5cqmin',
                  border: `0.3cqmin solid ${borderColor}`,
                  background: bg,
                  color,
                  opacity,
                  cursor: isAnswered || isUsed ? 'default' : 'pointer',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                  padding: '0 1cqmin',
                }}
                disabled={isAnswered || isUsed}
                onClick={() => handleChoiceClick(choice)}
              >
                {choice}
              </button>
            )
          })}
        </div>

        {/* クリア＋決定ボタン */}
        {!isAnswered && (
          <ActionButtons
            canSubmit={bothFilled}
            onClear={handleClear}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  )
}

// ─── ★★☆/★★★ 1文字ずつ選択 ─────────────────────────────

function CharPickLayout({
  question,
  isAnswered,
  onAnswer,
}: NameBuildLayoutProps) {
  const familyLen = question.correctFamilyName.length
  const givenLen = question.correctGivenName.length
  const totalSlots = familyLen + givenLen
  const isHard = question.difficulty === 3

  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

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

  const correctChars = [...question.correctFamilyName, ...question.correctGivenName]
  const totalChars = familyLen + givenLen
  // 文字数が多い場合はスロットサイズを縮小して折り返しを防止
  const slotSize = totalChars <= 6 ? 7 : totalChars <= 8 ? 6.5 : 6.2
  const slotFontSize = totalChars <= 6 ? 3.5 : totalChars <= 8 ? 3.2 : 3.1
  const faceSize = isHard ? '28cqmin' : '30cqmin'
  const rightWidth = isHard ? '60%' : '58%'

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      <QuizHeader isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* 左側: 顔画像 */}
      <FaceImage src={question.talentImagePath} size={faceSize} top="16cqmin" left="3cqmin" />

      {/* 右側: スロット＋グリッド＋ボタン */}
      <div
        style={{
          position: 'absolute',
          top: '16cqmin',
          right: '2.5cqmin',
          bottom: '10cqmin',
          width: rightWidth,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5cqmin',
          justifyContent: 'center',
        }}
      >
        {/* 文字スロット */}
        <div
          className="flex items-center justify-center"
          style={{ gap: '1cqmin', flexWrap: 'wrap' }}
        >
          {[...question.correctFamilyName].map((correctChar, i) => (
            <CharSlot
              key={`f-${i}`}
              value={filledChars[i] ?? null}
              isAnswered={isAnswered}
              isCorrectSlot={isAnswered && filledChars[i] === correctChar}
              correctValue={correctChar}
              isCurrent={!isAnswered && filledChars.length === i}
              size={slotSize}
              fontSize={slotFontSize}
            />
          ))}
          <div style={{ width: '2cqmin' }} />
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
                size={slotSize}
                fontSize={slotFontSize}
              />
            )
          })}
        </div>

        {/* 選択肢グリッド */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${isHard ? 7 : 5}, 1fr)`,
            gap: isHard ? '0.8cqmin' : '1.2cqmin',
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
    </div>
  )
}

// ─── 共通コンポーネント ─────────────────────────────

function FaceImage({ src, size, top, left }: { src: string; size: string; top: string; left: string }) {
  return (
    <img
      src={src}
      alt="誰でしょう？"
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '3cqmin',
        border: '0.4cqmin solid rgba(255,255,255,0.8)',
        boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.2)',
        zIndex: 2,
      }}
      draggable={false}
    />
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
  let bg = 'rgba(255,255,255,0.75)'
  let borderColor = 'rgba(180,140,160,0.6)'
  const textColor = '#333'

  if (isAnswered && value !== null) {
    if (isCorrectSlot) {
      borderColor = '#22c55e'
    } else {
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
        border: `0.4cqmin ${isAnswered ? 'solid' : 'dashed'} ${borderColor}`,
        background: bg,
        color: textColor,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 0.2cqmin 0.8cqmin rgba(0,0,0,0.1)',
      }}
    >
      {displayValue ?? (
        <span style={{ fontSize: '2.5cqmin', opacity: 0.5 }}>{label}</span>
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
  size = 7,
  fontSize = 3.5,
}: {
  value: string | null
  isAnswered: boolean
  isCorrectSlot: boolean
  correctValue: string
  isCurrent: boolean
  size?: number
  fontSize?: number
}) {
  let bg = 'rgba(255,255,255,0.75)'
  let borderColor = isCurrent ? 'rgba(59,130,246,0.8)' : 'rgba(180,140,160,0.6)'

  if (isAnswered && value !== null) {
    if (isCorrectSlot) {
      borderColor = '#22c55e'
    } else {
      borderColor = '#ef4444'
    }
  }

  const displayValue = isAnswered ? (isCorrectSlot ? value : correctValue) : value

  return (
    <div
      className="flex items-center justify-center font-bold"
      style={{
        width: `${size}cqmin`,
        height: `${size}cqmin`,
        fontSize: `${fontSize}cqmin`,
        borderRadius: '1cqmin',
        border: `0.4cqmin ${value ? 'solid' : 'dashed'} ${borderColor}`,
        background: bg,
        color: '#333',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 0.2cqmin 0.8cqmin rgba(0,0,0,0.1)',
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
