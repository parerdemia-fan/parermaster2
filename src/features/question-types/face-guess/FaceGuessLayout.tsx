import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { CHOICE_PALETTES, FACE_GUESS_ZONES, generatePattern } from '../../../shared/utils/choiceStyle.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import type { FaceGuessQuestion } from './types.ts'

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

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  const talent = talents.find((t) => t.id === question.talentId)

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* 左側: タレント名 + プロフィールヒント（一体パネル） */}
      <div
        style={{
          position: 'absolute',
          top: '17cqmin',
          left: '1cqmin',
          bottom: '9cqmin',
          width: '45%',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1.5cqmin',
          overflow: 'hidden',
        }}
      >
        {/* 読み仮名 + タレント名 */}
        <div
          style={{
            flexShrink: 0,
            textAlign: 'center',
            padding: '2cqmin 1cqmin 1cqmin',
          }}
        >
          {question.talentKana && !/^[ァ-ヴー・\s]+$/.test(question.talentName) && (
            <div
              style={{
                fontSize: '3.2cqmin',
                color: 'rgba(255,255,255,0.75)',
                letterSpacing: '0.05em',
                marginBottom: '-1.2cqmin',
              }}
            >
              {question.talentKana}
            </div>
          )}
          <div
            className="font-bold"
            style={{
              fontSize: question.talentName.length > 10 ? '5cqmin' : question.talentName.length > 8 ? '6cqmin' : '8cqmin',
              color: 'white',
              textShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}
          >
            {question.talentName}
          </div>
        </div>

        {/* プロフィールヒント */}
        {talent && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '0 2.5cqmin 2cqmin',
              fontSize: '2.8cqmin',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.92)',
              overflowY: 'auto',
              scrollbarWidth: 'none' as const,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '2cqmin',
            }}
          >
            {talent.dream && (
              <ProfileItem emoji="💫" label="夢" text={talent.dream} />
            )}
            {talent.hobbies.length > 0 && (
              <ProfileItem emoji="🎮" label="趣味" text={talent.hobbies.join('、')} />
            )}
            {talent.skills.length > 0 && (
              <ProfileItem emoji="🎤" label="特技" text={talent.skills.join('、')} />
            )}
            {talent.favorites.length > 0 && (
              <ProfileItem emoji="❤️" label="好きなもの" text={talent.favorites.join('、')} />
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
          bottom: '12cqmin',
          width: '48%',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '2cqmin',
        }}
      >
        {question.answerImages.map((imagePath, i) => {
          const palette = CHOICE_PALETTES[i % CHOICE_PALETTES.length]
          const patternSvg = generatePattern(palette.motif, palette.motifFill, i * 1000 + currentIndex * 7, FACE_GUESS_ZONES, { w: 100, h: 100 })
          let borderColor = 'rgba(255,255,255,0.7)'
          let opacity = 1
          let boxShadow = `0 0.5cqmin 1.5cqmin ${palette.outerShadow}, inset 0 1cqmin 3cqmin ${palette.insetShadow}`
          let bg = `url("data:image/svg+xml,${patternSvg}") center / 100% 100% no-repeat, ${palette.gradient}`

          if (isAnswered) {
            if (i === question.correctIndex) {
              borderColor = '#16a34a'
              boxShadow = `0 0.5cqmin 1.5cqmin rgba(22,163,74,0.5), inset 0 1cqmin 3cqmin rgba(0,80,30,0.2)`
            } else if (i === selected) {
              borderColor = '#dc2626'
              boxShadow = `0 0.5cqmin 1.5cqmin rgba(220,38,38,0.5), inset 0 1cqmin 3cqmin rgba(100,0,0,0.2)`
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
                border: `0.5cqmin solid ${borderColor}`,
                borderRadius: '2cqmin',
                background: bg,
                cursor: isAnswered ? 'default' : 'pointer',
                opacity,
                boxShadow,
                overflow: 'visible',
                position: 'relative',
              }}
              disabled={isAnswered}
              onClick={() => handleSelect(i)}
            >
              <img
                src={imagePath}
                alt={isAnswered ? question.answerNames[i] : '選択肢'}
                style={{
                  width: '100%',
                  height: 'calc(100% + 1.5cqmin)',
                  margin: '-1.5cqmin 0 0',
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
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '5cqmin',
                    fontSize: question.answerNames[i].length <= 6 ? '3.5cqmin'
                      : question.answerNames[i].length <= 8 ? '3cqmin'
                      : '2.5cqmin',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: i === question.correctIndex
                      ? 'rgba(34,197,94,0.85)'
                      : i === selected
                        ? 'rgba(239,68,68,0.85)'
                        : 'rgba(0,0,0,0.5)',
                    color: 'white',
                    whiteSpace: 'nowrap',
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

function ProfileItem({ emoji, label, text }: { emoji: string; label: string; text: string }) {
  return (
    <div>
      <div className="font-bold" style={{ fontSize: '3.6cqmin' }}>
        {emoji} {label}
      </div>
      <div style={{ marginLeft: '2cqmin' }}>
        {text}
      </div>
    </div>
  )
}
