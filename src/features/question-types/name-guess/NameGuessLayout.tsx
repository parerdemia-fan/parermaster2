import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import type { NameGuessQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL
const COMMENT_IMAGE = `${BASE}data/images/kv/sq/25ME006.png`
const COMMENT_NAME = '灯野ぺけ。'
const COMMENT_BEFORE = 'この子の名前、わかる〜？'
const COMMENT_CORRECT = 'すごい！正解だよ〜！'
const COMMENT_WRONG = 'あちゃ〜、残念！'

const DORM_NAMES: Record<string, string> = {
  wa: 'バゥ寮',
  me: 'ミュゥ寮',
  co: 'クゥ寮',
  wh: 'ウィニー寮',
}

interface NameGuessLayoutProps {
  question: NameGuessQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function NameGuessLayout({
  question,
  isAnswered,
  onAnswer,
}: NameGuessLayoutProps) {
  return (
    <NameGuessLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

function NameGuessLayoutInner({
  question,
  isAnswered,
  onAnswer,
}: NameGuessLayoutProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const { talents } = useTalents()

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const isCorrect = selected !== null && selected === question.correctIndex
  const talent = talents.find((t) => t.id === question.talentId)

  const standingImagePath = talent
    ? talent.generation === 2
      ? `${BASE}data/images/face/${talent.id}.png`
      : `${BASE}data/images/kv/orig/${talent.id}.png`
    : question.talentImagePath

  const isStanding = talent ? talent.generation === 1 : false

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* ヘッダー: ラベル + 問題文 + コメント欄 */}
      <div
        className="flex items-center"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '0 2.5cqmin',
          gap: '1.5cqmin',
          zIndex: 10,
        }}
      >
        {/* シャープラベル */}
        <div
          className="font-bold"
          style={{
            fontSize: '3.2cqmin',
            padding: '1cqmin 3.5cqmin 1cqmin 2.5cqmin',
            background: 'linear-gradient(135deg, #d6336c 0%, #e8789e 100%)',
            color: 'white',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.5cqmin) 100%, 0 100%)',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          🔍 名前当て
        </div>
        {/* 問題文プレート */}
        <div
          className="font-bold"
          style={{
            fontSize: '3.8cqmin',
            padding: '0.8cqmin 4cqmin',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '1.2cqmin',
            color: '#333',
            boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.12)',
            border: '0.15cqmin solid rgba(0,0,0,0.06)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          この生徒の名前は？
        </div>
        <div style={{ flex: 1 }} />
        {/* コメント欄 */}
        <div
          className="flex items-center"
          style={{
            gap: '1.5cqmin',
            padding: '1.2cqmin 2.5cqmin',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1.5cqmin',
            border: '0.15cqmin solid rgba(0,0,0,0.06)',
            boxShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}
        >
          <div className="flex flex-col items-center" style={{ flexShrink: 0, gap: '0.2cqmin' }}>
            <img
              src={COMMENT_IMAGE}
              alt={COMMENT_NAME}
              style={{
                width: '7cqmin',
                height: '7cqmin',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '0.3cqmin solid #f49aba',
              }}
              draggable={false}
            />
            <span style={{ fontSize: '1.6cqmin', color: '#888' }}>{COMMENT_NAME}</span>
          </div>
          <span style={{ fontSize: '2.5cqmin', color: '#444', lineHeight: 1.4 }}>
            {!isAnswered
              ? COMMENT_BEFORE
              : isCorrect
                ? COMMENT_CORRECT
                : COMMENT_WRONG}
          </span>
        </div>
      </div>

      {/* 立ち絵（画面左寄り、大きく表示） */}
      <img
        src={standingImagePath}
        alt="誰でしょう？"
        style={{
          position: 'absolute',
          left: isStanding ? '8%' : '10%',
          top: isStanding ? '-2cqmin' : '10cqmin',
          height: isStanding ? '75cqmin' : '40cqmin',
          width: 'auto',
          objectFit: 'contain',
          zIndex: 2,
          filter: question.isSilhouette && !isAnswered
            ? SILHOUETTE_FILTER
            : undefined,
          transition: 'filter 0.3s',
          borderRadius: isStanding ? undefined : '3cqmin',
        }}
        draggable={false}
      />

      {/* プロフィール（左下、立ち絵に重なる） */}
      {talent && (
        <div
          style={{
            position: 'absolute',
            bottom: '1cqmin',
            left: '2cqmin',
            width: '38%',
            padding: '2cqmin 2.5cqmin',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1.5cqmin',
            border: '0.15cqmin solid rgba(0,0,0,0.06)',
            boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.1)',
            fontSize: '2.5cqmin',
            lineHeight: 1.7,
            color: '#444',
            zIndex: 3,
          }}
        >
          <div className="font-bold" style={{
            fontSize: '2.8cqmin',
            color: '#333',
            marginBottom: '0.5cqmin',
            borderBottom: '0.15cqmin solid rgba(0,0,0,0.1)',
            paddingBottom: '0.5cqmin',
          }}>
            生徒プロフィール
          </div>
          <div>所属寮：{DORM_NAMES[talent.dormitory] ?? talent.dormitory}</div>
          <div>誕生日：{talent.birthday}</div>
          <div>身長：{talent.height}cm</div>
          <div>血液型：{talent.bloodType}</div>
          {talent.hobbies.length > 0 && (
            <div>趣味：{talent.hobbies.join('、')}</div>
          )}
        </div>
      )}

      {/* 選択肢（右半分） */}
      <div
        className="flex flex-col justify-center"
        style={{
          position: 'absolute',
          top: '13cqmin',
          right: '2.5cqmin',
          bottom: '1cqmin',
          width: '48%',
          gap: '2cqmin',
        }}
      >
        {question.answers.map((answer, i) => {
          let bg = 'rgba(255,255,255,0.92)'
          let borderColor = 'rgba(180,180,180,0.5)'
          let color = '#333'
          let opacity = 1
          let shadow = '0 0.2cqmin 1cqmin rgba(0,0,0,0.06)'

          if (isAnswered) {
            if (i === question.correctIndex) {
              bg = 'rgba(34,197,94,0.92)'
              borderColor = '#16a34a'
              color = 'white'
              shadow = '0 0.3cqmin 1.2cqmin rgba(34,197,94,0.3)'
            } else if (i === selected) {
              bg = 'rgba(239,68,68,0.92)'
              borderColor = '#dc2626'
              color = 'white'
              shadow = '0 0.3cqmin 1.2cqmin rgba(239,68,68,0.3)'
            } else {
              opacity = 0.4
            }
          }

          return (
            <button
              key={i}
              className="font-bold transition active:scale-98"
              style={{
                height: '10cqmin',
                fontSize: '4cqmin',
                padding: '0 4cqmin',
                borderRadius: '2cqmin',
                border: `0.2cqmin solid ${borderColor}`,
                background: bg,
                color,
                opacity,
                cursor: isAnswered ? 'default' : 'pointer',
                textAlign: 'left',
                backdropFilter: 'blur(6px)',
                boxShadow: shadow,
                display: 'flex',
                alignItems: 'center',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              <span style={{ flex: 1 }}>{answer}</span>
              {isAnswered && i === question.correctIndex && (
                <span style={{ fontSize: '4cqmin' }}>✓</span>
              )}
              {isAnswered && i !== question.correctIndex && (
                <span style={{ fontSize: '3.5cqmin', opacity: 0.6 }}>✕</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
