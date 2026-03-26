import { useState } from 'react'
import type { Talent } from '../../../shared/types/talent.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import { parseTextWithTalentIcons } from '../../../shared/utils/talentIconParser.tsx'
import { CHOICE_PALETTES, NAME_GUESS_ZONES, generatePattern } from '../../../shared/utils/choiceStyle.ts'
import { useGameStore } from '../../../stores/gameStore.ts'
import type { TextQuizQuestion } from './types.ts'

const BASE = import.meta.env.BASE_URL

interface TextQuizLayoutProps {
  question: TextQuizQuestion
  isAnswered: boolean
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void
  /** 戻って閲覧する際の選択済みインデックス */
  restoredSelectedIndex?: number
}

export function TextQuizLayout({
  question,
  isAnswered,
  onAnswer,
  restoredSelectedIndex,
}: TextQuizLayoutProps) {
  return (
    <TextQuizLayoutInner
      key={question.questionId}
      question={question}
      isAnswered={isAnswered}
      onAnswer={onAnswer}
      restoredSelectedIndex={restoredSelectedIndex}
    />
  )
}

function TextQuizLayoutInner({
  question,
  isAnswered,
  onAnswer,
  restoredSelectedIndex,
}: TextQuizLayoutProps) {
  const [selected, setSelected] = useState<number | null>(restoredSelectedIndex ?? null)
  const { talents } = useTalents()

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    onAnswer(index === question.correctIndex, index)
  }

  // hideIcon=true かつ未回答 → アイコン非表示
  const showIconInQuestion = question.hideIcon ? isAnswered : true
  const hasComment = isAnswered && !!(question.comment || question.commentImage || question.sourceUrl)

  return (
    <div
      className="relative"
      style={{ flex: 1, width: '100%', overflow: 'hidden' }}
    >
      {/* 左側: 問題文 + 解説（一体パネル） */}
      <div
        style={{
          position: 'absolute',
          left: '2cqmin',
          width: '45%',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '2cqmin',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          overflowY: hasComment ? 'auto' : 'hidden',
          scrollbarWidth: 'none' as const,
          top: '45%',
          transform: 'translateY(-50%)',
          maxHeight: hasComment ? 'calc(75cqmin - 3cqmin)' : '50cqmin',
          transition: 'max-height 0.4s ease',
        }}
      >
        {/* 問題文 */}
        <div
          className="flex flex-col items-center"
          style={{
            flexShrink: 0,
            padding: '2.5cqmin 2.5cqmin',
            gap: '1.5cqmin',
            justifyContent: hasComment ? 'flex-start' : 'center',
          }}
        >
          <span
            className="font-bold text-center"
            style={{
              fontSize: '3.5cqmin',
              color: 'white',
              lineHeight: 1.5,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {parseTextWithTalentIcons(question.question, talents, showIconInQuestion)}
          </span>
          {question.questionImage && (
            <img
              src={`${BASE}data/images/questions/${question.questionImage}`}
              alt="問題画像"
              style={{
                maxWidth: '100%',
                maxHeight: '20cqmin',
                objectFit: 'contain',
                borderRadius: '1.5cqmin',
              }}
              draggable={false}
            />
          )}
        </div>

        {/* 解説（アニメーションで展開） */}
        {(question.comment || question.commentImage || question.sourceUrl) && (
          <div
            style={{
              maxHeight: hasComment ? '80cqmin' : '0',
              opacity: hasComment ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.5s ease, opacity 0.4s ease',
            }}
          >
            <div style={{ borderTop: '0.15cqmin solid rgba(255,255,255,0.2)', margin: '0 2cqmin' }} />
            <div
              className="flex flex-col"
              style={{
                padding: '1.5cqmin 2.5cqmin 2cqmin',
                gap: '1.5cqmin',
              }}
            >
              {question.commentImage && (
                <img
                  src={`${BASE}data/images/questions/${question.commentImage}`}
                  alt="解説画像"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '20cqmin',
                    objectFit: 'contain',
                    borderRadius: '1.5cqmin',
                  }}
                  draggable={false}
                />
              )}
              {question.comment && (
                <span
                  style={{
                    fontSize: '2.5cqmin',
                    color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.6,
                  }}
                >
                  {parseTextWithTalentIcons(question.comment, talents, true)}
                </span>
              )}
              {question.sourceUrl && (
                <a
                  href={question.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 underline inline-flex items-center gap-1"
                  style={{ fontSize: '2.2cqmin', color: 'rgba(200,200,255,0.9)' }}
                >
                  📎 情報源: {getSourceSiteName(question.sourceUrl)}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 右側: 選択肢 */}
      {question.answerTalentIds ? (
        <TalentGridChoices
          question={question}
          talentIds={question.answerTalentIds}
          talents={talents}
          isAnswered={isAnswered}
          selected={selected}
          showIcon={showIconInQuestion}
          onSelect={handleSelect}
        />
      ) : (
        <TextChoices
          question={question}
          isAnswered={isAnswered}
          selected={selected}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

/* ── 通常テキスト選択肢（右側、4行レイアウト） ── */

function TextChoices({
  question,
  isAnswered,
  selected,
  onSelect,
}: {
  question: TextQuizQuestion
  isAnswered: boolean
  selected: number | null
  onSelect: (i: number) => void
}) {
  const currentIndex = useGameStore((s) => s.currentIndex)

  return (
    <div
      className="flex flex-col justify-center"
      style={{
        position: 'absolute',
        top: '16cqmin',
        right: '2.5cqmin',
        bottom: '3cqmin',
        width: '48%',
        gap: '2cqmin',
        zIndex: 3,
      }}
    >
      {question.answers.map((answer, i) => {
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
              height: '13cqmin',
              fontSize: answer.length <= 8 ? '5cqmin'
                : answer.length <= 12 ? '4cqmin'
                : '3cqmin',
              padding: '0 3cqmin',
              borderRadius: '2cqmin',
              border: `0.5cqmin solid ${borderColor}`,
              background: bg,
              color,
              opacity,
              cursor: isAnswered ? 'default' : 'pointer',
              boxShadow,
              textShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={isAnswered}
            onClick={() => onSelect(i)}
          >
            {answer}
          </button>
        )
      })}
    </div>
  )
}

/* ── タレント名選択肢（右側、2×2 グリッドレイアウト） ── */

function TalentGridChoices({
  question,
  talentIds,
  talents,
  isAnswered,
  selected,
  showIcon,
  onSelect,
}: {
  question: TextQuizQuestion
  talentIds: string[]
  talents: Talent[]
  isAnswered: boolean
  selected: number | null
  showIcon: boolean
  onSelect: (i: number) => void
}) {

  return (
    <div
      className="grid grid-cols-2 grid-rows-2"
      style={{
        position: 'absolute',
        top: '16cqmin',
        right: '2.5cqmin',
        bottom: '10cqmin',
        width: '48%',
        gap: '2cqmin',
        zIndex: 3,
      }}
    >
      {question.answers.map((answer, i) => {
        const talentId = talentIds[i]
        const talent = talents.find((t) => t.id === talentId)

        let borderColor = 'rgba(255,255,255,0.4)'
        let opacity = 1
        if (isAnswered) {
          if (i === question.correctIndex) {
            borderColor = '#22c55e'
          } else if (i === selected) {
            borderColor = '#ef4444'
          } else {
            opacity = 0.5
          }
        }

        return (
          <button
            key={i}
            className="relative flex flex-col items-center overflow-hidden transition active:scale-98"
            style={{
              borderRadius: '2cqmin',
              border: `0.4cqmin solid ${borderColor}`,
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(4px)',
              opacity,
              cursor: isAnswered ? 'default' : 'pointer',
              padding: 0,
              minHeight: 0,
            }}
            disabled={isAnswered}
            onClick={() => onSelect(i)}
          >
            {/* 顔画像 or プレースホルダー */}
            <div
              className="flex items-center justify-center"
              style={{
                flex: 1,
                width: '100%',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {showIcon && talent ? (
                <img
                  src={getTalentImagePath(talent)}
                  alt={answer}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  draggable={false}
                />
              ) : (
                <span
                  style={{
                    fontSize: '12cqmin',
                    lineHeight: 1,
                    color: '#aaa',
                  }}
                >
                  👤
                </span>
              )}
            </div>

            {/* タレント名ラベル */}
            <div
              className="w-full flex items-center justify-center"
              style={{
                flexShrink: 0,
                height: '4.5cqmin',
                background:
                  isAnswered && i === question.correctIndex
                    ? 'rgba(34,197,94,0.9)'
                    : isAnswered && i === selected
                      ? 'rgba(239,68,68,0.9)'
                      : 'rgba(255,255,255,0.9)',
              }}
            >
              <span
                className="font-bold truncate"
                style={{
                  fontSize: '2.5cqmin',
                  color:
                    isAnswered && (i === question.correctIndex || i === selected)
                      ? 'white'
                      : '#374151',
                  padding: '0 1cqmin',
                }}
              >
                {answer}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ── URLからサイト名を取得 ── */

function getSourceSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube'
    if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'X'
    if (hostname.includes('tiktok.com')) return 'TikTok'
    if (hostname.includes('parerdemia.jp')) return 'パレデミア学園公式サイト'
    return hostname
  } catch {
    return url
  }
}
