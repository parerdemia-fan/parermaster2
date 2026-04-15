import { useMemo } from 'react'
import type { PuzzleData, Placements } from '../types.ts'
import { getMessageProgress } from '../puzzleUtils.ts'
import { NUMBERED_LABELS } from '../constants.ts'

interface HiddenMessageBarProps {
  puzzle: PuzzleData
  placements: Placements
}

export function HiddenMessageBar({ puzzle, placements }: HiddenMessageBarProps) {
  const { chars, complete } = useMemo(
    () => getMessageProgress(puzzle, placements),
    [puzzle, placements],
  )

  if (puzzle.numberedCells.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.8cqmin',
        padding: '1.5cqmin 2cqmin',
        background: complete
          ? 'linear-gradient(135deg, rgba(253,230,138,0.8), rgba(252,211,77,0.8))'
          : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '3cqmin',
        margin: '0 2cqmin 0.5cqmin',
        transition: 'background 0.5s ease',
      }}
    >
      <span
        className="font-bold"
        style={{ fontSize: '2.5cqmin', color: '#888', marginRight: '1cqmin', whiteSpace: 'nowrap' }}
      >
        メッセージ
      </span>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="font-bold"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4cqmin',
            height: '4cqmin',
            fontSize: '2.8cqmin',
            borderRadius: '0.5cqmin',
            border: ch
              ? '0.2cqmin solid #86efac'
              : '0.2cqmin dashed #ccc',
            background: ch
              ? 'rgba(187,247,208,0.7)'
              : 'rgba(255,255,255,0.5)',
            color: ch ? '#166534' : '#aaa',
          }}
        >
          {ch ?? NUMBERED_LABELS[i]}
        </span>
      ))}
    </div>
  )
}
