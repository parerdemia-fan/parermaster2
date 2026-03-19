import { useState } from 'react'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { getTalentImagePath } from '../../../shared/utils/talent.ts'
import { parseTextWithTalentIcons } from '../../../shared/utils/talentIconParser.tsx'
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

  const isCorrect = selected !== null && selected === question.correctIndex

  // hideIcon=true かつ未回答 → アイコン非表示
  const showIconInQuestion = question.hideIcon ? isAnswered : true

  return (
    <div
      className="flex flex-col items-center flex-1 overflow-y-auto"
      style={{
        width: '100%',
        padding: '2cqmin 4cqmin',
        gap: '2cqmin',
      }}
    >
      {/* 問題文 */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          minHeight: '10cqmin',
          padding: '2cqmin 3cqmin',
          borderRadius: '2cqmin',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          gap: '1.5cqmin',
        }}
      >
        <span
          className="font-bold text-center"
          style={{
            fontSize: '3.5cqmin',
            color: '#333',
            lineHeight: 1.5,
          }}
        >
          {parseTextWithTalentIcons(question.question, talents, showIconInQuestion)}
        </span>
        {question.questionImage && (
          <img
            src={`${BASE}data/images/questions/${question.questionImage}`}
            alt="問題画像"
            style={{
              maxWidth: '50cqmin',
              maxHeight: '20cqmin',
              objectFit: 'contain',
              borderRadius: '1.5cqmin',
            }}
            draggable={false}
          />
        )}
      </div>

      {/* 正誤表示 */}
      {isAnswered && (
        <div
          className="font-bold"
          style={{
            fontSize: '4cqmin',
            color: isCorrect ? '#22c55e' : '#ef4444',
            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            lineHeight: 1,
          }}
        >
          {isCorrect ? '正解！' : '不正解..'}
        </div>
      )}

      {/* 選択肢 */}
      {question.answerTalentIds ? (
        <TalentGridChoices
          question={question}
          talentIds={question.answerTalentIds}
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

      {/* 解説 */}
      {isAnswered && (question.comment || question.commentImage || question.sourceUrl) && (
        <div
          className="w-full flex flex-col items-center"
          style={{
            padding: '2cqmin 3cqmin',
            borderRadius: '2cqmin',
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(8px)',
            maxWidth: '80cqmin',
            gap: '1.5cqmin',
          }}
        >
          {question.commentImage && (
            <img
              src={`${BASE}data/images/questions/${question.commentImage}`}
              alt="解説画像"
              style={{
                maxWidth: '50cqmin',
                maxHeight: '20cqmin',
                objectFit: 'contain',
                borderRadius: '1.5cqmin',
              }}
              draggable={false}
            />
          )}
          <span
            style={{
              fontSize: '2.5cqmin',
              color: '#555',
              lineHeight: 1.6,
            }}
          >
            {/* 解説文は回答後のみ表示されるため常に showIcon=true */}
            {parseTextWithTalentIcons(question.comment, talents, true)}
          </span>
          {question.sourceUrl && (
            <a
              href={question.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 underline inline-flex items-center gap-1"
              style={{ fontSize: '2.2cqmin', color: '#500' }}
            >
              📎 情報源: {getSourceSiteName(question.sourceUrl)}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

/* ── 通常テキスト選択肢（4行レイアウト） ── */

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
  return (
    <div
      className="w-full flex flex-col"
      style={{ gap: '1.5cqmin', maxWidth: '80cqmin' }}
    >
      {question.answers.map((answer, i) => {
        let bg = 'rgba(255,255,255,0.85)'
        let borderColor = 'rgba(255,255,255,0.5)'
        let color = '#333'
        let opacity = 1

        if (isAnswered) {
          if (i === question.correctIndex) {
            bg = 'rgba(34,197,94,0.85)'
            borderColor = '#22c55e'
            color = 'white'
          } else if (i === selected) {
            bg = 'rgba(239,68,68,0.85)'
            borderColor = '#ef4444'
            color = 'white'
          } else {
            opacity = 0.5
          }
        }

        return (
          <button
            key={i}
            className="font-bold transition active:scale-98"
            style={{
              height: '8cqmin',
              fontSize: '3cqmin',
              padding: '0 3cqmin',
              borderRadius: '2cqmin',
              border: `0.3cqmin solid ${borderColor}`,
              background: bg,
              color,
              opacity,
              cursor: isAnswered ? 'default' : 'pointer',
              textAlign: 'left',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
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

/* ── タレント名選択肢（2×2 グリッドレイアウト） ── */

function TalentGridChoices({
  question,
  talentIds,
  isAnswered,
  selected,
  showIcon,
  onSelect,
}: {
  question: TextQuizQuestion
  talentIds: string[]
  isAnswered: boolean
  selected: number | null
  showIcon: boolean
  onSelect: (i: number) => void
}) {
  const { talents } = useTalents()

  return (
    <div
      className="grid grid-cols-2 grid-rows-2"
      style={{
        width: '70cqmin',
        maxHeight: '50cqmin',
        gap: '1.5cqmin',
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
                    objectFit: 'contain',
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
