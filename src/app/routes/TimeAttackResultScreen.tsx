import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useGameStore } from '../../stores/gameStore.ts'
import { formatTime, getTimeMessage } from '../../features/time-attack/constants.ts'

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

  const [clearTime] = useState(() => getElapsedMs())
  const [prevBest] = useState(() => loadBestTime())
  const isNewRecord = prevBest == null || clearTime < prevBest

  // ベストタイム更新
  useEffect(() => {
    if (isNewRecord) saveBestTime(clearTime)
  }, [isNewRecord, clearTime])

  const bestTime = isNewRecord ? clearTime : prevBest!

  const handleShare = () => {
    const message = getTimeMessage(clearTime)
    const text = `${playerName}: ${message}\n\nパレ学マスター 2nd Season タイムアタック\nクリアタイム: ${formatTime(clearTime)}\n\n#パレ学マスター`
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden animate-fade-in">
      {/* 背景パネル */}
      <div
        className="flex flex-col items-center"
        style={{
          padding: '4cqmin 8cqmin',
          borderRadius: '3cqmin',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          border: '0.2cqmin solid rgba(255,255,255,0.15)',
        }}
      >
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
  )
}
