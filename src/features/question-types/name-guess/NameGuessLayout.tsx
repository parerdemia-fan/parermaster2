import { useState } from 'react'
import { SILHOUETTE_FILTER } from '../../../shared/utils/style.ts'
import { useTalents } from '../../../shared/hooks/useTalents.ts'
import { getTalentStandingPath, getStandingImageVariant } from '../../../shared/utils/talent.ts'
import type { StandingImageVariant } from '../../../shared/utils/talent.ts'
import { getQuizStandingTopHeight } from '../standingStyle.ts'
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

  const variant: StandingImageVariant = talent ? getStandingImageVariant(talent) : 'kv1'
  // 横位置は画面ごとに調整。kv2 は kv1 と同じ位置でおおむね中央が揃う
  const standingLeft: Record<StandingImageVariant, string> = {
    kv1: '-2%',
    kv2: '-2%',
    live2d: '-10%',
  }

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
          zIndex: 2,
          objectFit: 'contain',
          filter: question.isSilhouette && !isAnswered
            ? SILHOUETTE_FILTER
            : undefined,
          transition: 'filter 0.3s',
          // 立ち絵の縦配置はバリアント別（standingStyle.ts）。横位置は standingLeft で調整
          ...getQuizStandingTopHeight(variant),
          left: standingLeft[variant],
          width: 'auto',
        }}
        draggable={false}
      />

      {/* プロフィール（左、立ち絵の腰あたりに重なる） */}
      {talent && (talent.dream || talent.hobbies.length > 0 || talent.favorites.length > 0 || talent.skills.length > 0) && (
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
