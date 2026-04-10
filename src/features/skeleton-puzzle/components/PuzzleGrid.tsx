import { useMemo, useState, useRef, useCallback } from 'react'
import type { PuzzleData, Placements, SelectedSlot } from '../types.ts'
import { getWordCells, buildUserGrid, findConflicts } from '../puzzleUtils.ts'
import { NUMBERED_LABELS } from '../constants.ts'
import { useScreenMode } from '../../../shared/hooks/useScreenMode.ts'

interface PuzzleGridProps {
  puzzle: PuzzleData
  placements: Placements
  selectedSlot: SelectedSlot | null
  onSelectSlot: (slot: SelectedSlot | null) => void
}

const MIN_SCALE = 1
const MAX_SCALE = 3

export function PuzzleGrid({ puzzle, placements, selectedSlot, onSelectSlot }: PuzzleGridProps) {
  const [directionPicker, setDirectionPicker] = useState<{
    row: number
    col: number
    words: { wordId: number; direction: 'across' | 'down' }[]
  } | null>(null)

  const userGrid = useMemo(() => buildUserGrid(puzzle, placements), [puzzle, placements])
  const conflicts = useMemo(() => findConflicts(puzzle, placements), [puzzle, placements])

  // セル→所属ワードのマッピング
  const cellToWords = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const word of puzzle.words) {
      const cells = getWordCells(word)
      for (const cell of cells) {
        const key = `${cell.row},${cell.col}`
        const existing = map.get(key)
        if (existing) existing.push(word.wordId)
        else map.set(key, [word.wordId])
      }
    }
    return map
  }, [puzzle])

  // 縦ワードのみに属するセル（長音符の縦表示判定用）
  const downOnlyCells = useMemo(() => {
    const downSet = new Set<string>()
    const acrossSet = new Set<string>()
    for (const word of puzzle.words) {
      const cells = getWordCells(word)
      const target = word.direction === 'down' ? downSet : acrossSet
      for (const cell of cells) target.add(`${cell.row},${cell.col}`)
    }
    const result = new Set<string>()
    for (const key of downSet) {
      if (!acrossSet.has(key)) result.add(key)
    }
    return result
  }, [puzzle])

  // 選択中ワードのセルセット
  const selectedCells = useMemo(() => {
    if (!selectedSlot) return new Set<string>()
    const cells = getWordCells(selectedSlot.word)
    return new Set(cells.map((c) => `${c.row},${c.col}`))
  }, [selectedSlot])

  // 番号付きセルのマッピング
  const numberedCellMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of puzzle.numberedCells) {
      map.set(`${cell.row},${cell.col}`, cell.order)
    }
    return map
  }, [puzzle])

  // 初期開示ワードのセルセット
  const revealedCells = useMemo(() => {
    const set = new Set<string>()
    for (const wordId of puzzle.initialRevealedWordIds) {
      const word = puzzle.words.find((w) => w.wordId === wordId)
      if (word) {
        for (const cell of getWordCells(word)) {
          set.add(`${cell.row},${cell.col}`)
        }
      }
    }
    return set
  }, [puzzle])

  // 配置済みワードのセルセット
  const placedCells = useMemo(() => {
    const set = new Set<string>()
    for (const word of puzzle.words) {
      if (placements[word.wordId] || puzzle.initialRevealedWordIds.includes(word.wordId)) {
        for (const cell of getWordCells(word)) {
          set.add(`${cell.row},${cell.col}`)
        }
      }
    }
    return set
  }, [puzzle, placements])

  const handleCellClick = (row: number, col: number) => {
    if (directionPicker) {
      setDirectionPicker(null)
      return
    }

    const key = `${row},${col}`
    const wordIds = cellToWords.get(key)
    if (!wordIds || wordIds.length === 0) return

    const selectableWordIds = wordIds.filter(
      (id) => !puzzle.initialRevealedWordIds.includes(id),
    )
    if (selectableWordIds.length === 0) return

    if (selectableWordIds.length === 1) {
      const word = puzzle.words.find((w) => w.wordId === selectableWordIds[0])!
      onSelectSlot({ word })
    } else {
      setDirectionPicker({
        row,
        col,
        words: selectableWordIds.map((id) => {
          const w = puzzle.words.find((w) => w.wordId === id)!
          return { wordId: w.wordId, direction: w.direction }
        }),
      })
    }
  }

  const handleDirectionSelect = (wordId: number) => {
    const word = puzzle.words.find((w) => w.wordId === wordId)!
    onSelectSlot({ word })
    setDirectionPicker(null)
  }

  // ---------- ズーム/パン ----------
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(1)
  const txRef = useRef(0)
  const tyRef = useRef(0)
  const screenMode = useScreenMode()
  const portrait = screenMode !== 'landscape'
  const [zoomed, setZoomed] = useState(false)

  const touchStateRef = useRef<{
    type: 'none' | 'pan' | 'pinch'
    startDist: number
    startScale: number
    startX: number
    startY: number
    startTx: number
    startTy: number
    moved: boolean
  }>({ type: 'none', startDist: 0, startScale: 1, startX: 0, startY: 0, startTx: 0, startTy: 0, moved: false })

  const applyTransform = useCallback(() => {
    if (!gridRef.current) return
    gridRef.current.style.transform = `translate(${txRef.current}px, ${tyRef.current}px) scale(${scaleRef.current})`
  }, [])

  const clampTranslation = useCallback(() => {
    const container = containerRef.current
    const grid = gridRef.current
    if (!container || !grid) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const gw = grid.scrollWidth * scaleRef.current
    const gh = grid.scrollHeight * scaleRef.current
    // グリッドが拡大時にコンテナ外にはみ出さないように制限
    if (gw <= cw) {
      txRef.current = 0
    } else {
      const maxTx = (gw - cw) / 2
      txRef.current = Math.max(-maxTx, Math.min(maxTx, txRef.current))
    }
    if (gh <= ch) {
      tyRef.current = 0
    } else {
      const maxTy = (gh - ch) / 2
      tyRef.current = Math.max(-maxTy, Math.min(maxTy, tyRef.current))
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!portrait) return
    const ts = touchStateRef.current
    if (e.touches.length === 2) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      ts.type = 'pinch'
      ts.startDist = Math.sqrt(dx * dx + dy * dy)
      ts.startScale = scaleRef.current
      ts.startX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      ts.startY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      ts.startTx = txRef.current
      ts.startTy = tyRef.current
      ts.moved = true
    } else if (e.touches.length === 1 && scaleRef.current > 1) {
      ts.type = 'pan'
      ts.startX = e.touches[0].clientX
      ts.startY = e.touches[0].clientY
      ts.startTx = txRef.current
      ts.startTy = tyRef.current
      ts.moved = false
    }
  }, [portrait])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!portrait) return
    const ts = touchStateRef.current
    if (ts.type === 'pinch' && e.touches.length === 2) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, ts.startScale * (dist / ts.startDist)))
      scaleRef.current = newScale
      // ピンチ中心に向かってパン
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      txRef.current = ts.startTx + (cx - ts.startX)
      tyRef.current = ts.startTy + (cy - ts.startY)
      clampTranslation()
      applyTransform()
    } else if (ts.type === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - ts.startX
      const dy = e.touches[0].clientY - ts.startY
      if (!ts.moved && Math.abs(dx) + Math.abs(dy) > 8) {
        ts.moved = true
      }
      if (ts.moved) {
        e.preventDefault()
        txRef.current = ts.startTx + dx
        tyRef.current = ts.startTy + dy
        clampTranslation()
        applyTransform()
      }
    }
  }, [portrait, clampTranslation, applyTransform])

  const handleTouchEnd = useCallback(() => {
    const ts = touchStateRef.current
    if (scaleRef.current <= 1.05) {
      scaleRef.current = 1
      txRef.current = 0
      tyRef.current = 0
      applyTransform()
    }
    setZoomed(scaleRef.current > 1)
    ts.type = 'none'
  }, [applyTransform])

  const resetZoom = useCallback(() => {
    scaleRef.current = 1
    txRef.current = 0
    tyRef.current = 0
    applyTransform()
    setZoomed(false)
  }, [applyTransform])

  const frameBorder = 0.3
  const framePad = 0.6
  const lineW = 0.3
  const frameTotal = (frameBorder + framePad + lineW) * 2
  const totalGapW = (puzzle.cols - 1) * lineW
  const totalGapH = (puzzle.rows - 1) * lineW
  const availW = 130 - frameTotal - totalGapW
  const availH = 82 - frameTotal - totalGapH
  const cellSize = Math.min(availW / puzzle.cols, availH / puzzle.rows, 8)
  const fontSize = cellSize * 0.9
  const numFontSize = cellSize * 0.4

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ flex: 1, width: '100%', overflow: 'hidden', touchAction: portrait ? 'none' : 'auto' }}
      onClick={() => { if (directionPicker) setDirectionPicker(null) }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 外枠（frame） */}
      <div
        ref={gridRef}
        style={{
          border: `${frameBorder}cqmin solid #aaa`,
          borderRadius: '1cqmin',
          padding: `${framePad + lineW}cqmin`,
          background: 'rgba(255,255,255,0.15)',
          transformOrigin: 'center center',
          willChange: portrait ? 'transform' : 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${puzzle.cols}, ${cellSize}cqmin)`,
            gridTemplateRows: `repeat(${puzzle.rows}, ${cellSize}cqmin)`,
            gap: `${lineW}cqmin`,
            userSelect: 'none',
          }}
        >
        {puzzle.grid.flatMap((row, r) =>
          row.map((correctChar, c) => {
            const key = `${r},${c}`
            const isBlack = correctChar === null
            const isRevealed = revealedCells.has(key)
            const isPlaced = placedCells.has(key)
            const isSelected = selectedCells.has(key)
            const isConflict = conflicts.has(key)
            const numberLabel = numberedCellMap.get(key)
            const displayChar = userGrid[r]?.[c] ?? null

            let bg = 'rgba(255,255,255,0.92)'
            let color = '#333'
            let borderColor = '#aaa'

            if (isBlack) {
              bg = 'transparent'
            } else if (isSelected) {
              bg = 'rgba(147,197,253,0.85)'
              borderColor = '#3b82f6'
            } else if (isConflict) {
              bg = 'rgba(252,165,165,0.8)'
              borderColor = '#ef4444'
            } else if (isRevealed) {
              bg = 'rgba(253,230,138,0.85)'
              borderColor = '#ca8a04'
            } else if (isPlaced) {
              bg = 'rgba(187,247,208,0.85)'
              borderColor = '#22c55e'
            }

            return (
              <button
                key={key}
                style={{
                  fontSize: `${fontSize}cqmin`,
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  outline: isBlack ? 'none' : `${lineW}cqmin solid ${borderColor}`,
                  background: bg,
                  color,
                  cursor: isBlack ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  fontWeight: isRevealed ? 'bold' : 'normal',
                  minWidth: 0,
                  minHeight: 0,
                }}
                disabled={isBlack}
                onClick={(e) => {
                  if (touchStateRef.current.moved) return
                  e.stopPropagation()
                  if (!isBlack) handleCellClick(r, c)
                }}
              >
                {!isBlack && displayChar && (
                  <span style={displayChar === 'ー' && downOnlyCells.has(key) ? { transform: 'rotate(90deg)' } : undefined}>
                    {displayChar}
                  </span>
                )}
                {numberLabel !== undefined && (
                  <span
                    className="font-bold"
                    style={{
                      position: 'absolute',
                      top: `${-numFontSize * 0.35}cqmin`,
                      left: `${-numFontSize * 0.35}cqmin`,
                      fontSize: `${numFontSize}cqmin`,
                      color: '#e11d48',
                      textShadow: '0 0 0.3cqmin rgba(255,255,255,0.9), 0 0 0.6cqmin rgba(255,255,255,0.7)',
                      lineHeight: 1,
                      zIndex: 2,
                    }}
                  >
                    {NUMBERED_LABELS[numberLabel - 1] ?? numberLabel}
                  </span>
                )}
              </button>
            )
          }),
        )}
        </div>
      </div>

      {/* ズームリセットボタン */}
      {zoomed && (
        <button
          className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
          style={{
            position: 'absolute',
            bottom: '1.5cqmin',
            right: '1.5cqmin',
            fontSize: '2.5cqmin',
            padding: '0.8cqmin 2cqmin',
            borderRadius: '5cqmin',
            border: '0.3cqmin solid #e8789e',
            background: 'rgba(255,255,255,0.85)',
            color: '#d6336c',
            zIndex: 5,
          }}
          onClick={resetZoom}
        >
          ズームリセット
        </button>
      )}

      {/* 方向選択ポップアップ */}
      {directionPicker && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '3cqmin',
            padding: '2.5cqmin 3cqmin',
            boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.2)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5cqmin',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-bold" style={{ fontSize: '3cqmin', color: '#d6336c', textAlign: 'center' }}>
            方向を選択
          </div>
          {directionPicker.words.map((w) => (
            <button
              key={w.wordId}
              className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
              style={{
                fontSize: '3.5cqmin',
                padding: '1.5cqmin 4cqmin',
                borderRadius: '5cqmin',
                border: '0.3cqmin solid #e8789e',
                background: 'rgba(255,255,255,0.7)',
                color: '#d6336c',
              }}
              onClick={() => handleDirectionSelect(w.wordId)}
            >
              {w.direction === 'across' ? '→ よこ' : '↓ たて'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
