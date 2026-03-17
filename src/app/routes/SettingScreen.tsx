import { useRef, useState } from 'react'
import { useSettingsStore, type DormId } from '../../stores/settingsStore.ts'
import { useGameStore } from '../../stores/gameStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { generateNameGuessQuestions } from '../../features/question-types/name-guess/generator.ts'

const BASE = import.meta.env.BASE_URL

const DORMS: ReadonlyArray<{ id: DormId; label: string; emblem: string }> = [
  { id: 'wa', label: 'バゥ', emblem: 'emblem_wa.webp' },
  { id: 'me', label: 'ミュゥ', emblem: 'emblem_me.webp' },
  { id: 'co', label: 'クゥ', emblem: 'emblem_co.webp' },
  { id: 'wh', label: 'ウィニー', emblem: 'emblem_wh.webp' },
]

export function SettingScreen() {
  const {
    generation, gameMode, scope, difficulty, playerName,
    goToTitle, goToQuiz, setGameMode, setScope, setDifficulty, setPlayerName,
  } = useSettingsStore()
  const startQuiz = useGameStore((s) => s.startQuiz)
  const { talents, loading } = useTalents()

  const genLabel = generation === 'gen2' ? '2期生' : '1期生'
  const accentColor = generation === 'gen2' ? '#e8789e' : '#6aaa80'
  const accentGradient =
    generation === 'gen2'
      ? 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)'
      : 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)'

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)

  const handleNameChange = (name: string) => {
    setPlayerName(name)
    setIsNameDialogOpen(false)
  }

  // 知識クイズでは出題範囲・問題タイプを表示しない
  const isFaceName = gameMode === 'face-name'
  // 知識クイズの難易度は1期生のみ
  const showDifficulty = isFaceName || generation === 'gen1'

  const handleStart = () => {
    if (loading || talents.length === 0) return

    const gen = generation === 'gen2' ? 2 : 1
    const filtered = scope === 'all'
      ? talents.filter((t) => t.generation === gen)
      : talents.filter((t) => t.generation === gen && t.dormitory === scope)

    if (filtered.length < 4) return

    // 同世代全員を選択肢プールとして使う
    const pool = talents.filter((t) => t.generation === gen)
    const questions = generateNameGuessQuestions(filtered, pool)

    startQuiz(questions)
    goToQuiz()
  }

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
          onClick={goToTitle}
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
        {/* ── ゲーム ── */}
        <SectionHeading label="ゲーム" first />
        <div className="flex items-center justify-center" style={{ gap: '3cqmin' }}>
          <PillButton
            label="顔名前当て"
            selected={isFaceName}
            accentColor={accentColor}
            onClick={() => setGameMode('face-name')}
          />
          <PillButton
            label="知識クイズ"
            selected={!isFaceName}
            accentColor={accentColor}
            onClick={() => setGameMode('knowledge')}
          />
        </div>

        {/* ── 出題範囲 ──（顔名前当てのみ） */}
        {isFaceName && (
          <>
            <SectionHeading label="出題範囲" />
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
                  onClick={() => setScope(dorm.id)}
                />
              ))}
              <PillButton label="全員" selected={scope === 'all'} accentColor={accentColor} size="small" onClick={() => setScope('all')} />
            </div>
          </>
        )}

        {/* ── 難易度 ── */}
        {showDifficulty && (
          <>
            <SectionHeading label="難易度" />
            <div className="flex items-center justify-center" style={{ gap: '2cqmin' }}>
              <PillButton label="★☆☆" selected={difficulty === 1} accentColor={accentColor} size="small" onClick={() => setDifficulty(1)} />
              <PillButton label="★★☆" selected={difficulty === 2} accentColor={accentColor} size="small" onClick={() => setDifficulty(2)} />
              <PillButton label="🔒 ★★★" selected={difficulty === 3} accentColor={accentColor} size="small" locked />
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
            opacity: loading ? 0.5 : 1,
          }}
          disabled={loading}
          onClick={handleStart}
        >
          {loading ? '読み込み中...' : 'スタート！'}
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
      onClick={onClick}
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

const MAX_NAME_LENGTH = 15

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
  const canConfirm = trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH

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
          maxLength={MAX_NAME_LENGTH}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm()
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
          {trimmed.length} / {MAX_NAME_LENGTH}
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
