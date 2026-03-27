import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import {
  GEN2_SLOT_IDS,
  GEN1_SLOT_IDS,
  DORM_SLOT_IDS,
  BADGE_SLOTS,
  RANK_LABELS,
  type BadgeSlotDef,
} from '../../features/achievement/constants.ts'
import type { BadgeRank } from '../../features/achievement/types.ts'
import { formatTime } from '../../features/time-attack/constants.ts'

const RANK_BG: Record<BadgeRank, string> = {
  bronze: 'linear-gradient(135deg, #e8c49e 0%, #cd7f32 100%)',
  silver: 'linear-gradient(135deg, #e0e0e0 0%, #a0a0a0 100%)',
  gold: 'linear-gradient(135deg, #fff3a0 0%, #ffd700 50%, #daa520 100%)',
}

export function AchievementScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const { badges, isGen2Master, isGen1Master, isParerMaster, isTimeAttackUnlocked } = useBadgeStore()
  const taUnlocked = isTimeAttackUnlocked()
  const taBest = (() => {
    try {
      const raw = localStorage.getItem('parermaster2_ta_best')
      return raw ? Number(raw) : null
    } catch { return null }
  })()

  const slotsById = new Map(BADGE_SLOTS.map((s) => [s.id, s]))
  const gen2Slots = GEN2_SLOT_IDS.map((id) => slotsById.get(id)!)
  const gen1Slots = GEN1_SLOT_IDS.map((id) => slotsById.get(id)!)
  const dormSlots = DORM_SLOT_IDS.map((id) => slotsById.get(id)!)

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* ヘッダー */}
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
          onClick={goToTitle}
        >
          ◀ 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            marginLeft: '3cqmin',
            color: '#555',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          アチーブメント
        </span>
      </div>

      {/* メインパネル */}
      <div
        className="flex flex-col"
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
          gap: '2cqmin',
        }}
      >
        {/* 2期生エリア */}
        <AreaHeading label="2期生" color="#e8789e" />
        <BadgeGrid slots={gen2Slots} badges={badges} columns={2} />

        {/* 1期生エリア */}
        <AreaHeading label="1期生" color="#6aaa80" />
        <BadgeGrid slots={gen1Slots} badges={badges} columns={2} />

        {/* 寮別エリア */}
        <AreaHeading label="寮別" color="#5b8db8" />
        <BadgeGrid slots={dormSlots} badges={badges} columns={4} />

        {/* 総合称号 */}
        <div
          className="flex flex-col items-center"
          style={{ marginTop: '1cqmin', gap: '1cqmin' }}
        >
          <MasterTitle label="2期生マスター" achieved={isGen2Master()} />
          <MasterTitle label="1期生マスター" achieved={isGen1Master()} />
          <MasterTitle label="パレ学マスター" achieved={isParerMaster()} />
        </div>

        {/* タイムアタック自己ベスト */}
        <div
          className="flex flex-col items-center"
          style={{ marginTop: '1cqmin', gap: '0.5cqmin' }}
        >
          <span className="font-bold" style={{ fontSize: '3cqmin', color: taUnlocked ? '#e6a000' : '#ccc' }}>
            {taUnlocked ? '⏱️ タイムアタック' : '🔒 タイムアタック'}
          </span>
          {taUnlocked && (
            <span style={{ fontSize: '2.5cqmin', color: '#666' }}>
              {taBest != null ? (
                <>自己ベスト: <span className="font-bold" style={{ color: '#e6a000' }}>{formatTime(taBest)}</span></>
              ) : (
                '未プレイ'
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function AreaHeading({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="font-bold"
      style={{ fontSize: '3.5cqmin', color }}
    >
      {label}
    </span>
  )
}

function BadgeGrid({
  slots,
  badges,
  columns = 3,
}: {
  slots: BadgeSlotDef[]
  badges: Partial<Record<string, BadgeRank>>
  columns?: number
}) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1.5cqmin',
      }}
    >
      {slots.map((slot) => {
        const rank = badges[slot.id] ?? null
        return <BadgeSlotCard key={slot.id} slot={slot} rank={rank} />
      })}
    </div>
  )
}

function BadgeSlotCard({
  slot,
  rank,
}: {
  slot: BadgeSlotDef
  rank: BadgeRank | null
}) {
  // ラベルから世代プレフィックスを除去（「2期生・バゥ寮」→「バゥ寮」）
  const shortLabel = slot.label.replace(/^[12]期生・/, '')

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: '1.5cqmin 1cqmin',
        borderRadius: '2cqmin',
        background: rank ? RANK_BG[rank] : '#e8e8e8',
        opacity: rank ? 1 : 0.5,
        boxShadow: rank === 'gold'
          ? '0 0 1cqmin rgba(255, 215, 0, 0.5)'
          : rank === 'silver'
            ? '0 0 0.5cqmin rgba(160, 160, 160, 0.4)'
            : 'none',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontSize: '2.5cqmin',
          color: rank ? 'white' : '#999',
          textShadow: rank ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
          textAlign: 'center',
        }}
      >
        {shortLabel}
      </span>
      {rank && (
        <span
          style={{
            fontSize: '2cqmin',
            color: 'rgba(255,255,255,0.85)',
            marginTop: '0.3cqmin',
          }}
        >
          {RANK_LABELS[rank]}
        </span>
      )}
      {!rank && (
        <span style={{ fontSize: '2cqmin', color: '#bbb', marginTop: '0.3cqmin' }}>
          未獲得
        </span>
      )}
    </div>
  )
}

function MasterTitle({ label, achieved }: { label: string; achieved: boolean }) {
  return (
    <span
      className="font-bold"
      style={{
        fontSize: '3cqmin',
        color: achieved ? '#9333ea' : '#ccc',
        textShadow: achieved ? '0 1px 3px rgba(147,51,234,0.3)' : 'none',
      }}
    >
      {achieved ? `🏆 ${label}` : `🔒 ${label}`}
    </span>
  )
}
