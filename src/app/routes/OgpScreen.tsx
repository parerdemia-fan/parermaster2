import { useSettingsStore } from '../../stores/settingsStore.ts'

const BASE = import.meta.env.BASE_URL

const EMBLEMS = ['wa', 'me', 'co', 'wh'] as const

export function OgpScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '1200px',
        height: '630px',
        overflow: 'hidden',
      }}
    >
      {/* 背景画像 */}
      <img
        src={`${BASE}data/images/ui/bg_title.png`}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        draggable={false}
      />

      {/* 戻るボタン（スクショ時は画面外に出す or 切り取る） */}
      <button
        onClick={goToTitle}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
          fontSize: '14px',
          padding: '4px 12px',
          borderRadius: '4px',
          border: 'none',
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        ← 戻る
      </button>

      {/* 暗めオーバーレイ */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />

      {/* コンテンツ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
        }}
      >
        {/* メインロゴ */}
        <img
          src={`${BASE}data/images/ui/logo_title_landscape.png`}
          alt="パレ学マスター 2nd Season"
          style={{ height: '250px', width: 'auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          draggable={false}
        />

        {/* サブテキスト */}
        <p
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            letterSpacing: '0.1em',
          }}
        >
          パレデミア学園の寮生クイズゲーム
        </p>

        {/* 寮エンブレム */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {EMBLEMS.map((dorm) => (
            <img
              key={dorm}
              src={`${BASE}data/images/ui/emblem_${dorm}.webp`}
              alt=""
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.6)',
                background: 'rgba(0,0,0,0.3)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}
              draggable={false}
            />
          ))}
        </div>

        {/* キャッチコピー */}
        <p
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            letterSpacing: '0.05em',
          }}
        >
          顔当て・名前当て・知識クイズ…多彩な問題で遊ぼう！
        </p>
      </div>
    </div>
  )
}
