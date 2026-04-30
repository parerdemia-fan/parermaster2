import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useGameStore } from '../../stores/gameStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { formatTime, getTimeMessage, GRANDMASTER_THRESHOLD_MS } from '../../features/time-attack/constants.ts'
import { TROPHY_IMAGES } from '../../features/achievement/images.ts'
import { ConfettiCanvas } from '../../shared/components/ConfettiCanvas.tsx'
import { GAME_URL } from '../../shared/constants/urls.ts'
import { shareOnX as doShareOnX } from '../../shared/utils/share.ts'
import { playSound } from '../../shared/utils/sound.ts'

const TA_BEST_KEY = 'parermaster2_ta_best'

function loadBestTime(): number | null {
  try {
    const raw = localStorage.getItem(TA_BEST_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

function saveBestTime(ms: number): void {
  localStorage.setItem(TA_BEST_KEY, String(ms))
}

export function TimeAttackResultScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const playerName = useSettingsStore((s) => s.playerName)
  const getElapsedMs = useGameStore((s) => s.getElapsedMs)
  const isParerMaster = useBadgeStore((s) => s.isParerMaster)

  const [clearTime] = useState(() => getElapsedMs())
  const [prevBest] = useState(() => loadBestTime())
  const isNewRecord = prevBest == null || clearTime < prevBest

  const wasGrandMaster = prevBest != null && prevBest < GRANDMASTER_THRESHOLD_MS
  const isGrandMasterNew =
    isParerMaster() && clearTime < GRANDMASTER_THRESHOLD_MS && !wasGrandMaster

  // ベストタイム更新
  useEffect(() => {
    if (isNewRecord) saveBestTime(clearTime)
  }, [isNewRecord, clearTime])

  const bestTime = isNewRecord ? clearTime : prevBest!

  // グランドマスター演出: ResultScreen と同じテンポ（紙吹雪 1.5s, 称号カード 2.0s）
  const [showConfetti, setShowConfetti] = useState(false)
  const [showAward, setShowAward] = useState(false)
  useEffect(() => {
    if (!isGrandMasterNew) return
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => { setShowConfetti(true); playSound('perfect') }, 1500))
    timers.push(setTimeout(() => { setShowAward(true); playSound('levelup') }, 2000))
    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = () => {
    const message = getTimeMessage(clearTime)
    const recordText = isNewRecord ? ' 🎊自己ベスト更新！' : ''
    const grandText = isGrandMasterNew ? '\n🏆 パレ学グランドマスター達成！' : ''
    const text = `パレ学マスター 2nd Season タイムアタック\n⏱ ${formatTime(clearTime)}${recordText}${grandText}\n${playerName}: ${message}\n\n${GAME_URL}\n#パレ学マスター #パレ学`
    doShareOnX(text)
  }

  return (
    <>
      <style>{`
        @keyframes ta-trophy-swirl {
          0% { transform: translate(-50%,-50%) rotate(0deg); }
          100% { transform: translate(-50%,-50%) rotate(360deg); }
        }
      `}</style>

      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden animate-fade-in">
        {/* 紙吹雪（画面全体） */}
        {isGrandMasterNew && showConfetti && (
          <ConfettiCanvas triggerKey={1} repeat repeatInterval={1000} />
        )}

        {/* 背景パネル（グランドマスター達成時は横に拡張して右に称号カード） */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '4cqmin 6cqmin',
            borderRadius: '3cqmin',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
            border: '0.2cqmin solid rgba(255,255,255,0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'padding 0.6s ease-out',
          }}
        >
          {/* 上段: 左タイム情報 + 右称号カード（グランドマスター時のみ） */}
          <div
            className="flex items-center justify-center"
            style={{
              gap: showAward ? '4cqmin' : '0',
              transition: 'gap 0.8s ease-out',
            }}
          >
            {/* 左: タイム情報 */}
            <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
              {/* タイトル */}
              <span
                className="font-bold"
                style={{
                  fontSize: '5cqmin',
                  color: '#ffd700',
                  textShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.7)',
                  marginBottom: '1cqmin',
                }}
              >
                ⏱️ タイムアタック クリア！
              </span>

              {/* プレイヤー名 */}
              <span style={{ fontSize: '3cqmin', color: 'rgba(255,255,255,0.7)', marginBottom: '3cqmin' }}>
                {playerName}
              </span>

              {/* クリアタイム */}
              <span
                className="font-bold"
                style={{
                  fontSize: '12cqmin',
                  color: 'white',
                  textShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.5)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}
              >
                {formatTime(clearTime)}
              </span>

              {/* NEW RECORD */}
              {isNewRecord && (
                <span
                  className="font-bold animate-fade-in"
                  style={{
                    fontSize: '4cqmin',
                    color: '#ff6b6b',
                    textShadow: '0 0.2cqmin 0.5cqmin rgba(255,100,100,0.5)',
                    marginTop: '1cqmin',
                  }}
                >
                  🎉 NEW RECORD!
                </span>
              )}

              {/* 自己ベスト */}
              <div
                style={{
                  marginTop: '2cqmin',
                  fontSize: '3cqmin',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                自己ベスト: <span className="font-bold" style={{ color: '#ffd700' }}>{formatTime(bestTime)}</span>
              </div>

              {/* メッセージ */}
              <span
                style={{
                  marginTop: '2cqmin',
                  fontSize: '3.5cqmin',
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center',
                }}
              >
                {getTimeMessage(clearTime)}
              </span>
            </div>

            {/* 右: 称号カード（グランドマスター達成時のみ、横にスライドイン） */}
            {isGrandMasterNew && (
              <div
                style={{
                  maxWidth: showAward ? '40cqmin' : '0',
                  opacity: showAward ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-width 0.8s ease-out, opacity 0.6s ease-out 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    position: 'relative',
                    width: '38cqmin',
                    aspectRatio: '1',
                    borderRadius: '2cqmin',
                    overflow: 'hidden',
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
                    background: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.3) 0deg, transparent 10deg, transparent 30deg)',
                    animation: 'ta-trophy-swirl 8s linear infinite',
                  }} />
                  {/* 外側の渦巻風エフェクト */}
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
                    animation: 'ta-trophy-swirl 12s linear infinite reverse',
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
                    animation: 'ta-trophy-swirl 20s linear infinite',
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
                    src={TROPHY_IMAGES.grandmaster}
                    alt="パレ学グランドマスター"
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
                    🏆 パレ学グランドマスター
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="flex items-center" style={{ gap: '3cqmin', marginTop: '4cqmin' }}>
            <button
              className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
              style={{
                fontSize: '3.5cqmin',
                padding: '1.5cqmin 4cqmin',
                borderRadius: '5cqmin',
                border: '0.3cqmin solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
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
                background: '#1da1f2',
                color: 'white',
                boxShadow: '0 0.3cqmin 1cqmin rgba(29,161,242,0.4)',
              }}
              onClick={handleShare}
            >
              Xで共有
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
