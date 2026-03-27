import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { getTalentStandingPath } from '../../../shared/utils/talent.ts'
import { TalentChoiceButtons } from '../../../shared/components/TalentChoiceButtons.tsx'
import type { NameGuessQuestion } from './types.ts'

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

  const talent = talents.find((t) => t.id === question.talentId)

  const standingImagePath = talent
    ? getTalentStandingPath(talent)
    : question.talentImagePath

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
          left: '-2%',
          top: '0cqmin',
          height: '150cqmin',
          width: 'auto',
          objectFit: 'contain',
          zIndex: 2,
          filter: question.isSilhouette && !isAnswered
            ? SILHOUETTE_FILTER
            : undefined,
          transition: 'filter 0.3s',
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
        <TalentChoiceButtons
          answers={question.answers}
          answerTalentIds={question.answerTalentIds}
          correctIndex={question.correctIndex}
          isAnswered={isAnswered}
          selected={selected}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}
