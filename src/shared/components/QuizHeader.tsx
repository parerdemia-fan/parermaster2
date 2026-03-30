import { useMemo, useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../hooks/useTalents.ts'
import { getTalentImagePath } from '../utils/talent.ts'
import { getDisplayDifficulty } from '../utils/difficulty.ts'
import { formatTime } from '../../features/time-attack/constants.ts'

const TYPE_META: Record<string, { emoji: string; label: string; questionText: string; commentBefore: string }> = {
  'face-guess': { emoji: '📸', label: '顔当て', questionText: 'この子はどれ？', commentBefore: 'この子の顔、わかる〜？' },
  'name-guess': { emoji: '✏️', label: '名前当て', questionText: 'この子の名前は？', commentBefore: 'この子の名前、わかる〜？' },
  'name-build': { emoji: '🧩', label: '名前を作ろう', questionText: 'この子の名前を作ろう！', commentBefore: 'この子の名前、作れる〜？' },
  'text-quiz': { emoji: '💡', label: '知識クイズ', questionText: 'クイズに挑戦！', commentBefore: 'どれだけ知ってる〜？' },
  'blur': { emoji: '🌫️', label: 'ぼかし', questionText: 'この子は誰？', commentBefore: 'だんだん見えてくるよ〜' },
  'spotlight': { emoji: '🔦', label: 'スポットライト', questionText: 'この子は誰？', commentBefore: 'よーく見て〜！' },
  'word-search': { emoji: '🔍', label: '名前はどこ？', questionText: '名前を探そう！', commentBefore: 'どこにあるかな〜？' },
}

const COMMENT_CORRECT = 'すごい！正解だよ〜！'
const COMMENT_WRONG = 'あちゃ〜、残念！'

/** ★を0.5刻みで描画（半星対応） */
function StarRating({ stars }: { stars: number }) {
  const maxStars = 5
  const elements: React.ReactNode[] = []
  for (let i = 1; i <= maxStars; i++) {
    if (stars >= i) {
      // 塗りつぶし
      elements.push(<span key={i} style={{ color: '#fbbf24' }}>★</span>)
    } else if (stars >= i - 0.5) {
      // 半星: 左半分が塗り、右半分が空
      elements.push(
        <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>★</span>
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              overflow: 'hidden',
              width: '50%',
              color: '#fbbf24',
            }}
          >
            ★
          </span>
        </span>,
      )
    } else {
      // 空
      elements.push(<span key={i} style={{ color: 'rgba(255,255,255,0.4)' }}>★</span>)
    }
  }
  return <>{elements}</>
}

function ProgressRing({ current, total, progress, style }: { current: number; total: number; progress: number; style?: React.CSSProperties }) {
  const size = 48
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress / 100)

  return (
    <div style={{ width: '10cqmin', height: '10cqmin', position: 'relative', flexShrink: 0, ...style }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(200,200,200,0.5)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s' }}
        />
      </svg>
      <span
        className="font-bold"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.2cqmin',
          color: 'white',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {current}/{total}
      </span>
    </div>
  )
}

interface QuizHeaderProps {
  isAnswered: boolean
  isCorrect: boolean
}

export function QuizHeader({ isAnswered, isCorrect }: QuizHeaderProps) {
  const currentIndex = useGameStore((s) => s.currentIndex)
  const questions = useGameStore((s) => s.questions)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const isTimeAttack = useSettingsStore((s) => s.isTimeAttack)
  const { talents } = useTalents()
  const current = questions[currentIndex]

  // 1問ごとにランダムな1期生をアシスタントとして選出（選択肢のタレントを除外）
  const assistant = useMemo(() => {
    const gen1 = talents.filter((t) => t.generation === 1)
    if (gen1.length === 0) return null
    const q = questions[currentIndex]
    const excludeIds = new Set<string>()
    if (q) {
      if ('talentId' in q) excludeIds.add(q.talentId as string)
      if ('answerTalentIds' in q) (q.answerTalentIds as string[])?.forEach((id) => excludeIds.add(id))
    }
    const candidates = excludeIds.size > 0 ? gen1.filter((t) => !excludeIds.has(t.id)) : gen1
    const pool = candidates.length > 0 ? candidates : gen1
    const picked = pool[Math.floor(Math.random() * pool.length)]
    return { name: picked.nickname || picked.name, image: getTalentImagePath(picked) }
  }, [talents, currentIndex, questions]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null

  const total = questions.length
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
  const meta = TYPE_META[current.typeId] ?? { emoji: '❓', label: '???', questionText: '', commentBefore: '' }
  const displayStars = current.displayStars ?? getDisplayDifficulty(current.typeId, difficulty)
  const commentText = !isAnswered ? meta.commentBefore : isCorrect ? COMMENT_CORRECT : COMMENT_WRONG
  const assistantName = assistant?.name ?? ''
  const assistantImage = assistant?.image ?? ''

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
      }}
    >
      {/* ヘッダー本体 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          height: '14cqmin',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          color: 'white',
        }}
      >
        {/* 左側: 問題タイプラベル + ★（左上縦並び） */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div
            className="font-bold"
            style={{
              fontSize: '3cqmin',
              padding: '0.8cqmin 3.5cqmin 0.8cqmin 2.5cqmin',
              background: 'linear-gradient(135deg, #d6336c 0%, #e8789e 100%)',
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.5cqmin) 100%, 0 100%)',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}
          >
            {meta.emoji} {meta.label}
          </div>
          <span style={{ fontSize: '3cqmin', letterSpacing: '0.05em', marginLeft: '2.5cqmin', marginTop: '0.3cqmin' }}>
            <StarRating stars={displayStars} />
          </span>
        </div>

        {/* 中央: 問題文（上下中央）。問題文がない場合もスペーサーとして確保 */}
        <div
          className="font-bold"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '5.5cqmin',
            marginLeft: '4cqmin',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          {meta.questionText}
        </div>

        {/* 右側: タイマー + プログレスリング + アシスタント */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: '1cqmin' }}>
          {isTimeAttack && <TimerDisplay />}
          <ProgressRing current={currentIndex + 1} total={total} progress={progress} style={{ alignSelf: 'center' }} />
          <div style={{ position: 'relative' }}>
            {/* 名前ラベル（セリフ左上、半分重なる） */}
            <div
              style={{
                position: 'absolute',
                top: '-1.2cqmin',
                left: '0.5cqmin',
                zIndex: 2,
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
              {assistantName}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                height: '10cqmin',
                borderRadius: '1.5cqmin 0 0 0',
                overflow: 'hidden',
                border: '0.3cqmin double rgba(255,255,255,0.3)',
                borderRight: 'none',
                borderBottom: 'none',
                boxShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.12)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  padding: '2.5cqmin 1cqmin 1.5cqmin 1.2cqmin',
                  fontSize: '1.9cqmin',
                  color: '#444',
                  lineHeight: 1.5,
                  maxWidth: '18cqmin',
                  background: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {commentText}
                <div
                  style={{
                    position: 'absolute',
                    top: '40%',
                    right: '-1.1cqmin',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '1.2cqmin solid transparent',
                    borderBottom: '1.2cqmin solid transparent',
                    borderLeft: '1.2cqmin solid rgba(255,255,255,0.85)',
                  }}
                />
              </div>
              <div
                style={{
                  width: '13cqmin',
                  flexShrink: 0,
                  background: 'rgba(255, 225, 200, 0.5)',
                }}
              />
            </div>
            <img
              src={assistantImage}
              alt={assistantName}
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
        </div>

      </div>
    </div>
  )
}

function TimerDisplay() {
  const getElapsedMs = useGameStore((s) => s.getElapsedMs)
  const timerStartedAt = useGameStore((s) => s.timerStartedAt)
  const [displayMs, setDisplayMs] = useState(0)

  useEffect(() => {
    if (timerStartedAt == null) {
      // paused — show final value
      setDisplayMs(getElapsedMs())
      return
    }
    // running — update every 100ms
    const id = setInterval(() => setDisplayMs(getElapsedMs()), 100)
    return () => clearInterval(id)
  }, [timerStartedAt, getElapsedMs])

  return (
    <div
      className="font-bold"
      style={{
        alignSelf: 'center',
        fontSize: '3.5cqmin',
        color: '#ffd700',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        marginRight: '0.5cqmin',
      }}
    >
      {formatTime(displayMs)}
    </div>
  )
}
