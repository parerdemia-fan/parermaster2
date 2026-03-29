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
  const rankColor = badgeResult.rank ? RANK_COLORS[badgeResult.rank] : '#cd7f32'

  // 称号がある場合はバッジを非表示（最上位の称号のみ表示）
  const showBadge = badgeResult.awarded && badgeResult.rank && badgeResult.badgeCategory && !badgeResult.masterAchievement
  const showTrophy = !!badgeResult.masterAchievement

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
          0% { opacity: 0; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1.0); }
        }
        @keyframes result-swirl {
          0% { transform: translate(-50%,-50%) rotate(0deg); }
          100% { transform: translate(-50%,-50%) rotate(360deg); }
        }
      `}</style>

      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {/* 紙吹雪（画面全体） */}
        {tier >= 3 && showConfetti && <ConfettiCanvas triggerKey={1} />}

        {/* スパークル（画面全体） */}
        {tier >= 3 && sparkles.map((s, i) => (
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
              zIndex: 10,
              animation: `result-sparkle 1.5s ${1.3 + s.delay}s ease-in-out infinite both`,
            }}
          />
        ))}

        {/* ===== 白パネル（メインコンテンツ） ===== */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '75%',
            maxWidth: '95cqmin',
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '3cqmin',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
            padding: '6cqmin 3cqmin 3cqmin',
            animation: 'result-score-in 0.5s 0.3s both',
          }}
        >
          {/* ===== リボン（パネル上部に半分重なる） ===== */}
          <div
            style={{
              position: 'absolute',
              top: '-4.5cqmin',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 2,
              pointerEvents: 'none',
              animation: 'result-header-in 0.4s 0.5s both',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* 左端: V字切り込み（右側が切り込み、左側が直線で広め） */}
              <div style={{
                position: 'relative',
                top: '1.5cqmin',
                width: '6cqmin',
                height: '70%',
                marginRight: '-2cqmin',
                flexShrink: 0,
                zIndex: -1,
                background: 'linear-gradient(180deg, #80cfb0 0%, #60b898 100%)',
                clipPath: 'polygon(0 0, 100% 0, 73% 80%, 100% 100%, 0 100%, 42% 50%)',
              }} />
              {/* リボン中央（上下アーチ） */}
              <div style={{
                position: 'relative',
                top: '-1.5cqmin',
                width: '45cqmin',
                height: '11cqmin',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {/* アーチ形状の背景（上は上に膨らみ、下は中央が上に凹む） */}
                <svg
                  viewBox="0 0 200 60"
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                >
                  <defs>
                    <linearGradient id="ribbon-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c8f0e0" />
                      <stop offset="50%" stopColor="#a8e0cc" />
                      <stop offset="100%" stopColor="#80cfb0" />
                    </linearGradient>
                  </defs>
                  {/* リボン本体 */}
                  <path
                    d="M0,10 Q100,-5 200,10 L200,50 Q100,35 0,50 Z"
                    fill="url(#ribbon-grad)"
                  />
                  {/* 内側の白ボーダー（上下のみ） */}
                  <path d="M0,13 Q100,-5 200,13" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                  <path d="M0,47 Q100,33 200,47" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                </svg>
                <span
                  className="font-bold"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: '7.8cqmin',
                    fontWeight: 900,
                    marginTop: '-2cqmin',
                    WebkitTextStroke: '0.3cqmin white',
                    color: '#5dbfa0',
                    textShadow: '0 0 0.3cqmin #fff, 0 0 0.3cqmin #fff, 0.1cqmin 0.1cqmin 0 #fff, -0.1cqmin -0.1cqmin 0 #fff, 0.1cqmin -0.1cqmin 0 #fff, -0.1cqmin 0.1cqmin 0 #fff',
                    letterSpacing: '0.15em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  結果発表
                </span>
              </div>
              {/* 右端: V字切り込み（左側が切り込み、右側が直線で広め） */}
              <div style={{
                position: 'relative',
                top: '1.5cqmin',
                width: '6cqmin',
                height: '70%',
                marginLeft: '-2cqmin',
                flexShrink: 0,
                zIndex: -1,
                background: 'linear-gradient(180deg, #80cfb0 0%, #60b898 100%)',
                clipPath: 'polygon(0 0, 27% 80%, 0 100%, 100% 100%, 58% 50%, 100% 0)',
              }} />
            </div>
          </div>

          {/* パネル内コンテンツ */}
          <div className="flex items-center justify-center" style={{ gap: '3cqmin' }}>
            {/* 左側: スコアエリア */}
            <div
              className="flex flex-col items-center"
              style={{
                position: 'relative',
                flex: (showBadge || showTrophy) ? 1 : undefined,
                padding: '2cqmin 3cqmin',
              }}
            >
              {/* 全問正解時の金色放射状背景 */}
              {isPerfect && (
                <>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '80cqmin',
                  height: '80cqmin',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(255,255,240,0.7) 15%, rgba(255,240,150,0.5) 35%, rgba(255,220,100,0.15) 60%, transparent 80%)',
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '80cqmin',
                  height: '80cqmin',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                  borderRadius: '50%',
                  WebkitMaskImage: 'radial-gradient(circle, white 0%, white 30%, transparent 70%)',
                  maskImage: 'radial-gradient(circle, white 0%, white 30%, transparent 70%)',
                  background: `
                    conic-gradient(
                      from 0deg at 50% 50%,
                      rgba(255,255,255,0.4) 0deg, rgba(255,255,255,0) 5deg,
                      rgba(255,255,255,0) 10deg, rgba(255,255,255,0.4) 15deg,
                      rgba(255,255,255,0) 20deg, rgba(255,255,255,0) 25deg,
                      rgba(255,255,255,0.4) 30deg, rgba(255,255,255,0) 35deg,
                      rgba(255,255,255,0) 40deg, rgba(255,255,255,0.4) 45deg,
                      rgba(255,255,255,0) 50deg, rgba(255,255,255,0) 55deg,
                      rgba(255,255,255,0.4) 60deg, rgba(255,255,255,0) 65deg,
                      rgba(255,255,255,0) 70deg, rgba(255,255,255,0.4) 75deg,
                      rgba(255,255,255,0) 80deg, rgba(255,255,255,0) 85deg,
                      rgba(255,255,255,0.4) 90deg, rgba(255,255,255,0) 95deg,
                      rgba(255,255,255,0) 100deg, rgba(255,255,255,0.4) 105deg,
                      rgba(255,255,255,0) 110deg, rgba(255,255,255,0) 115deg,
                      rgba(255,255,255,0.4) 120deg, rgba(255,255,255,0) 125deg,
                      rgba(255,255,255,0) 130deg, rgba(255,255,255,0.4) 135deg,
                      rgba(255,255,255,0) 140deg, rgba(255,255,255,0) 145deg,
                      rgba(255,255,255,0.4) 150deg, rgba(255,255,255,0) 155deg,
                      rgba(255,255,255,0) 160deg, rgba(255,255,255,0.4) 165deg,
                      rgba(255,255,255,0) 170deg, rgba(255,255,255,0) 175deg,
                      rgba(255,255,255,0.4) 180deg, rgba(255,255,255,0) 185deg,
                      rgba(255,255,255,0) 190deg, rgba(255,255,255,0.4) 195deg,
                      rgba(255,255,255,0) 200deg, rgba(255,255,255,0) 205deg,
                      rgba(255,255,255,0.4) 210deg, rgba(255,255,255,0) 215deg,
                      rgba(255,255,255,0) 220deg, rgba(255,255,255,0.4) 225deg,
                      rgba(255,255,255,0) 230deg, rgba(255,255,255,0) 235deg,
                      rgba(255,255,255,0.4) 240deg, rgba(255,255,255,0) 245deg,
                      rgba(255,255,255,0) 250deg, rgba(255,255,255,0.4) 255deg,
                      rgba(255,255,255,0) 260deg, rgba(255,255,255,0) 265deg,
                      rgba(255,255,255,0.4) 270deg, rgba(255,255,255,0) 275deg,
                      rgba(255,255,255,0) 280deg, rgba(255,255,255,0.4) 285deg,
                      rgba(255,255,255,0) 290deg, rgba(255,255,255,0) 295deg,
                      rgba(255,255,255,0.4) 300deg, rgba(255,255,255,0) 305deg,
                      rgba(255,255,255,0) 310deg, rgba(255,255,255,0.4) 315deg,
                      rgba(255,255,255,0) 320deg, rgba(255,255,255,0) 325deg,
                      rgba(255,255,255,0.4) 330deg, rgba(255,255,255,0) 335deg,
                      rgba(255,255,255,0) 340deg, rgba(255,255,255,0.4) 345deg,
                      rgba(255,255,255,0) 350deg, rgba(255,255,255,0) 355deg,
                      rgba(255,255,255,0.4) 360deg
                    )
                  `,
                }} />
                </>
              )}

              {isPerfect && (
                <span
                  className="font-bold"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: (showBadge || showTrophy) ? '7cqmin' : '9cqmin',
                    color: '#b08101',
                    animation: 'result-perfect-glow 1.5s 1.3s ease-in-out infinite both',
                  }}
                >
                  全問正解！
                </span>
              )}
              <span
                className="font-bold"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: (showBadge || showTrophy) ? '10cqmin' : '12cqmin',
                  color: '#333',
                  lineHeight: 1,
                }}
              >
                {correctCount}
                <span style={{ fontSize: (showBadge || showTrophy) ? '5cqmin' : '6cqmin', color: '#999' }}>
                  /{total}
                </span>
              </span>
              <span style={{ position: 'relative', zIndex: 1, fontSize: '3cqmin', color: '#666', marginTop: '0.5cqmin' }}>
                正解率：{rate}%
              </span>
            </div>

            {/* 右側: バッジカード（称号がない場合のみ） */}
            {showBadge && badgeResult.rank && badgeResult.badgeCategory && (
              <div
                className="flex flex-col items-center"
                style={{
                  flex: 1,
                  padding: '1.5cqmin 2cqmin',
                  borderRadius: '2cqmin',
                  background: 'linear-gradient(135deg, rgba(255,230,130,0.6) 0%, rgba(255,200,50,0.35) 100%)',
                  border: `0.3cqmin solid ${rankColor}55`,
                  animation: `result-badge-in 0.6s 2.0s both, result-badge-glow 2s 2.6s ease-in-out infinite both`,
                }}
              >
                <span
                  className="font-bold"
                  style={{ fontSize: '3cqmin', color: rankColor, textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
                >
                  {badgeResult.isRankUp ? 'ランクアップ！' : 'バッジ獲得！'}
                </span>
                <img
                  src={BADGE_IMAGES[badgeResult.badgeCategory][badgeResult.rank]}
                  alt={badgeResult.slotLabel}
                  style={{
                    width: '15cqmin',
                    height: '15cqmin',
                    objectFit: 'contain',
                    flexShrink: 0,
                    filter: 'drop-shadow(0 0.3cqmin 0.8cqmin rgba(0,0,0,0.3))',
                    margin: '0.5cqmin 0',
                  }}
                />
                <span
                  className="font-bold"
                  style={{
                    fontSize: '2.2cqmin',
                    color: '#555',
                    padding: '0.3cqmin 1.5cqmin',
                    borderRadius: '5cqmin',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {badgeResult.slotLabel} — {RANK_LABELS[badgeResult.rank]}
                </span>
              </div>
            )}

            {/* 右側: 称号カード（最上位のみ） */}
            {showTrophy && (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  position: 'relative',
                  width: '38cqmin',
                  aspectRatio: '1',
                  borderRadius: '2cqmin',
                  overflow: 'hidden',
                  flexShrink: 0,
                  animation: 'result-trophy-in 0.8s 2.8s both',
                }}
              >
                {/* 紫背景 */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                  background: 'radial-gradient(circle at center, rgba(220,200,255,0.9) 0%, rgba(147,51,234,0.4) 50%, rgba(100,20,180,0.6) 100%)',
                  borderRadius: '2cqmin',
                }} />
                {/* 白い放射状エフェクト */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '120%',
                  height: '120%',
                  zIndex: 0,
                  background: `conic-gradient(
                    from 0deg at 50% 50%,
                    rgba(255,255,255,0.3) 0deg, transparent 10deg,
                    transparent 20deg, rgba(255,255,255,0.3) 30deg,
                    transparent 40deg, transparent 50deg,
                    rgba(255,255,255,0.3) 60deg, transparent 70deg,
                    transparent 80deg, rgba(255,255,255,0.3) 90deg,
                    transparent 100deg, transparent 110deg,
                    rgba(255,255,255,0.3) 120deg, transparent 130deg,
                    transparent 140deg, rgba(255,255,255,0.3) 150deg,
                    transparent 160deg, transparent 170deg,
                    rgba(255,255,255,0.3) 180deg, transparent 190deg,
                    transparent 200deg, rgba(255,255,255,0.3) 210deg,
                    transparent 220deg, transparent 230deg,
                    rgba(255,255,255,0.3) 240deg, transparent 250deg,
                    transparent 260deg, rgba(255,255,255,0.3) 270deg,
                    transparent 280deg, transparent 290deg,
                    rgba(255,255,255,0.3) 300deg, transparent 310deg,
                    transparent 320deg, rgba(255,255,255,0.3) 330deg,
                    transparent 340deg, transparent 350deg,
                    rgba(255,255,255,0.3) 360deg
                  )`,
                  animation: 'result-swirl 8s linear infinite',
                }} />
                {/* 外側の渦巻風エフェクト（回転する白リング） */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '130%',
                  height: '130%',
                  zIndex: 0,
                  borderRadius: '50%',
                  border: '0.3cqmin solid rgba(255,255,255,0.15)',
                  boxShadow: 'inset 0 0 3cqmin rgba(255,255,255,0.2), 0 0 3cqmin rgba(255,255,255,0.1)',
                  animation: 'result-swirl 12s linear infinite reverse',
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '150%',
                  height: '150%',
                  zIndex: 0,
                  borderRadius: '50%',
                  border: '0.2cqmin dashed rgba(255,255,255,0.12)',
                  animation: 'result-swirl 20s linear infinite',
                }} />

                <span
                  className="font-bold"
                  style={{
                    position: 'relative', zIndex: 1,
                    fontSize: '3cqmin',
                    color: '#fff',
                    textShadow: '0 1px 4px rgba(100,0,180,0.6)',
                  }}
                >
                  称号獲得！
                </span>
                <img
                  src={getTrophyImage(badgeResult.masterAchievement!)}
                  alt={badgeResult.masterAchievement!}
                  style={{
                    position: 'relative', zIndex: 1,
                    width: '18cqmin',
                    height: '18cqmin',
                    objectFit: 'contain',
                    flexShrink: 0,
                    filter: 'drop-shadow(0 0.3cqmin 1cqmin rgba(147,51,234,0.5))',
                    margin: '0.5cqmin 0',
                  }}
                />
                <span
                  className="font-bold"
                  style={{
                    position: 'relative', zIndex: 1,
                    fontSize: '2.5cqmin',
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(100,0,180,0.5)',
                    padding: '0.3cqmin 1.5cqmin',
                    borderRadius: '5cqmin',
                    backgroundColor: 'rgba(147,51,234,0.35)',
                    border: '0.2cqmin solid rgba(255,255,255,0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {badgeResult.masterAchievement}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ===== ボタン3つ横並び（画面最下部固定） ===== */}
        <div
          className="flex items-center justify-center"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            gap: '2cqmin',
            padding: '1.5cqmin 4cqmin 2cqmin',
            animation: `result-fade-up 0.3s ${btnDelay}s both`,
          }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3cqmin',
              padding: '1.5cqmin 3.5cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid #ddd',
              background: 'white',
              color: '#666',
              boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
            }}
            onClick={goToTitle}
          >
            ← トップに戻る
          </button>
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3cqmin',
              padding: '1.5cqmin 3.5cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: accentGradient,
              color: 'white',
              boxShadow: 'inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.3), 0 0.3cqmin 0.8cqmin rgba(0,0,0,0.15)',
            }}
            onClick={() => goToSetting(modeCategory)}
          >
            もう一度
          </button>
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3cqmin',
              padding: '1.5cqmin 3.5cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: '#222',
              color: 'white',
              boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.2)',
            }}
            onClick={shareOnX}
          >
            𝕏 結果をシェア
          </button>
        </div>
      </div>
    </>
  )
}
