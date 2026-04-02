import { useRef, useState, useCallback } from 'react'
import { useSettingsStore, type DormId, type Scope, type GameMode } from '../../stores/settingsStore.ts'
import { useGameStore } from '../../stores/gameStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import type { Talent } from '../../shared/types/talent.ts'
import { generateNameGuessQuestions } from '../../features/question-types/name-guess/generator.ts'
import { generateFaceGuessQuestions } from '../../features/question-types/face-guess/generator.ts'
import { generateNameBuildQuestions } from '../../features/question-types/name-build/generator.ts'
import { generateTextQuizQuestions, type QuizSegment } from '../../features/question-types/text-quiz/generator.ts'
import type { BaseQuestion } from '../../features/quiz/types.ts'
import { useQuestions } from '../../shared/hooks/useQuestions.ts'
import { shuffleArray } from '../../shared/utils/array.ts'
import { preloadQuestionImages } from '../../shared/utils/preloadImages.ts'
import { toSlotId } from '../../features/achievement/constants.ts'
import type { BadgeSlotId } from '../../features/achievement/types.ts'
import { playSound } from '../../shared/utils/sound.ts'

const BASE = import.meta.env.BASE_URL

const DORMS: ReadonlyArray<{ id: DormId; label: string; emblem: string }> = [
  { id: 'wa', label: 'バゥ', emblem: 'emblem_wa.webp' },
  { id: 'me', label: 'ミュゥ', emblem: 'emblem_me.webp' },
  { id: 'co', label: 'クゥ', emblem: 'emblem_co.webp' },
  { id: 'wh', label: 'ウィニー', emblem: 'emblem_wh.webp' },
]

export function SettingScreen() {
  const {
    modeCategory, generation, gameMode, scope, difficulty, playerName,
    goToTitle, goToQuiz, goToLearning, setGameMode, setScope, setDifficulty, setPlayerName,
  } = useSettingsStore()
  const startQuiz = useGameStore((s) => s.startQuiz)
  const { talents, loading: talentsLoading } = useTalents()
  const { questions: questionPool, answerSets, loading: questionsLoading } = useQuestions()
  const loading = talentsLoading || questionsLoading

  const isDormMode = modeCategory === 'dorm'
  const genLabel = isDormMode ? '寮別モード' : generation === 'gen2' ? '2期生' : '1期生'
  const accentColor = isDormMode ? '#5b8db8' : generation === 'gen2' ? '#e8789e' : '#6aaa80'
  const accentGradient = isDormMode
    ? 'linear-gradient(180deg, #b8d4e8 0%, #7aabc4 40%, #5b8db8 100%)'
    : generation === 'gen2'
      ? 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)'
      : 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)'

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false)

  const handleNameChange = (name: string) => {
    setPlayerName(name)
    setIsNameDialogOpen(false)
  }

  const isDifficulty3Unlocked = useBadgeStore((s) => s.isDifficulty3Unlocked)

  const isLearning = gameMode === 'learning'
  const isFaceName = gameMode === 'face-name'
  // おぼえようモードでは難易度不要。知識クイズの難易度は1期生のみ
  const showDifficulty = !isLearning && (isFaceName || generation === 'gen1')

  // ★★★解放判定: 該当スロットのシルバーバッジ獲得で解放
  const difficulty3Unlocked = isDifficulty3Unlocked(toSlotId(gameMode, modeCategory, scope))

  // 設定変更後、新条件で★★★が未解放なら難易度を下げる
  const downgradeDifficultyIfLocked = (slotId: BadgeSlotId) => {
    if (difficulty === 3 && !isDifficulty3Unlocked(slotId)) {
      setDifficulty(2)
    }
  }
  const handleScopeChange = (newScope: Scope) => {
    setScope(newScope)
    downgradeDifficultyIfLocked(toSlotId(gameMode, modeCategory, newScope))
  }
  const handleGameModeChange = (newMode: GameMode) => {
    setGameMode(newMode)
    downgradeDifficultyIfLocked(toSlotId(newMode, modeCategory, scope))
  }

  const handleStart = useCallback(async () => {
    if (loading || talents.length === 0 || isPreloading) return

    // おぼえようモード → Learning画面へ直接遷移
    if (gameMode === 'learning') {
      goToLearning()
      return
    }

    const gen = generation === 'gen2' ? 2 : 1
    let questions: BaseQuestion[]

    if (!isDormMode && gameMode === 'knowledge') {
      // 知識クイズモード（世代別のみ）
      const pool = questionPool.filter(
        (q) => q.generation === 0 || q.generation === gen,
      )
      if (pool.length === 0) return

      let segments: QuizSegment[]
      if (gen === 2) {
        // 2期生: テキストクイズ1を順番に10問
        segments = [{ level: 1, count: 10, ordered: true }]
      } else if (difficulty === 1) {
        // 1期生ふつう: TQ1順番10問 → TQ2ランダム10問 → TQ3ランダム5問
        segments = [
          { level: 1, count: 10, ordered: true },
          { level: 2, count: 10, ordered: false },
          { level: 3, count: 5, ordered: false },
        ]
      } else if (difficulty === 2) {
        // 1期生むずかしい: TQ3ランダム10問 → TQ4ランダム15問 → TQ5ランダム5問
        segments = [
          { level: 3, count: 10, ordered: false },
          { level: 4, count: 15, ordered: false },
          { level: 5, count: 5, ordered: false },
        ]
      } else {
        // 1期生激ムズ: TQ5ランダム10問 → TQ6ランダム15問 → TQ7ランダム5問
        segments = [
          { level: 5, count: 10, ordered: false },
          { level: 6, count: 15, ordered: false },
          { level: 7, count: 5, ordered: false },
        ]
      }

      questions = generateTextQuizQuestions(pool, segments, difficulty, talents, answerSets)
    } else {
      // 顔名前当てモード
      const filtered = isDormMode
        ? talents.filter((t) => t.dormitory === scope)  // 寮別: 1期+2期混合
        : talents.filter((t) => t.generation === gen)    // 世代別: 全員固定

      if (filtered.length < 4) return

      const pool = filtered
      const generationPool = difficulty === 3
        ? (isDormMode ? talents.filter((t) => t.dormitory === scope) : talents.filter((t) => t.generation === gen))
        : undefined
      const shuffled = shuffleArray(filtered)
      const typeGenerators = [
        { generate: (t: Talent[], p: Talent[], d: typeof difficulty) => generateFaceGuessQuestions(t, p, d, generationPool) },
        { generate: generateNameGuessQuestions },
        { generate: generateNameBuildQuestions },
      ]
      const totalTypes = typeGenerators.length
      const baseCount = Math.floor(shuffled.length / totalTypes)
      const remainder = shuffled.length % totalTypes

      questions = []
      let offset = 0
      for (let i = 0; i < totalTypes; i++) {
        const count = baseCount + (i < remainder ? 1 : 0)
        const slice = shuffled.slice(offset, offset + count)
        offset += count
        questions.push(...typeGenerators[i].generate(slice, pool, difficulty))
      }
    }

    // 1問目の画像プリロードを待ってから遷移（残りはバックグラウンドで継続）
    setIsPreloading(true)
    const { firstReady } = preloadQuestionImages(questions, talents)
    await firstReady

    startQuiz(questions)
    goToQuiz()
    setIsPreloading(false)
  }, [loading, talents, isPreloading, generation, isDormMode, gameMode, questionPool, difficulty, answerSets, scope, startQuiz, goToQuiz, goToLearning])

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* ヘッダー: 戻るボタン + 世代名 */}
      <div
        className="w-full flex items-center"
        style={{ padding: '2cqmin 3cqmin 0' }}
      >
        <button
          className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
          style={{
            fontSize: '4cqmin',
            padding: '1cqmin 2cqmin',
            borderRadius: '2cqmin',
            border: 'none',
            background: 'rgba(255,255,255,0.6)',
            color: '#555',
          }}
          onClick={() => { playSound('tap'); goToTitle() }}
        >
          ◀ 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            marginLeft: '3cqmin',
            color: accentColor,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {genLabel}
        </span>
      </div>

      {/* メインパネル */}
      <div
        className="flex flex-col items-center"
        style={{
          marginTop: '2cqmin',
          width: '88%',
          maxHeight: '82%',
          padding: '3cqmin 4cqmin',
          borderRadius: '3cqmin',
          backgroundColor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
          overflowY: 'auto',
        }}
      >
        {/* ── 寮 ──（寮別モードのみ） */}
        {isDormMode && (
          <>
            <SectionHeading label="寮" first />
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: '2cqmin' }}
            >
              {DORMS.map((dorm) => (
                <DormButton
                  key={dorm.id}
                  label={dorm.label}
                  emblem={dorm.emblem}
                  selected={scope === dorm.id}
                  accentColor={accentColor}
                  onClick={() => handleScopeChange(dorm.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── ゲーム ── */}
        <SectionHeading label="ゲーム" first={!isDormMode} />
        <div className="flex items-center justify-center" style={{ gap: isDormMode ? '3cqmin' : '2cqmin' }}>
          <PillButton
            label="おぼえよう"
            selected={gameMode === 'learning'}
            accentColor={accentColor}
            size={isDormMode ? undefined : 'small'}
            onClick={() => handleGameModeChange('learning')}
          />
          <PillButton
            label="顔名前当て"
            selected={gameMode === 'face-name'}
            accentColor={accentColor}
            size={isDormMode ? undefined : 'small'}
            onClick={() => handleGameModeChange('face-name')}
          />
          {!isDormMode && (
            <PillButton
              label="知識クイズ"
              selected={gameMode === 'knowledge'}
              accentColor={accentColor}
              size="small"
              onClick={() => handleGameModeChange('knowledge')}
            />
          )}
        </div>

        {/* ── 難易度 ── */}
        {showDifficulty && (
          <>
            <SectionHeading label="難易度" />
            <div className="flex items-center justify-center" style={{ gap: '2cqmin' }}>
              <PillButton label="ふつう" selected={difficulty === 1} accentColor={accentColor} size="small" onClick={() => setDifficulty(1)} />
              <PillButton label="むずかしい" selected={difficulty === 2} accentColor={accentColor} size="small" onClick={() => setDifficulty(2)} />
              <PillButton
                label={difficulty3Unlocked ? '激ムズ' : '🔒 激ムズ'}
                selected={difficulty === 3}
                accentColor={accentColor}
                size="small"
                locked={!difficulty3Unlocked}
                onClick={difficulty3Unlocked ? () => setDifficulty(3) : undefined}
              />
            </div>
          </>
        )}

        {/* スタートボタン */}
        <button
          className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
          style={{
            marginTop: '4.5cqmin',
            width: '40cqmin',
            height: '9cqmin',
            fontSize: '4.5cqmin',
            borderRadius: '5cqmin',
            border: '0.3cqmin solid rgba(255,255,255,0.5)',
            background: accentGradient,
            color: 'white',
            boxShadow:
              'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            opacity: loading || isPreloading ? 0.5 : 1,
          }}
          disabled={loading || isPreloading}
          onClick={() => { playSound('tap'); handleStart() }}
        >
          {loading ? '読み込み中...' : isPreloading ? '準備中...' : 'スタート！'}
        </button>

        {/* プレイヤー名 */}
        <div
          className="flex items-center justify-center"
          style={{
            marginTop: '2cqmin',
            fontSize: '3cqmin',
            color: '#666',
            gap: '1.5cqmin',
          }}
        >
          <span>あなたの名前:</span>
          <span className="font-bold" style={{ color: '#333' }}>{playerName}</span>
          <button
            className="cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '2.5cqmin',
              padding: '0.5cqmin 1.5cqmin',
              borderRadius: '1.5cqmin',
              border: '1px solid #ccc',
              background: 'white',
              color: '#888',
            }}
            onClick={() => setIsNameDialogOpen(true)}
          >
            変更
          </button>
        </div>
      </div>

      {/* 名前変更ダイアログ */}
      {isNameDialogOpen && (
        <NameDialog
          currentName={playerName}
          accentColor={accentColor}
          onConfirm={handleNameChange}
          onCancel={() => setIsNameDialogOpen(false)}
        />
      )}
    </div>
  )
}

/* ─── サブコンポーネント ─── */

function SectionHeading({ label, first = false }: { label: string; first?: boolean }) {
  return (
    <div
      className="w-full flex items-center"
      style={{
        margin: first ? '0.5cqmin 0 2.5cqmin' : '3.5cqmin 0 2.5cqmin',
        gap: '2cqmin',
      }}
    >
      <div style={{ flex: 1, height: '1px', background: '#ccc' }} />
      <span
        style={{
          fontSize: '3cqmin',
          color: '#555',
          whiteSpace: 'nowrap',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
    </div>
  )
}

function PillButton({
  label,
  selected,
  accentColor,
  size = 'normal',
  locked = false,
  onClick,
}: {
  label: string
  selected: boolean
  accentColor: string
  size?: 'normal' | 'small'
  locked?: boolean
  onClick?: () => void
}) {
  const isSmall = size === 'small'
  const height = isSmall ? '7cqmin' : '9cqmin'
  const fontSize = isSmall ? '3.2cqmin' : '4cqmin'

  return (
    <button
      className="font-bold transition"
      style={{
        height,
        fontSize,
        padding: isSmall ? '0 2.5cqmin' : '0 3.5cqmin',
        borderRadius: '5cqmin',
        border: selected
          ? `0.3cqmin solid ${accentColor}`
          : '0.3cqmin solid #ddd',
        background: locked
          ? '#e0e0e0'
          : selected
            ? accentColor
            : 'white',
        color: locked
          ? '#aaa'
          : selected
            ? 'white'
            : '#666',
        cursor: locked ? 'not-allowed' : onClick ? 'pointer' : 'default',
        boxShadow: selected
          ? '0 0.2cqmin 0.6cqmin rgba(0,0,0,0.12)'
          : 'none',
        opacity: locked ? 0.7 : 1,
      }}
      disabled={locked}
      onClick={() => { if (onClick) { playSound('tap'); onClick() } }}
    >
      {label}
    </button>
  )
}

function DormButton({
  label,
  emblem,
  selected,
  accentColor,
  onClick,
}: {
  label: string
  emblem: string
  selected: boolean
  accentColor: string
  onClick: () => void
}) {
  return (
    <button
      className="font-bold flex items-center transition"
      style={{
        height: '7cqmin',
        fontSize: '3.2cqmin',
        padding: '0 2.5cqmin',
        borderRadius: '5cqmin',
        border: selected
          ? `0.3cqmin solid ${accentColor}`
          : '0.3cqmin solid #ddd',
        background: selected ? accentColor : 'white',
        color: selected ? 'white' : '#666',
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0.2cqmin 0.6cqmin rgba(0,0,0,0.12)'
          : 'none',
        gap: '1cqmin',
      }}
      onClick={onClick}
    >
      <img
        src={`${BASE}data/images/ui/${emblem}`}
        alt={`${label}寮紋章`}
        style={{ height: '3.5cqmin', width: 'auto' }}
        draggable={false}
      />
      {label}
    </button>
  )
}

/* ─── 名前変更ダイアログ ─── */

/** 全角=2、半角=1 として文字幅を計算 */
function getStringWidth(s: string): number {
  let width = 0
  for (const ch of s) {
    // ASCII範囲（半角英数記号）は1、それ以外（全角）は2
    width += ch.charCodeAt(0) <= 0x7e ? 1 : 2
  }
  return width
}

const MAX_NAME_WIDTH = 20 // 全角10文字 = 半角20文字

function NameDialog({
  currentName,
  accentColor,
  onConfirm,
  onCancel,
}: {
  currentName: string
  accentColor: string
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  const trimmed = value.trim()
  const currentWidth = getStringWidth(trimmed)
  const canConfirm = trimmed.length > 0 && currentWidth <= MAX_NAME_WIDTH

  const handleConfirm = () => {
    if (canConfirm) onConfirm(trimmed)
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50 }}
      onClick={onCancel}
    >
      <div
        className="flex flex-col items-center"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '3cqmin',
          padding: '4cqmin 5cqmin',
          boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.2)',
          minWidth: '50cqmin',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="font-bold"
          style={{ fontSize: '4cqmin', color: '#333', marginBottom: '3cqmin' }}
        >
          名前を入力
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          autoFocus
          onChange={(e) => {
            const v = e.target.value
            if (getStringWidth(v.trim()) <= MAX_NAME_WIDTH) setValue(v)
          }}
          className="font-bold"
          style={{
            fontSize: '4cqmin',
            padding: '1.5cqmin 2cqmin',
            borderRadius: '2cqmin',
            border: '0.3cqmin solid #ccc',
            outline: 'none',
            textAlign: 'center',
            width: '40cqmin',
          }}
        />
        <span
          style={{
            fontSize: '2.5cqmin',
            color: '#999',
            marginTop: '1cqmin',
          }}
        >
          {currentWidth} / {MAX_NAME_WIDTH}
        </span>
        <div
          className="flex items-center justify-center"
          style={{ gap: '3cqmin', marginTop: '3cqmin' }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3.5cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid #ddd',
              background: 'white',
              color: '#666',
            }}
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            className="font-bold transition"
            style={{
              fontSize: '3.5cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: canConfirm ? accentColor : '#ccc',
              color: 'white',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            決定
          </button>
        </div>
      </div>
    </div>
  )
}
