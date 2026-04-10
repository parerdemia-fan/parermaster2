import { useEffect, useState, useCallback } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useSkeletonStore } from '../../features/skeleton-puzzle/useSkeletonStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { PuzzleGrid } from '../../features/skeleton-puzzle/components/PuzzleGrid.tsx'
import { TalentPicker } from '../../features/skeleton-puzzle/components/TalentPicker.tsx'
import { HiddenMessageBar } from '../../features/skeleton-puzzle/components/HiddenMessageBar.tsx'
import { PUZZLE_VARIANTS } from '../../features/skeleton-puzzle/constants.ts'
import { getMessageProgress, isPuzzleComplete } from '../../features/skeleton-puzzle/puzzleUtils.ts'
import type { PuzzleData, PuzzleVariant, SelectedSlot } from '../../features/skeleton-puzzle/types.ts'

const BASE = import.meta.env.BASE_URL

export function SkeletonScreen() {
  const goToAbout = useSettingsStore((s) => s.goToAbout)
  const { talents } = useTalents()

  const currentVariant = useSkeletonStore((s) => s.currentVariant)
  const selectVariant = useSkeletonStore((s) => s.selectVariant)
  const clearVariant = useSkeletonStore((s) => s.clearVariant)
  const placeWord = useSkeletonStore((s) => s.placeWord)
  const resetProgress = useSkeletonStore((s) => s.resetProgress)
  const getProgress = useSkeletonStore((s) => s.getProgress)
  const markMessageCompleted = useSkeletonStore((s) => s.markMessageCompleted)
  const markPuzzleCompleted = useSkeletonStore((s) => s.markPuzzleCompleted)

  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [messageJustCompleted, setMessageJustCompleted] = useState(false)
  const [puzzleJustCompleted, setPuzzleJustCompleted] = useState(false)

  const loadPuzzle = useCallback(async (variant: PuzzleVariant) => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}data/puzzles/${variant}.json`)
      const data: PuzzleData = await res.json()
      setPuzzleData(data)
      selectVariant(variant)
    } catch (e) {
      console.error('Failed to load puzzle:', e)
    } finally {
      setLoading(false)
    }
  }, [selectVariant])

  useEffect(() => {
    if (currentVariant) {
      loadPuzzle(currentVariant)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = currentVariant ? getProgress(currentVariant) : null
  const placements = progress?.placements ?? {}

  const handleTalentSelect = (talentId: string) => {
    if (!currentVariant || !puzzleData || !selectedSlot) return

    placeWord(currentVariant, selectedSlot.word.wordId, talentId)
    setSelectedSlot(null)

    const nextPlacements = { ...placements, [selectedSlot.word.wordId]: talentId }

    if (!progress?.messageCompleted) {
      const { complete } = getMessageProgress(puzzleData, nextPlacements)
      if (complete) {
        markMessageCompleted(currentVariant)
        setMessageJustCompleted(true)
      }
    }

    if (!progress?.puzzleCompleted && isPuzzleComplete(puzzleData, nextPlacements)) {
      markPuzzleCompleted(currentVariant)
      setPuzzleJustCompleted(true)
    }
  }

  const handleReset = () => {
    if (!currentVariant) return
    resetProgress(currentVariant)
    setShowResetConfirm(false)
    setMessageJustCompleted(false)
    setPuzzleJustCompleted(false)
  }

  // パズル選択画面
  if (!currentVariant || !puzzleData) {
    return (
      <div className="relative w-full h-full flex flex-col animate-fade-in">
        <ScreenHeader onBack={goToAbout} />
        {loading ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: '#888', fontSize: '4cqmin' }}>
            読み込み中...
          </div>
        ) : (
          <div
            className="flex-1 flex flex-col items-center justify-center"
            style={{ gap: '3cqmin', padding: '4cqmin' }}
          >
            <div className="font-bold" style={{ fontSize: '4.5cqmin', color: '#555', marginBottom: '2cqmin' }}>
              パズルを選択
            </div>
            {PUZZLE_VARIANTS.map(({ variant, label, ready }) => (
              <button
                key={variant}
                className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
                style={{
                  width: '60%',
                  maxWidth: '50cqmin',
                  padding: '2.5cqmin 4cqmin',
                  fontSize: '4cqmin',
                  borderRadius: '5cqmin',
                  border: ready ? '0.3cqmin solid #e8789e' : '0.3cqmin solid #d1d5db',
                  background: ready ? 'rgba(255,255,255,0.7)' : 'rgba(243,244,246,0.5)',
                  color: ready ? '#d6336c' : '#aaa',
                  pointerEvents: ready ? 'auto' : 'none',
                }}
                onClick={() => loadPuzzle(variant)}
              >
                {label}{!ready && ' (準備中)'}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // パズルプレイ画面
  return (
    <div className="relative w-full h-full flex flex-col animate-fade-in">
      <ScreenHeader
        onBack={() => {
          setPuzzleData(null)
          clearVariant()
        }}
        title={PUZZLE_VARIANTS.find((v) => v.variant === currentVariant)?.label ?? ''}
        onReset={() => setShowResetConfirm(true)}
        progressLabel={`${Object.keys(placements).length}/${puzzleData.words.length - puzzleData.initialRevealedWordIds.length}`}
      />

      <PuzzleGrid
        puzzle={puzzleData}
        placements={placements}
        selectedSlot={selectedSlot}
        onSelectSlot={setSelectedSlot}
      />

      <HiddenMessageBar puzzle={puzzleData} placements={placements} />

      {selectedSlot && (
        <TalentPicker
          puzzle={puzzleData}
          placements={placements}
          targetWord={selectedSlot.word}
          talents={talents}
          onSelect={handleTalentSelect}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {showResetConfirm && (
        <ConfirmDialog
          message="進捗をリセットしますか？"
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {messageJustCompleted && !puzzleJustCompleted && (
        <ClearOverlay
          title="メッセージ完成！"
          message={puzzleData.hiddenMessage}
          sub="すべてのマスを埋めて完全クリアを目指そう！"
          onClose={() => setMessageJustCompleted(false)}
        />
      )}

      {puzzleJustCompleted && (
        <ClearOverlay
          title="完全クリア！"
          message={`全${puzzleData.words.length - puzzleData.initialRevealedWordIds.length}名を正しく配置しました！`}
          onClose={() => {
            setPuzzleJustCompleted(false)
            setMessageJustCompleted(false)
          }}
        />
      )}
    </div>
  )
}

// ---------- サブコンポーネント ----------

function ScreenHeader({
  onBack,
  title,
  onReset,
  progressLabel,
}: {
  onBack: () => void
  title?: string
  onReset?: () => void
  progressLabel?: string
}) {
  return (
    <div
      className="w-full flex items-center shrink-0"
      style={{ padding: '1cqmin 3cqmin 0' }}
    >
      <button
        className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
        style={{
          fontSize: '3.5cqmin',
          padding: '1cqmin 2cqmin',
          borderRadius: '2cqmin',
          border: 'none',
          background: 'rgba(255,255,255,0.6)',
          color: '#555',
        }}
        onClick={onBack}
      >
        ◀ 戻る
      </button>
      <span
        className="font-bold"
        style={{
          fontSize: '4cqmin',
          marginLeft: '2cqmin',
          color: '#555',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        スケルトン{title ? ` - ${title}` : ''}
      </span>

      {progressLabel && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '2.5cqmin',
            color: '#888',
            marginRight: '1cqmin',
          }}
        >
          {progressLabel}
        </span>
      )}

      {onReset && (
        <button
          className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
          style={{
            fontSize: '2.5cqmin',
            padding: '0.8cqmin 2cqmin',
            borderRadius: '5cqmin',
            border: '0.3cqmin solid #e8789e',
            background: 'transparent',
            color: '#d6336c',
          }}
          onClick={onReset}
        >
          リセット
        </button>
      )}
    </div>
  )
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 30, background: 'rgba(0,0,0,0.4)' }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderRadius: '3cqmin',
          padding: '4cqmin 5cqmin',
          boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.2)',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-bold" style={{ fontSize: '3.5cqmin', color: '#555', marginBottom: '3cqmin' }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: '2cqmin', justifyContent: 'center' }}>
          <button
            className="font-bold cursor-pointer transition active:scale-95"
            style={{
              fontSize: '3cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid #ef4444',
              background: 'rgba(254,226,226,0.8)',
              color: '#dc2626',
            }}
            onClick={onConfirm}
          >
            リセット
          </button>
          <button
            className="font-bold cursor-pointer transition active:scale-95"
            style={{
              fontSize: '3cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid #d1d5db',
              background: 'rgba(243,244,246,0.8)',
              color: '#666',
            }}
            onClick={onCancel}
          >
            やめる
          </button>
        </div>
      </div>
    </div>
  )
}

function ClearOverlay({
  title,
  message,
  sub,
  onClose,
}: {
  title: string
  message: string
  sub?: string
  onClose: () => void
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 30, background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(253,230,138,0.95), rgba(252,211,77,0.95))',
          borderRadius: '3cqmin',
          padding: '5cqmin 6cqmin',
          boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.2)',
          textAlign: 'center',
          maxWidth: '80%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-bold" style={{ fontSize: '5cqmin', color: '#92400e', marginBottom: '2cqmin' }}>
          {title}
        </div>
        <div className="font-bold" style={{ fontSize: '4cqmin', color: '#78350f', marginBottom: '2cqmin' }}>
          {message}
        </div>
        {sub && (
          <div style={{ fontSize: '2.5cqmin', color: '#a16207', marginBottom: '2cqmin' }}>
            {sub}
          </div>
        )}
        <button
          className="font-bold cursor-pointer transition active:scale-95"
          style={{
            fontSize: '3cqmin',
            padding: '1.5cqmin 5cqmin',
            borderRadius: '5cqmin',
            border: '0.3cqmin solid #d97706',
            background: 'rgba(255,255,255,0.7)',
            color: '#92400e',
          }}
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  )
}
