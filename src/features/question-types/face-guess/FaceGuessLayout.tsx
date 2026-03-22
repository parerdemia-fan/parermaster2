import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import type { FaceGuessQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL
const COMMENT_IMAGE = `${BASE}data/images/kv/sq/25ME006.png`
const COMMENT_NAME = '灯野ぺけ。'
const COMMENT_BEFORE = 'この子の顔、わかる〜？'
const COMMENT_CORRECT = 'すごい！正解だよ〜！'
const COMMENT_WRONG = 'あちゃ〜、残念！'

interface FaceGuessLayoutProps {
  question: FaceGuessQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean) => void
}

export function FaceGuessLayout({
  question,
  isAnswered,
  onAnswer,
}: FaceGuessLayoutProps) {
  return (
    <FaceGuessLayoutInner
      key={question.talentId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
    />
  )
}

function FaceGuessLayoutInner({
  question,
  isAnswered,
  onAnswer,
}: FaceGuessLayoutProps) {
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
        👁️ 顔当て
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
        この生徒はどれ？
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
              {!isAnswered
                ? COMMENT_BEFORE
                : isCorrect
                  ? COMMENT_CORRECT
                  : COMMENT_WRONG}
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

      {/* 左側: タレント名 + プロフィールヒント */}
      <div
        style={{
          position: 'absolute',
          top: '16cqmin',
          left: '3cqmin',
          bottom: '3cqmin',
          width: '42%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2cqmin',
          zIndex: 3,
        }}
      >
        {/* タレント名（大きく表示）+ 正誤表示 */}
        <div style={{ position: 'relative' }}>
          <div
            className="font-bold"
            style={{
              fontSize: question.talentName.length > 8 ? '6cqmin' : '8cqmin',
              color: 'white',
              textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              textAlign: 'center',
              padding: '1cqmin 0',
            }}
          >
            {question.talentName}
          </div>
          {isAnswered && (
            <div
              className="font-bold"
              style={{
                fontSize: '4cqmin',
                color: isCorrect ? '#22c55e' : '#ef4444',
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                textAlign: 'center',
              }}
            >
              {isCorrect ? '正解！' : '不正解..'}
            </div>
          )}
        </div>

        {/* プロフィールヒント */}
        {talent && (
          <div
            style={{
              padding: '1.5cqmin 2.5cqmin',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: '1.5cqmin',
              border: '0.15cqmin solid rgba(0,0,0,0.06)',
              boxShadow: '0 0.3cqmin 1.2cqmin rgba(0,0,0,0.1)',
              fontSize: '2.3cqmin',
              lineHeight: 1.6,
              color: '#444',
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
      </div>

      {/* 右側: 2x2 顔画像グリッド */}
      <div
        className="grid"
        style={{
          position: 'absolute',
          top: '16cqmin',
          right: '2.5cqmin',
          bottom: '10cqmin',
          width: '48%',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '2cqmin',
        }}
      >
        {question.answerImages.map((imagePath, i) => {
          let borderColor = 'rgba(180,180,180,0.5)'
          let opacity = 1
          let shadow = '0 0.2cqmin 1cqmin rgba(0,0,0,0.06)'
          let bg = 'rgba(255,255,255,0.92)'

          if (isAnswered) {
            if (i === question.correctIndex) {
              borderColor = '#16a34a'
              bg = 'rgba(34,197,94,0.92)'
              shadow = '0 0.3cqmin 1.2cqmin rgba(34,197,94,0.3)'
            } else if (i === selected) {
              borderColor = '#dc2626'
              bg = 'rgba(239,68,68,0.92)'
              shadow = '0 0.3cqmin 1.2cqmin rgba(239,68,68,0.3)'
            } else {
              opacity = 0.4
            }
          }

          return (
            <button
              key={i}
              className="transition active:scale-97"
              style={{
                padding: 0,
                border: `0.2cqmin solid ${borderColor}`,
                borderRadius: '2cqmin',
                background: bg,
                cursor: isAnswered ? 'default' : 'pointer',
                opacity,
                boxShadow: shadow,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              <img
                src={imagePath}
                alt={isAnswered ? question.answerNames[i] : '選択肢'}
                style={{
                  width: '100%',
                  flex: 1,
                  objectFit: 'cover',
                  display: 'block',
                  filter: question.isSilhouette && !isAnswered
                    ? SILHOUETTE_FILTER
                    : undefined,
                  transition: 'filter 0.3s',
                }}
                draggable={false}
              />
              {isAnswered && (
                <div
                  className="font-bold"
                  style={{
                    fontSize: '2.5cqmin',
                    padding: '0.5cqmin',
                    background: i === question.correctIndex
                      ? 'rgba(34,197,94,0.85)'
                      : i === selected
                        ? 'rgba(239,68,68,0.85)'
                        : 'rgba(0,0,0,0.5)',
                    color: 'white',
                    textAlign: 'center',
                  }}
                >
                  {question.answerNames[i]}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
