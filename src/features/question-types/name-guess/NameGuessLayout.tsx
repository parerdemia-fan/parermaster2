import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import type { NameGuessQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL
const COMMENT_IMAGE = `${BASE}data/images/kv/sq/25ME006.png`
const COMMENT_NAME = '灯野ぺけ。'
const COMMENT_BEFORE = 'この子の名前、わかる〜？'
const COMMENT_CORRECT = 'すごい！正解だよ〜！'
const COMMENT_WRONG = 'あちゃ〜、残念！'

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
  const currentIndex = useGameStore((s) => s.currentIndex)
  const questions = useGameStore((s) => s.questions)

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const isCorrect = selected !== null && selected === question.correctIndex
  const talent = talents.find((t) => t.id === question.talentId)
  const total = questions.length
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  const standingImagePath = talent
    ? talent.generation === 2
      ? `${BASE}data/images/face/${talent.id}.png`
      : `${BASE}data/images/kv/orig/${talent.id}.png`
    : question.talentImagePath

  const isStanding = talent ? talent.generation === 1 : false

  // 選択肢のタレント画像パス
  const answerTalents = question.answerTalentIds.map((id) => talents.find((t) => t.id === id))

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* 最上部左: シャープラベル */}
      <div
        className="font-bold"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          fontSize: '3.2cqmin',
          padding: '1cqmin 3.5cqmin 1cqmin 2.5cqmin',
          background: 'linear-gradient(135deg, #d6336c 0%, #e8789e 100%)',
          color: 'white',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 1.5cqmin) 100%, 0 100%)',
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        🔍 名前当て
      </div>

      {/* 最上部中央: 問題文 */}
      <div
        className="font-bold"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: '3.8cqmin',
          padding: '0.8cqmin 5cqmin',
          background: 'rgba(255,255,255,0.92)',
          borderRadius: '0 0 1.2cqmin 1.2cqmin',
          color: '#333',
          boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.12)',
          border: '0.15cqmin solid rgba(0,0,0,0.06)',
          whiteSpace: 'nowrap',
        }}
      >
        この生徒の名前は？
        {isAnswered && (
          <span
            style={{
              marginLeft: '2cqmin',
              color: isCorrect ? '#22c55e' : '#ef4444',
            }}
          >
            {isCorrect ? '正解！' : '不正解..'}
          </span>
        )}
      </div>

      {/* 進捗バー（中央） */}
      <div
        style={{
          position: 'absolute',
          top: '9cqmin',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30%',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.3cqmin' }}>
          <span style={{
            fontSize: '2.2cqmin',
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 6px rgba(0,0,0,0.2)',
            fontWeight: 'bold',
          }}>
            達成度: {currentIndex + 1}/{total}
          </span>
        </div>
        <div
          style={{
            height: '1.5cqmin',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '1cqmin',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #4ade80, #22c55e)',
              borderRadius: '1cqmin',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* アシスタント（右上） */}
      <div
        style={{
          position: 'absolute',
          top: '5cqmin',
          right: '2cqmin',
          zIndex: 10,
        }}
      >
        {/* カード + はみ出し画像の基準 */}
        <div style={{ position: 'relative' }}>
          {/* 角丸長方形カード（テキスト左 + 画像背景右） */}
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
            {/* テキスト部分（白背景 + 吹き出し尖り） */}
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
              {!isAnswered
                ? COMMENT_BEFORE
                : isCorrect
                  ? COMMENT_CORRECT
                  : COMMENT_WRONG}
              {/* 吹き出しの尖り（右向き三角） */}
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
            {/* 画像背景部分（薄暖色） */}
            <div
              style={{
                width: '13cqmin',
                flexShrink: 0,
                background: 'rgba(255, 225, 200, 0.6)',
              }}
            />
          </div>
          {/* タレント画像（上にはみ出し、下はカード下辺で見切れ） */}
          <img
            src={COMMENT_IMAGE}
            alt={COMMENT_NAME}
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
        {/* タレント名ラベル（下辺に重なるオレンジ角丸ラベル） */}
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
            {COMMENT_NAME}
          </div>
        </div>
      </div>

      {/* 立ち絵（大きく表示、下ははみ出し） */}
      <img
        src={standingImagePath}
        alt="誰でしょう？"
        style={{
          position: 'absolute',
          left: isStanding ? '-2%' : '3%',
          top: isStanding ? '0cqmin' : '5cqmin',
          height: isStanding ? '150cqmin' : '75cqmin',
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

      {/* プロフィール（左、立ち絵の腰あたりに重なる） */}
      {talent && (
        <div
          style={{
            position: 'absolute',
            bottom: '12cqmin',
            left: '10cqmin',
            width: '34%',
            padding: '1.5cqmin 2.5cqmin',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1.5cqmin',
            border: '0.15cqmin solid rgba(0,0,0,0.06)',
            boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.1)',
            fontSize: '2.3cqmin',
            lineHeight: 1.6,
            color: '#444',
            zIndex: 3,
            maxHeight: '28cqmin',
            overflowY: 'auto',
            scrollbarWidth: 'none' as const,
          }}
        >
          {talent.dream && <div>夢：{talent.dream}</div>}
          {talent.hobbies.length > 0 && (
            <div>趣味：{talent.hobbies.join('、')}</div>
          )}
          {talent.favorites.length > 0 && (
            <div>好き：{talent.favorites.join('、')}</div>
          )}
          {talent.skills.length > 0 && (
            <div>特技：{talent.skills.join('、')}</div>
          )}
        </div>
      )}

      {/* 選択肢（右半分） */}
      <div
        className="flex flex-col justify-center"
        style={{
          position: 'absolute',
          top: '12cqmin',
          right: '2.5cqmin',
          bottom: '2cqmin',
          width: '48%',
          gap: '2cqmin',
        }}
      >
        {question.answers.map((answer, i) => {
          const answerTalent = answerTalents[i]
          const faceImagePath = answerTalent ? getTalentImagePath(answerTalent) : undefined

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
                height: '13cqmin',
                fontSize: '3.8cqmin',
                padding: '0 3cqmin',
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
                gap: '2cqmin',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              {/* 顔画像: 回答前はシルエット、回答後は実画像 */}
              <div
                style={{
                  width: '11cqmin',
                  height: '11cqmin',
                  borderRadius: '1.2cqmin',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isAnswered ? 'transparent' : 'rgba(0,0,0,0.06)',
                }}
              >
                {isAnswered && faceImagePath ? (
                  <img
                    src={faceImagePath}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    draggable={false}
                  />
                ) : (
                  <span style={{ fontSize: '4cqmin', opacity: 0.25 }}>👤</span>
                )}
              </div>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{answer}</span>
              {isAnswered && i === question.correctIndex && (
                <span style={{ fontSize: '4cqmin', flexShrink: 0 }}>✓</span>
              )}
              {isAnswered && i !== question.correctIndex && (
                <span style={{ fontSize: '3.5cqmin', opacity: 0.6, flexShrink: 0 }}>✕</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
