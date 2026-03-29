import { useRef, useState, useEffect, useMemo } from 'react'
import { useGameStore, type BadgeAwardResult } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { judgeBadge } from '../../features/achievement/judge.ts'
import { getBadgeSlotDef, RANK_LABELS, RANK_COLORS } from '../../features/achievement/constants.ts'
import { BADGE_IMAGES, TROPHY_IMAGES } from '../../features/achievement/images.ts'
import { ConfettiCanvas } from '../../shared/components/ConfettiCanvas.tsx'
import { GAME_URL } from '../../shared/constants/urls.ts'

function getTier(isPerfect: boolean, badgeResult: BadgeAwardResult): number {
  if (!isPerfect) return 2
  if (badgeResult.masterAchievement) return 5
  if (badgeResult.awarded) return 4
  return 3
}

function getButtonDelay(tier: number): number {
  if (tier >= 5) return 3.5
  if (tier >= 4) return 2.8
  if (tier >= 3) return 2.0
  return 1.5
}

function getTrophyImage(masterAchievement: string): string {
  if (masterAchievement.includes('パレ学マスター')) return TROPHY_IMAGES.master
  if (masterAchievement.includes('2期生')) return TROPHY_IMAGES.gen2
  if (masterAchievement.includes('1期生')) return TROPHY_IMAGES.gen1
  return TROPHY_IMAGES.master
}

const SPARKLE_COUNT = 15

export function ResultScreen() {
  const { questions, correctCount, debugBadgeOverride } = useGameStore()
  const { goToTitle, goToSetting, modeCategory, generation, gameMode, scope, difficulty } = useSettingsStore()
  const { awardBadge, getBadgeRank, isGen2Master, isGen1Master, isParerMaster } = useBadgeStore()

  const total = questions.length
  const rate = total > 0 ? Math.round((correctCount / total) * 100 * 10) / 10 : 0
  const isPerfect = correctCount === total && total > 0

  const isDormMode = modeCategory === 'dorm'
  const DORM_LABELS: Record<string, string> = { wa: 'バゥ寮', me: 'ミュゥ寮', co: 'クゥ寮', wh: 'ウィニー寮' }
  const genLabel = isDormMode ? (DORM_LABELS[scope] ?? '寮別モード') : generation === 'gen2' ? '2期生編' : '1期生編'
  const diffLabel = difficulty === 1 ? 'ふつう' : difficulty === 2 ? 'むずかしい' : '激ムズ'
  const modeLabel = gameMode === 'face-name' ? '顔名前当て' : '知識クイズ'

  const shareOnX = () => {
    const perfectMark = isPerfect ? '🎉全問正解！' : ''
    const text = `パレ学マスター 2nd Season
${genLabel} ${modeLabel} ${diffLabel}
${correctCount}/${total}問正解（${rate}%）${perfectMark}
#パレ学マスター #パレデミア学園`
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const accentColor = isDormMode ? '#5b8db8' : generation === 'gen2' ? '#e8789e' : '#6aaa80'
  const accentGradient = isDormMode
    ? 'linear-gradient(180deg, #b8d4e8 0%, #7aabc4 40%, #5b8db8 100%)'
    : generation === 'gen2'
      ? 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)'
      : 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)'

  // バッジ判定・付与（初回レンダー時に1回だけ実行）
  const badgeResultRef = useRef<BadgeAwardResult | null>(null)
  if (badgeResultRef.current === null) {
    if (debugBadgeOverride) {
      badgeResultRef.current = debugBadgeOverride
    } else {
      const enabledTypes = ['face-guess', 'name-guess', 'name-build']
      const result = judgeBadge({
        gameMode, modeCategory, scope, difficulty,
        correctCount, totalCount: total, enabledTypes,
      })

      let awarded = false
      let isRankUp = false
      let slotLabel = ''
      let rank: typeof result.rank = null
      let badgeCategory: 'clear' | 'knowledge' | null = null

      if (result.eligible && result.slotId && result.rank) {
        const prevRank = getBadgeRank(result.slotId)
        awarded = awardBadge(result.slotId, result.rank)
        isRankUp = awarded && prevRank !== null
        slotLabel = getBadgeSlotDef(result.slotId).label
        rank = result.rank
        badgeCategory = getBadgeSlotDef(result.slotId).category
      }

      let masterAchievement: string | null = null
      if (isParerMaster()) masterAchievement = 'パレ学マスター達成！'
      else if (isGen2Master()) masterAchievement = '2期生マスター達成！'
      else if (isGen1Master()) masterAchievement = '1期生マスター達成！'

      badgeResultRef.current = { awarded, isRankUp, slotLabel, rank, badgeCategory, masterAchievement }
    }
  }
  const badgeResult = badgeResultRef.current
  const tier = getTier(isPerfect, badgeResult)
  const btnDelay = getButtonDelay(tier)

  // 紙吹雪の遅延マウント
  const [showConfetti, setShowConfetti] = useState(false)
  useEffect(() => {
    if (tier >= 3) {
      const id = setTimeout(() => setShowConfetti(true), 1500)
      return () => clearTimeout(id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // スパークル位置の生成（1回だけ）
  const sparkles = useMemo(() =>
    Array.from({ length: SPARKLE_COUNT }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.8 + Math.random() * 1.2,
      delay: Math.random() * 2,
    })),
  [])

  const rankColor = badgeResult.rank ? RANK_COLORS[badgeResult.rank] : '#cd7f32'

  return (
    <>
      <style>{`
        @keyframes result-header-in {
          0% { opacity: 0; transform: translateY(-3cqmin); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes result-score-in {
          0% { opacity: 0; transform: scale(0.5); }
          60% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1.0); }
        }
        @keyframes result-fade-up {
          0% { opacity: 0; transform: translateY(1cqmin); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes result-perfect-glow {
          0%, 100% {
            text-shadow: 0 0 1cqmin rgba(255,215,0,0.8), 0 0 2cqmin rgba(255,215,0,0.6), 0 0 3cqmin rgba(255,215,0,0.4);
          }
          50% {
            text-shadow: 0 0 2cqmin rgba(255,215,0,1), 0 0 4cqmin rgba(255,215,0,0.8), 0 0 6cqmin rgba(255,165,0,0.6);
          }
        }
        @keyframes result-burst {
          0% { transform: translate(-50%,-50%) scale(0) rotate(0deg); opacity: 0; }
          30% { opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(2) rotate(15deg); opacity: 0; }
        }
        @keyframes result-sparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes result-badge-in {
          0% { opacity: 0; transform: translateY(3cqmin) scale(0.8); }
          70% { opacity: 1; transform: translateY(-0.5cqmin) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1.0); }
        }
        @keyframes result-badge-glow {
          0%, 100% { box-shadow: 0 0 1cqmin ${rankColor}66, 0 0 2cqmin ${rankColor}33; }
          50% { box-shadow: 0 0 2cqmin ${rankColor}99, 0 0 4cqmin ${rankColor}66; }
        }
        @keyframes result-trophy-in {
          0% { opacity: 0; transform: translateY(3cqmin) scale(0.7); }
          50% { opacity: 1; transform: translateY(-1cqmin) scale(1.05); }
          70% { transform: translateY(0.3cqmin) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1.0); }
        }
        @keyframes result-trophy-aura {
          0%, 100% { box-shadow: 0 0 2cqmin rgba(147,51,234,0.4), 0 0 4cqmin rgba(255,215,0,0.2); }
          50% { box-shadow: 0 0 3cqmin rgba(147,51,234,0.7), 0 0 6cqmin rgba(255,215,0,0.4); }
        }
      `}</style>

      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {/* 背景エフェクト層 */}
        {tier >= 3 && (
          <>
            {/* 光芒 */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                background: `conic-gradient(
                  from 0deg,
                  rgba(255,215,0,0.3) 0deg, transparent 5deg,
                  transparent 25deg, rgba(255,215,0,0.3) 30deg,
                  rgba(255,215,0,0.3) 30deg, transparent 35deg,
                  transparent 55deg, rgba(255,215,0,0.3) 60deg,
                  rgba(255,215,0,0.3) 60deg, transparent 65deg,
                  transparent 85deg, rgba(255,215,0,0.3) 90deg,
                  rgba(255,215,0,0.3) 90deg, transparent 95deg,
                  transparent 115deg, rgba(255,215,0,0.3) 120deg,
                  rgba(255,215,0,0.3) 120deg, transparent 125deg,
                  transparent 145deg, rgba(255,215,0,0.3) 150deg,
                  rgba(255,215,0,0.3) 150deg, transparent 155deg,
                  transparent 175deg, rgba(255,215,0,0.3) 180deg,
                  rgba(255,215,0,0.3) 180deg, transparent 185deg,
                  transparent 205deg, rgba(255,215,0,0.3) 210deg,
                  rgba(255,215,0,0.3) 210deg, transparent 215deg,
                  transparent 235deg, rgba(255,215,0,0.3) 240deg,
                  rgba(255,215,0,0.3) 240deg, transparent 245deg,
                  transparent 265deg, rgba(255,215,0,0.3) 270deg,
                  rgba(255,215,0,0.3) 270deg, transparent 275deg,
                  transparent 295deg, rgba(255,215,0,0.3) 300deg,
                  rgba(255,215,0,0.3) 300deg, transparent 305deg,
                  transparent 325deg, rgba(255,215,0,0.3) 330deg,
                  rgba(255,215,0,0.3) 330deg, transparent 335deg,
                  transparent 355deg, rgba(255,215,0,0.3) 360deg
                )`,
                animation: 'result-burst 2s 1.3s ease-out both',
              }}
            />
            {/* スパークル */}
            {sparkles.map((s, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${s.size}cqmin`,
                  height: `${s.size}cqmin`,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                  animation: `result-sparkle 1.5s ${1.3 + s.delay}s ease-in-out infinite both`,
                }}
              />
            ))}
            {/* 紙吹雪 */}
            {showConfetti && <ConfettiCanvas triggerKey={1} />}
          </>
        )}

        {/* コンテンツパネル */}
        <div
          className="flex flex-col items-center"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '3cqmin 6cqmin',
            borderRadius: '3cqmin',
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
          }}
        >
          {/* 結果発表 */}
          <span
            className="font-bold"
            style={{
              fontSize: '5cqmin',
              color: '#333',
              marginBottom: '1cqmin',
              animation: 'result-header-in 0.4s 0.3s both',
            }}
          >
            結果発表
          </span>

          {/* スコア */}
          <span
            className="font-bold"
            style={{
              fontSize: '7cqmin',
              color: accentColor,
              animation: 'result-score-in 0.5s 0.7s both',
            }}
          >
            {correctCount} / {total}
          </span>

          {/* 正解率 */}
          <span
            style={{
              fontSize: '3.5cqmin',
              color: '#666',
              marginTop: '0.5cqmin',
              animation: 'result-fade-up 0.3s 1.0s both',
            }}
          >
            正解率: {rate}%
          </span>

          {/* 全問正解 */}
          {isPerfect && (
            <span
              className="font-bold"
              style={{
                fontSize: '5cqmin',
                color: '#b08101',
                marginTop: '1.5cqmin',
                animation: 'result-perfect-glow 1.5s 1.3s ease-in-out infinite both',
              }}
            >
              全問正解！
            </span>
          )}

          {/* バッジ獲得 */}
          {badgeResult.awarded && badgeResult.rank && badgeResult.badgeCategory && (
            <div
              className="flex items-center"
              style={{
                gap: '1.5cqmin',
                marginTop: '1.5cqmin',
                padding: '1cqmin 2.5cqmin',
                borderRadius: '2cqmin',
                backgroundColor: 'rgba(255,255,255,0.6)',
                animation: `result-badge-in 0.6s 2.0s both, result-badge-glow 2s 2.0s ease-in-out infinite both`,
              }}
            >
              <img
                src={BADGE_IMAGES[badgeResult.badgeCategory][badgeResult.rank]}
                alt={badgeResult.slotLabel}
                style={{
                  width: '7cqmin',
                  height: '7cqmin',
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 0.2cqmin 0.4cqmin rgba(0,0,0,0.3))',
                }}
              />
              <div className="flex flex-col">
                <span
                  className="font-bold"
                  style={{
                    fontSize: '2.8cqmin',
                    color: rankColor,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {badgeResult.isRankUp ? 'ランクアップ！' : 'バッジ獲得！'}
                </span>
                <span style={{ fontSize: '2.2cqmin', color: '#555', whiteSpace: 'nowrap' }}>
                  {badgeResult.slotLabel} — {RANK_LABELS[badgeResult.rank]}
                </span>
              </div>
            </div>
          )}

          {/* 称号獲得 */}
          {badgeResult.masterAchievement && (
            <div
              className="flex items-center"
              style={{
                gap: '1.5cqmin',
                marginTop: '1cqmin',
                padding: '1cqmin 2.5cqmin',
                borderRadius: '2cqmin',
                backgroundColor: 'rgba(255,255,255,0.6)',
                animation: 'result-trophy-in 0.8s 2.8s both, result-trophy-aura 2s 2.8s ease-in-out infinite both',
              }}
            >
              <img
                src={getTrophyImage(badgeResult.masterAchievement)}
                alt={badgeResult.masterAchievement}
                style={{
                  width: '7cqmin',
                  height: '7cqmin',
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 0.2cqmin 0.4cqmin rgba(0,0,0,0.3))',
                }}
              />
              <span
                className="font-bold"
                style={{
                  fontSize: '2.8cqmin',
                  color: '#9333ea',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                }}
              >
                {badgeResult.masterAchievement}
              </span>
            </div>
          )}

          {/* Xシェアボタン */}
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3cqmin',
              padding: '1cqmin 3cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: '#000',
              color: 'white',
              marginTop: '2cqmin',
              animation: `result-fade-up 0.3s ${btnDelay}s both`,
            }}
            onClick={shareOnX}
          >
            𝕏 結果をシェア
          </button>

          {/* ナビゲーションボタン */}
          <div
            className="flex items-center justify-center"
            style={{
              gap: '3cqmin',
              marginTop: '1.5cqmin',
              animation: `result-fade-up 0.3s ${btnDelay + 0.2}s both`,
            }}
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
                boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
              }}
              onClick={() => goToSetting(modeCategory)}
            >
              もう一度
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
