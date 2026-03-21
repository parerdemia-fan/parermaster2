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
  const { currentIndex, questions } = useGameStore()

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

      {/* アシスタント（右上、一体化カード） */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '2cqmin',
          zIndex: 10,
          display: 'flex',
          alignItems: 'stretch',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '0 0 1.5cqmin 1.5cqmin',
          border: '0.15cqmin solid rgba(0,0,0,0.06)',
          boxShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* テキスト部分 */}
        <div
          style={{
            padding: '1.5cqmin 2cqmin',
            fontSize: '2.2cqmin',
            color: '#444',
            lineHeight: 1.5,
            maxWidth: '20cqmin',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div>
            {!isAnswered
              ? COMMENT_BEFORE
              : isCorrect
                ? COMMENT_CORRECT
                : COMMENT_WRONG}
          </div>
          <div style={{ fontSize: '1.6cqmin', color: '#999', marginTop: '0.3cqmin' }}>
            {COMMENT_NAME}
          </div>
        </div>
        {/* 画像部分 */}
        <img
          src={COMMENT_IMAGE}
          alt={COMMENT_NAME}
          style={{
            width: '13cqmin',
            height: '13cqmin',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
          draggable={false}
        />
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
            bottom: '1cqmin',
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
                height: '10cqmin',
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
                  width: '8.5cqmin',
                  height: '8.5cqmin',
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
