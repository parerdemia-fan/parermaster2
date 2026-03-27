import { useState } from 'react'
import type { WordSearchQuestion } from './types.ts'

interface WordSearchLayoutProps {
  question: WordSearchQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function WordSearchLayout({ question, isAnswered, onAnswer }: WordSearchLayoutProps) {
  return (
    <WordSearchLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

function WordSearchLayoutInner({ question, isAnswered, onAnswer }: WordSearchLayoutProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  const answerSet = new Set(question.answerCells.map((c) => `${c.row},${c.col}`))

  const handleCellClick = (row: number, col: number) => {
    if (isAnswered) return
    setSelectedCell({ row, col })
    const isCorrect = answerSet.has(`${row},${col}`)
    onAnswer(isCorrect)
  }

  const rows = question.grid.length
  const cols = question.grid[0].length

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* QuizHeader分のスペーサー + 指示テキスト */}
      <div
        className="font-bold text-center"
        style={{
          fontSize: '5cqmin',
          color: '#ffe066',
          textShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.7)',
          paddingTop: '15cqmin',
          paddingBottom: '0.5cqmin',
        }}
      >
        「{question.talentName}」を探せ！
      </div>

      {/* グリッド */}
      <div
        style={{
          borderRadius: '1.5cqmin',
          overflow: 'hidden',
          padding: '1.5cqmin 2cqmin',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          border: '0.2cqmin solid rgba(255,255,255,0.15)',
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 3.3cqmin)`,
          justifyContent: 'center',
          gridTemplateRows: `repeat(${rows}, 3.5cqmin)`,
          userSelect: 'none',
        }}
      >
        {question.grid.flatMap((row, r) =>
          row.map((char, c) => {
            const key = `${r},${c}`
            const isAnswer = answerSet.has(key)
            const isSelected = selectedCell?.row === r && selectedCell?.col === c

            let bg = 'transparent'
            let color = 'rgba(255,255,255,0.9)'
            let fontWeight: string | undefined

            if (isAnswered && isAnswer) {
              bg = 'rgba(34,197,94,0.75)'
              color = 'white'
              fontWeight = 'bold'
            } else if (isAnswered && isSelected && !isAnswer) {
              bg = 'rgba(239,68,68,0.75)'
              color = 'white'
            }

            return (
              <button
                key={key}
                className="transition-colors hover:bg-white/15"
                style={{
                  fontSize: '3.3cqmin',
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  background: bg,
                  color,
                  fontWeight,
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  minHeight: 0,
                }}
                disabled={isAnswered}
                onClick={() => handleCellClick(r, c)}
              >
                {char}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
