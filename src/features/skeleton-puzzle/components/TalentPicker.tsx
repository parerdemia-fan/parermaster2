import { useMemo } from 'react'
import type { PuzzleData, PuzzleWord, Placements } from '../types.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import { getWordCells, buildUserGrid } from '../puzzleUtils.ts'

interface TalentPickerProps {
  puzzle: PuzzleData
  placements: Placements
  targetWord: PuzzleWord
  talents: Talent[]
  onSelect: (talentId: string) => void
  onClose: () => void
  onClear?: () => void
}

export function TalentPicker({ puzzle, placements, targetWord, talents, onSelect, onClose, onClear }: TalentPickerProps) {
  const puzzleTalents = useMemo(() => {
    const idSet = new Set(puzzle.words.filter((w) => w.talentId).map((w) => w.talentId!))
    return talents.filter((t) => idSet.has(t.id))
  }, [puzzle, talents])

  const placedTalentIds = useMemo(
    () => new Set(Object.values(placements)),
    [placements],
  )

  const talentWordMap = useMemo(() => {
    const map = new Map<string, { length: number }>()
    for (const w of puzzle.words) {
      if (w.talentId) map.set(w.talentId, { length: w.length })
    }
    return map
  }, [puzzle])

  // 選択中ワードの各マスに入っている文字（交差ワードから）
  const slotChars = useMemo(() => {
    const userGrid = buildUserGrid(puzzle, placements)
    const cells = getWordCells(targetWord)
    return cells.map(({ row, col }) => userGrid[row]?.[col] ?? null)
  }, [puzzle, placements, targetWord])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 20, background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90%',
          maxHeight: '85%',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '3cqmin',
          boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '2cqmin 3cqmin',
            borderBottom: '0.3cqmin solid rgba(232,120,158,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5cqmin' }}>
            {slotChars.map((char, i) => (
              <div
                key={i}
                className="font-bold"
                style={{
                  width: '4.5cqmin',
                  height: '4.5cqmin',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3cqmin',
                  border: `0.3cqmin solid ${char ? '#d6336c' : '#ccc'}`,
                  borderRadius: '0.5cqmin',
                  background: char ? 'rgba(232,120,158,0.12)' : 'rgba(255,255,255,0.8)',
                  color: '#d6336c',
                }}
              >
                {char}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5cqmin' }}>
            {onClear && (
              <button
                className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
                style={{
                  fontSize: '2.5cqmin',
                  padding: '0.8cqmin 2.5cqmin',
                  borderRadius: '5cqmin',
                  border: '0.3cqmin solid #f87171',
                  background: 'rgba(254,226,226,0.6)',
                  color: '#dc2626',
                }}
                onClick={onClear}
              >
                クリア
              </button>
            )}
            <button
              className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
              style={{
                fontSize: '2.5cqmin',
                padding: '0.8cqmin 2.5cqmin',
                borderRadius: '5cqmin',
                border: '0.3cqmin solid #e8789e',
                background: 'transparent',
                color: '#d6336c',
              }}
              onClick={onClose}
            >
              閉じる
            </button>
          </div>
        </div>

        {/* タレント一覧 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5cqmin',
            scrollbarWidth: 'none',
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1cqmin',
            }}
          >
            {puzzleTalents.map((talent) => {
              const isPlaced = placedTalentIds.has(talent.id)
              const lengthMatch = talentWordMap.get(talent.id)?.length === targetWord.length

              return (
                <button
                  key={talent.id}
                  className="relative w-full cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{
                    aspectRatio: '1 / 1',
                    padding: 0,
                    border: 'none',
                    background: 'none',
                    opacity: lengthMatch ? 1 : 0.25,
                    pointerEvents: lengthMatch ? 'auto' : 'none',
                  }}
                  onClick={() => onSelect(talent.id)}
                >
                  <img
                    src={getTalentImagePath(talent)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      borderRadius: '1cqmin',
                      boxShadow: isPlaced
                        ? '0 0 0 0.5cqmin #86efac'
                        : '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
                    }}
                    draggable={false}
                  />
                  {isPlaced && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        borderRadius: '1cqmin',
                        background: 'rgba(34,197,94,0.35)',
                        fontSize: '5cqmin',
                        color: 'white',
                        textShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.5)',
                      }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
