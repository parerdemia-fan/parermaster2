import { useGameStore } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { getDisplayDifficulty } from '../utils/difficulty.ts'

const BASE = import.meta.env.BASE_URL
const ASSISTANT_IMAGE = `${BASE}data/images/kv/sq/25ME006.png`
const ASSISTANT_NAME = '灯野ぺけ。'

const TYPE_META: Record<string, { emoji: string; label: string; questionText: string; commentBefore: string }> = {
  'face-guess': { emoji: '👁️', label: '顔当て', questionText: 'この子はどれ？', commentBefore: 'この子の顔、わかる〜？' },
  'name-guess': { emoji: '🔍', label: '名前当て', questionText: 'この子の名前は？', commentBefore: 'この子の名前、わかる〜？' },
  'name-build': { emoji: '🔤', label: '名前を作ろう', questionText: 'この子の名前を作ろう！', commentBefore: 'この子の名前、作れる〜？' },
  'text-quiz': { emoji: '📝', label: '知識クイズ', questionText: '', commentBefore: 'どれだけ知ってる〜？' },
}

const COMMENT_CORRECT = 'すごい！正解だよ〜！'
const COMMENT_WRONG = 'あちゃ〜、残念！'

function renderStars(stars: number): string {
  const maxStars = 5
  const full = Math.floor(stars)
  const hasHalf = stars % 1 !== 0
  const empty = maxStars - full - (hasHalf ? 1 : 0)
  return '★'.repeat(full) + (hasHalf ? '☆' : '') + '☆'.repeat(empty)
}

interface QuizHeaderProps {
  isAnswered: boolean
  isCorrect: boolean
}

export function QuizHeader({ isAnswered, isCorrect }: QuizHeaderProps) {
  const currentIndex = useGameStore((s) => s.currentIndex)
  const questions = useGameStore((s) => s.questions)
  const difficulty = useSettingsStore((s) => s.difficulty)

  const current = questions[currentIndex]
  if (!current) return null

  const total = questions.length
  const meta = TYPE_META[current.typeId] ?? { emoji: '❓', label: '???', questionText: '', commentBefore: '' }
  const displayStars = getDisplayDifficulty(current.typeId, difficulty)
  const commentText = !isAnswered ? meta.commentBefore : isCorrect ? COMMENT_CORRECT : COMMENT_WRONG

  return (
    <>
      {/* ヘッダー（左寄せ、右上アシスタント領域を避ける） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '62%',
          zIndex: 10,
          padding: '1cqmin 2.5cqmin',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0 0 1.5cqmin 0',
          color: 'white',
        }}
      >
        {/* 1行目: 問題タイプラベル + 問題文 */}
        <div
          className="font-bold"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2cqmin',
            fontSize: '3cqmin',
            lineHeight: 1.3,
          }}
        >
          <span
            style={{
              fontSize: '2.4cqmin',
              padding: '0.2cqmin 1.2cqmin',
              background: 'linear-gradient(135deg, #d6336c 0%, #e8789e 100%)',
              borderRadius: '0.6cqmin',
              whiteSpace: 'nowrap',
              letterSpacing: '0.05em',
            }}
          >
            {meta.emoji} {meta.label}
          </span>
          {meta.questionText && (
            <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {meta.questionText}
            </span>
          )}
        </div>
        {/* 2行目: 難易度★ + 問題番号 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '2.2cqmin',
            marginTop: '0.3cqmin',
            opacity: 0.9,
          }}
        >
          <span style={{ letterSpacing: '0.1em' }}>
            {renderStars(displayStars)}
          </span>
          <span className="font-bold">
            {currentIndex + 1}/{total}
          </span>
        </div>
      </div>

      {/* アシスタント（右上） */}
      <div
        style={{
          position: 'absolute',
          top: '1cqmin',
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
              {commentText}
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
            src={ASSISTANT_IMAGE}
            alt={ASSISTANT_NAME}
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
            {ASSISTANT_NAME}
          </div>
        </div>
      </div>
    </>
  )
}
