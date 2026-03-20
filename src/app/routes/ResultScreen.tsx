import { useRef } from 'react'
import { useGameStore } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { judgeBadge } from '../../features/achievement/judge.ts'
import { getBadgeSlotDef, RANK_LABELS, RANK_COLORS } from '../../features/achievement/constants.ts'
import type { BadgeRank } from '../../features/achievement/types.ts'

interface BadgeAwardResult {
  awarded: boolean
  isRankUp: boolean
  slotLabel: string
  rank: BadgeRank | null
  masterAchievement: string | null
}

export function ResultScreen() {
  const { questions, correctCount } = useGameStore()
  const { goToTitle, goToSetting, generation, gameMode, scope, difficulty } = useSettingsStore()
  const { awardBadge, getBadgeRank, isGen2Master, isGen1Master, isParerMaster } = useBadgeStore()

  const total = questions.length
  const rate = total > 0 ? Math.round((correctCount / total) * 100 * 10) / 10 : 0
  const isPerfect = correctCount === total

  const accentColor = generation === 'gen2' ? '#e8789e' : '#6aaa80'
  const accentGradient =
    generation === 'gen2'
      ? 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)'
      : 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)'

  // バッジ判定・付与（初回レンダー時に1回だけ実行）
  const badgeResultRef = useRef<BadgeAwardResult | null>(null)
  if (badgeResultRef.current === null) {
    const enabledTypes = ['face-guess', 'name-guess', 'name-build']
    const result = judgeBadge({
      gameMode,
      generation,
      scope,
      difficulty,
      correctCount,
      totalCount: total,
      enabledTypes,
    })

    let awarded = false
    let isRankUp = false
    let slotLabel = ''
    let rank: BadgeRank | null = null

    if (result.eligible && result.slotId && result.rank) {
      const prevRank = getBadgeRank(result.slotId)
      awarded = awardBadge(result.slotId, result.rank)
      isRankUp = awarded && prevRank !== null
      slotLabel = getBadgeSlotDef(result.slotId).label
      rank = result.rank
    }

    let masterAchievement: string | null = null
    if (isParerMaster()) masterAchievement = 'パレ学マスター達成！'
    else if (isGen2Master()) masterAchievement = '2期生マスター達成！'
    else if (isGen1Master()) masterAchievement = '1期生マスター達成！'

    badgeResultRef.current = { awarded, isRankUp, slotLabel, rank, masterAchievement }
  }
  const badgeResult = badgeResultRef.current

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden animate-fade-in">
      <div
        className="flex flex-col items-center"
        style={{
          padding: '5cqmin 8cqmin',
          borderRadius: '3cqmin',
          backgroundColor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
        }}
      >
        <span
          className="font-bold"
          style={{ fontSize: '6cqmin', color: '#333', marginBottom: '3cqmin' }}
        >
          結果発表
        </span>

        <span
          className="font-bold"
          style={{ fontSize: '8cqmin', color: accentColor }}
        >
          {correctCount} / {total}
        </span>

        <span
          style={{ fontSize: '4cqmin', color: '#666', marginTop: '1cqmin' }}
        >
          正解率: {rate}%
        </span>

        {isPerfect && (
          <span
            className="font-bold"
            style={{
              fontSize: '5cqmin',
              color: '#f59e0b',
              marginTop: '2cqmin',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            全問正解！
          </span>
        )}

        {badgeResult.awarded && badgeResult.rank && (
          <div
            className="flex flex-col items-center"
            style={{ marginTop: '2cqmin', gap: '0.5cqmin' }}
          >
            <span
              className="font-bold"
              style={{
                fontSize: '4cqmin',
                color: RANK_COLORS[badgeResult.rank],
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {badgeResult.isRankUp ? 'ランクアップ！' : 'バッジ獲得！'}
            </span>
            <span style={{ fontSize: '3cqmin', color: '#555' }}>
              {badgeResult.slotLabel} — {RANK_LABELS[badgeResult.rank]}
            </span>
          </div>
        )}

        {badgeResult.masterAchievement && (
          <span
            className="font-bold"
            style={{
              fontSize: '4cqmin',
              color: '#9333ea',
              marginTop: '1.5cqmin',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {badgeResult.masterAchievement}
          </span>
        )}

        <div
          className="flex items-center justify-center"
          style={{ gap: '3cqmin', marginTop: '4cqmin' }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3.5cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid #ddd',
              background: 'white',
              color: '#666',
            }}
            onClick={goToTitle}
          >
            トップに戻る
          </button>
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3.5cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: accentGradient,
              color: 'white',
              boxShadow:
                'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
            }}
            onClick={() => goToSetting(generation)}
          >
            もう一度
          </button>
        </div>
      </div>
    </div>
  )
}
