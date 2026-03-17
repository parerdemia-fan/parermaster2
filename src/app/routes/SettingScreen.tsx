const BASE = import.meta.env.BASE_URL

interface SettingScreenProps {
  generation: 'gen1' | 'gen2'
  onBack: () => void
}

const DORMS = [
  { id: 'bau', label: 'バゥ', emblem: 'emblem_bau.webp' },
  { id: 'myu', label: 'ミュゥ', emblem: 'emblem_myu.webp' },
  { id: 'cu', label: 'クゥ', emblem: 'emblem_cu.webp' },
  { id: 'winnie', label: 'ウィニー', emblem: 'emblem_winnie.webp' },
] as const

export function SettingScreen({ generation, onBack }: SettingScreenProps) {
  const genLabel = generation === 'gen2' ? '2期生' : '1期生'
  const accentColor = generation === 'gen2' ? '#e8789e' : '#6aaa80'
  const accentGradient =
    generation === 'gen2'
      ? 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)'
      : 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)'

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* ヘッダー: 戻るボタン + 世代名 */}
      <div
        className="w-full flex items-center"
        style={{ padding: '2cqmin 3cqmin 0' }}
      >
        <button
          className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
          style={{
            fontSize: '4cqmin',
            padding: '1cqmin 2cqmin',
            borderRadius: '2cqmin',
            border: 'none',
            background: 'rgba(255,255,255,0.6)',
            color: '#555',
          }}
          onClick={onBack}
        >
          ◀ 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            marginLeft: '3cqmin',
            color: accentColor,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {genLabel}
        </span>
      </div>

      {/* メインパネル */}
      <div
        className="flex flex-col items-center"
        style={{
          marginTop: '2cqmin',
          width: '88%',
          maxHeight: '82%',
          padding: '3cqmin 4cqmin',
          borderRadius: '3cqmin',
          backgroundColor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
          overflowY: 'auto',
        }}
      >
        {/* ── ゲーム ── */}
        <SectionHeading label="ゲーム" />
        <div className="flex items-center justify-center" style={{ gap: '3cqmin' }}>
          <PillButton label="顔名前当て" selected accentColor={accentColor} />
          <PillButton label="知識クイズ" selected={false} accentColor={accentColor} />
        </div>

        {/* ── 出題範囲 ── */}
        <SectionHeading label="出題範囲" />
        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: '2cqmin' }}
        >
          {DORMS.map((dorm) => (
            <DormButton key={dorm.id} label={dorm.label} emblem={dorm.emblem} selected={false} accentColor={accentColor} />
          ))}
          <PillButton label="全員" selected accentColor={accentColor} size="small" />
        </div>

        {/* ── 難易度 ── */}
        <SectionHeading label="難易度" />
        <div className="flex items-center justify-center" style={{ gap: '2cqmin' }}>
          <PillButton label="★☆☆" selected accentColor={accentColor} size="small" />
          <PillButton label="★★☆" selected={false} accentColor={accentColor} size="small" />
          <PillButton label="🔒 ★★★" selected={false} accentColor={accentColor} size="small" locked />
        </div>

        {/* スタートボタン */}
        <button
          className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
          style={{
            marginTop: '3cqmin',
            width: '40cqmin',
            height: '9cqmin',
            fontSize: '4.5cqmin',
            borderRadius: '5cqmin',
            border: '0.3cqmin solid rgba(255,255,255,0.5)',
            background: accentGradient,
            color: 'white',
            boxShadow:
              'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          スタート！
        </button>

        {/* プレイヤー名 */}
        <div
          className="flex items-center justify-center"
          style={{
            marginTop: '2cqmin',
            fontSize: '3cqmin',
            color: '#666',
            gap: '1.5cqmin',
          }}
        >
          <span>あなたの名前:</span>
          <span className="font-bold" style={{ color: '#333' }}>リスナー</span>
          <button
            className="cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '2.5cqmin',
              padding: '0.5cqmin 1.5cqmin',
              borderRadius: '1.5cqmin',
              border: '1px solid #ccc',
              background: 'white',
              color: '#888',
            }}
          >
            変更
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── サブコンポーネント ─── */

function SectionHeading({ label }: { label: string }) {
  return (
    <div
      className="w-full flex items-center"
      style={{
        margin: '2cqmin 0 1.5cqmin',
        gap: '2cqmin',
      }}
    >
      <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
      <span
        style={{
          fontSize: '3cqmin',
          color: '#999',
          whiteSpace: 'nowrap',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
    </div>
  )
}

function PillButton({
  label,
  selected,
  accentColor,
  size = 'normal',
  locked = false,
}: {
  label: string
  selected: boolean
  accentColor: string
  size?: 'normal' | 'small'
  locked?: boolean
}) {
  const isSmall = size === 'small'
  const height = isSmall ? '7cqmin' : '9cqmin'
  const fontSize = isSmall ? '3.2cqmin' : '4cqmin'

  return (
    <button
      className="font-bold transition"
      style={{
        height,
        fontSize,
        padding: isSmall ? '0 2.5cqmin' : '0 3.5cqmin',
        borderRadius: '5cqmin',
        border: selected
          ? `0.3cqmin solid ${accentColor}`
          : '0.3cqmin solid #ddd',
        background: locked
          ? '#e0e0e0'
          : selected
            ? accentColor
            : 'white',
        color: locked
          ? '#aaa'
          : selected
            ? 'white'
            : '#666',
        cursor: locked ? 'not-allowed' : 'default',
        boxShadow: selected
          ? '0 0.2cqmin 0.6cqmin rgba(0,0,0,0.12)'
          : 'none',
        opacity: locked ? 0.7 : 1,
      }}
      disabled={locked}
    >
      {label}
    </button>
  )
}

function DormButton({
  label,
  emblem,
  selected,
  accentColor,
}: {
  label: string
  emblem: string
  selected: boolean
  accentColor: string
}) {
  return (
    <button
      className="font-bold flex items-center transition"
      style={{
        height: '7cqmin',
        fontSize: '3.2cqmin',
        padding: '0 2.5cqmin',
        borderRadius: '5cqmin',
        border: selected
          ? `0.3cqmin solid ${accentColor}`
          : '0.3cqmin solid #ddd',
        background: selected ? accentColor : 'white',
        color: selected ? 'white' : '#666',
        cursor: 'default',
        boxShadow: selected
          ? '0 0.2cqmin 0.6cqmin rgba(0,0,0,0.12)'
          : 'none',
        gap: '1cqmin',
      }}
    >
      <img
        src={`${BASE}data/images/ui/${emblem}`}
        alt={`${label}寮紋章`}
        style={{ height: '3.5cqmin', width: 'auto' }}
        draggable={false}
      />
      {label}
    </button>
  )
}

