import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import { CHOICE_PALETTES, NAME_GUESS_ZONES, generatePattern } from '../../../shared/utils/choiceStyle.ts'
import type { NameGuessQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL

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

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const talent = talents.find((t) => t.id === question.talentId)

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
          zIndex: 3,
        }}
      >
        {question.answers.map((answer, i) => {
          const answerTalent = answerTalents[i]
          const faceImagePath = answerTalent ? getTalentImagePath(answerTalent) : undefined

          const palette = CHOICE_PALETTES[i % CHOICE_PALETTES.length]
          const patternSvg = generatePattern(palette.motif, palette.motifFill, i * 1000 + currentIndex * 7, NAME_GUESS_ZONES)
          let bg = `url("data:image/svg+xml,${patternSvg}") center / 100% auto no-repeat, ${palette.gradient}`
          let borderColor = 'rgba(255,255,255,0.7)'
          let color = '#333'
          let opacity = 1
          let boxShadow = `0 0.5cqmin 1.5cqmin ${palette.outerShadow}, inset 0 1cqmin 3cqmin ${palette.insetShadow}`
          let textShadow = '0 0.1cqmin 0.3cqmin rgba(0,0,0,0.15)'

          if (isAnswered) {
            if (i === question.correctIndex) {
              bg = 'linear-gradient(135deg, rgba(34,197,94,0.92), rgba(22,163,74,0.92))'
              borderColor = 'rgba(255,255,255,0.8)'
              color = 'white'
              boxShadow = '0 0.4cqmin 1.2cqmin rgba(22,163,74,0.4), inset 0 0.8cqmin 2cqmin rgba(0,80,30,0.2)'
              textShadow = '0 1px 3px rgba(0,0,0,0.3)'
            } else if (i === selected) {
              bg = 'linear-gradient(135deg, rgba(239,68,68,0.92), rgba(220,38,38,0.92))'
              borderColor = 'rgba(255,255,255,0.8)'
              color = 'white'
              boxShadow = '0 0.4cqmin 1.2cqmin rgba(220,38,38,0.4), inset 0 0.8cqmin 2cqmin rgba(100,0,0,0.2)'
              textShadow = '0 1px 3px rgba(0,0,0,0.3)'
            } else {
              opacity = 0.4
            }
          }

          return (
            <button
              key={i}
              className="font-bold transition active:scale-98"
              style={{
                position: 'relative',
                height: '13cqmin',
                fontSize: answer.length <= 8 ? '5cqmin'
                  : answer.length <= 9 ? '4.5cqmin'
                  : '3.8cqmin',
                padding: 0,
                borderRadius: '2cqmin',
                border: `0.5cqmin solid ${borderColor}`,
                background: bg,
                color,
                opacity,
                cursor: isAnswered ? 'default' : 'pointer',
                boxShadow,
                textShadow,
                overflow: 'hidden',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              {/* 顔画像: absoluteでフロー外に配置 */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '13cqmin',
                  height: '100%',
                  overflow: 'hidden',
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
                  <span style={{ fontSize: '7cqmin', opacity: 0.25 }}>👤</span>
                )}
              </div>
              {/* テキスト: 画像幅の半分だけ左パディングを取り、視覚的な中央寄せ */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2cqmin 0 7cqmin',
                  pointerEvents: 'none',
                }}
              >
                {answer}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
