import { useState } from 'react'
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
import { BADGE_IMAGES, TROPHY_IMAGES } from '../../features/achievement/images.ts'
import { formatTime, GRANDMASTER_THRESHOLD_MS } from '../../features/time-attack/constants.ts'

const RANK_BORDER: Record<BadgeRank, string> = {
  bronze: '#cd7f32',
  silver: '#a0a0a0',
  gold: '#daa520',
}

type TooltipInfo = {
  title: string
  condition: string
  imageSrc?: string
  imageSize?: string
  rankLabel?: string
}

/** バッジの条件情報を生成 */
function getBadgeTooltip(slot: BadgeSlotDef, rank: BadgeRank | null): TooltipInfo {
  const isDorm = slot.id.startsWith('dorm_')
  const area = isDorm ? slot.label : slot.label.replace(/・.*$/, '')
  const mode = slot.category === 'clear' ? '顔名前当て' : '知識クイズ'
  // 2期生知識クイズのみ難易度ラベルが { きほん / ふつう / むずかしい }。
  // 2期生顔名前当ては1期生と同じ { ふつう / むずかしい / 激ムズ }。
  const isGen2Knowledge = slot.id === 'gen2_knowledge'
  const diffLabels: Record<BadgeRank, string> = isGen2Knowledge
    ? { bronze: 'きほん', silver: 'ふつう', gold: 'むずかしい' }
    : { bronze: 'ふつう', silver: 'むずかしい', gold: '激ムズ' }
  const shortLabel = isDorm ? slot.label : `${area} ${mode}`

  const imageMap = BADGE_IMAGES[slot.category]
  const imageSrc = rank && imageMap ? imageMap[rank] : undefined
  const rankLabel = rank ? RANK_LABELS[rank] : undefined
  const targetRank = rank ?? 'bronze'

  const condition = slot.maxRank === 'bronze'
    ? `${area} ${mode} 全問正解`
    : `${area} ${mode} ${diffLabels[targetRank]} 全問正解`

  return { title: shortLabel, condition, imageSrc, imageSize: '12cqmin', rankLabel }
}

/** 称号の条件情報を生成 */
function getTitleTooltip(label: string): TooltipInfo {
  if (label === '1期生マスター') {
    return { title: label, condition: '1期生 顔名前当て ゴールド\n+ 1期生 知識クイズ ゴールド', imageSrc: TROPHY_IMAGES.gen1, imageSize: '18cqmin' }
  }
  return { title: label, condition: '2期生 顔名前当て ゴールド\n+ 2期生 知識クイズ シルバー', imageSrc: TROPHY_IMAGES.gen2, imageSize: '18cqmin' }
}

const AREA_STYLES = {
  gen2: { label: '2期生', gradient: 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)' },
  gen1: { label: '1期生', gradient: 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)' },
  dorm: { label: '寮別', gradient: 'linear-gradient(180deg, #b8d4e8 0%, #7aabc4 40%, #5b8db8 100%)' },
}

/** ランク別カードスタイル（世代スロット用） */
const RANK_CARD_STYLES: Record<BadgeRank, { gradient: string; shadow: string }> = {
  gold: {
    gradient: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 50%, #ffd54f 100%)',
    shadow: 'rgba(200,170,0,0.4)',
  },
  silver: {
    gradient: 'linear-gradient(135deg, #fafafa 0%, #e0e0e0 50%, #c8c8c8 100%)',
    shadow: 'rgba(140,140,140,0.3)',
  },
  bronze: {
    gradient: 'linear-gradient(135deg, #faf0e4 0%, #dbb896 50%, #c8a070 100%)',
    shadow: 'rgba(170,120,60,0.3)',
  },
}

/** 寮別カードスタイル（寮生一覧のセクションラベルと同じテーマカラー） */
const DORM_CARD_STYLES: Record<string, { gradient: string; border: string; shadow: string }> = {
  dorm_wa: {
    gradient: 'linear-gradient(135deg, #fecaca 0%, #f87171 50%, #ef4444 100%)',
    border: '#dc2626',
    shadow: 'rgba(220,38,38,0.4)',
  },
  dorm_me: {
    gradient: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #f472b6 100%)',
    border: '#e44d95',
    shadow: 'rgba(228,77,149,0.4)',
  },
  dorm_co: {
    gradient: 'linear-gradient(135deg, #cffafe 0%, #67e8f9 50%, #22d3ee 100%)',
    border: '#0ea5cf',
    shadow: 'rgba(14,165,207,0.4)',
  },
  dorm_wh: {
    gradient: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #22c55e 100%)',
    border: '#16a34a',
    shadow: 'rgba(22,163,74,0.4)',
  },
}

const SLOTS_BY_ID = new Map(BADGE_SLOTS.map((s) => [s.id, s]))

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
  const isGrandMaster = isParerMaster() && taBest != null && taBest < GRANDMASTER_THRESHOLD_MS
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  const slotsById = SLOTS_BY_ID
  const gen2Slots = GEN2_SLOT_IDS.map((id) => slotsById.get(id)!)
  const gen1Slots = GEN1_SLOT_IDS.map((id) => slotsById.get(id)!)
  const dormSlots = DORM_SLOT_IDS.map((id) => slotsById.get(id)!)

  return (
    <div className="relative w-full h-full flex flex-col animate-fade-in">
      {/* ヘッダー */}
      <div
        className="w-full flex items-center shrink-0"
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
          実績
        </span>
      </div>

      {/* メインコンテンツ: 横2カラム */}
      <div
        className="flex-1 flex overflow-hidden"
        style={{ gap: '2cqmin', padding: '2cqmin' }}
      >
        {/* 左カラム: バッジグリッド + タイムアタック */}
        <div
          className="flex flex-col"
          style={{
            width: '52%',
            minHeight: 0,
            borderRadius: '3cqmin',
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
            padding: '1.5cqmin',
            gap: '1cqmin',
          }}
        >
          <BadgeArea area={AREA_STYLES.gen1} slots={gen1Slots} badges={badges} columns={2} onShowTooltip={setTooltip} hidden={!gen1Slots.some((s) => badges[s.id])} />
          <BadgeArea area={AREA_STYLES.gen2} slots={gen2Slots} badges={badges} columns={2} onShowTooltip={setTooltip} hidden={!gen2Slots.some((s) => badges[s.id])} />

          {/* 寮別 + タイムアタック横並び */}
          <div style={{ display: 'flex', gap: '1cqmin' }}>
            <div style={{ flex: 1 }}>
              <RibbonHeader gradient={AREA_STYLES.dorm.gradient} label={dormSlots.some((s) => badges[s.id]) ? AREA_STYLES.dorm.label : '？？？'} />
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1cqmin' }}>
                {dormSlots.map((slot) => {
                  const rank = badges[slot.id] ?? null
                  return <BadgeSlotCard key={slot.id} slot={slot} rank={rank} onTap={() => setTooltip(getBadgeTooltip(slot, rank))} />
                })}
              </div>
            </div>
            <div className="flex flex-col" style={{ width: '28%' }}>
              <RibbonHeader
                gradient={taUnlocked
                  ? 'linear-gradient(180deg, #ffd700 0%, #ffb700 40%, #e6a000 100%)'
                  : 'linear-gradient(180deg, #d0d0d0 0%, #b0b0b0 40%, #999 100%)'}
                label={taUnlocked ? 'TA' : '？？？'}
              />
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  flex: 1,
                  padding: '1cqmin',
                  borderRadius: '2cqmin',
                  background: taUnlocked
                    ? 'linear-gradient(135deg, #fff8e1 0%, #ffe082 50%, #ffd54f 100%)'
                    : 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%)',
                  border: taUnlocked
                    ? '0.3cqmin solid rgba(255,215,0,0.6)'
                    : '0.3cqmin solid rgba(0,0,0,0.08)',
                  boxShadow: taUnlocked
                    ? 'inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.4), 0 0.3cqmin 0.8cqmin rgba(200,170,0,0.3)'
                    : 'inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.2)',
                  opacity: taUnlocked ? 1 : 0.6,
                  gap: '0.3cqmin',
                }}
              >
                <span style={{ fontSize: '4cqmin', lineHeight: 1 }}>
                  {taUnlocked ? '⏱️' : '🔒'}
                </span>
                {taUnlocked && (
                  <span style={{ fontSize: '2cqmin', color: '#666', textAlign: 'center', marginTop: '0.3cqmin' }}>
                    {taBest != null ? (
                      <>自己ベスト<br /><span className="font-bold" style={{ color: '#c48800', fontSize: '2.8cqmin' }}>{formatTime(taBest)}</span></>
                    ) : (
                      '未プレイ'
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右カラム: 称号 */}
        <div
          className="flex flex-col"
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: '3cqmin',
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
            padding: '1.5cqmin',
            gap: '1.5cqmin',
          }}
        >
          <RibbonHeader
            gradient="linear-gradient(180deg, #d4c4ff 0%, #a855f7 40%, #7e22ce 100%)"
            label={(isGen1Master() || isGen2Master()) ? '総合称号' : '？？？'}
          />

          <TitleCard label="1期生マスター" achieved={isGen1Master()} image={TROPHY_IMAGES.gen1} gradient="linear-gradient(135deg, #a8dbb8 0%, #7cbf96 50%, #6aaa80 100%)" onTap={() => setTooltip(getTitleTooltip('1期生マスター'))} />
          <TitleCard label="2期生マスター" achieved={isGen2Master()} image={TROPHY_IMAGES.gen2} gradient="linear-gradient(135deg, #fcc4dc 0%, #f49aba 50%, #e8789e 100%)" onTap={() => setTooltip(getTitleTooltip('2期生マスター'))} />

          {(isParerMaster() || isGrandMaster) && (
            <SecretMasterCard isGrandMaster={isGrandMaster} onTap={() => setTooltip(
              isGrandMaster
                ? { title: 'パレ学グランドマスター', condition: '1期生マスター 取得\n+ 2期生マスター 取得\n+ タイムアタック 7分切り', imageSrc: TROPHY_IMAGES.grandmaster, imageSize: '25cqmin' }
                : { title: 'パレ学マスター', condition: '1期生マスター 取得\n+ 2期生マスター 取得', imageSrc: TROPHY_IMAGES.master, imageSize: '25cqmin' }
            )} />
          )}
        </div>
      </div>

      {/* 条件ポップアップ */}
      {tooltip && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 50 }}
          onClick={() => setTooltip(null)}
        >
          <div
            className="flex flex-col items-center"
            style={{
              color: '#333',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              padding: '3cqmin 5cqmin',
              borderRadius: '3cqmin',
              boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.25)',
              minWidth: '25cqmin',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {tooltip.imageSrc && (
              <img
                src={tooltip.imageSrc}
                alt=""
                style={{ width: tooltip.imageSize ?? '25cqmin', height: tooltip.imageSize ?? '25cqmin', objectFit: 'contain', marginBottom: '0.5cqmin' }}
                draggable={false}
              />
            )}
            {tooltip.title && (
              <div className="font-bold" style={{ fontSize: '3cqmin', marginBottom: '1cqmin' }}>
                {tooltip.title}
              </div>
            )}
            {tooltip.rankLabel && (
              <div className="font-bold" style={{ fontSize: '3.5cqmin', color: '#8a6500', marginBottom: '1.5cqmin' }}>
                {tooltip.rankLabel}
              </div>
            )}
            <div style={{ width: '80%', height: '1px', background: 'linear-gradient(90deg, transparent, #ccc, transparent)', marginBottom: '1.5cqmin' }} />
            <div style={{ fontSize: '2.5cqmin', color: '#888', marginBottom: '0.5cqmin' }}>
              獲得条件
            </div>
            <div className="font-bold" style={{ fontSize: '2.5cqmin', whiteSpace: 'pre-line', lineHeight: 1.8, textAlign: 'center' }}>
              {tooltip.condition}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── リボン型見出し ── */

function RibbonHeader({ gradient, label }: { gradient: string; label: string }) {
  return (
    <div
      className="font-bold text-center text-white"
      style={{
        fontSize: '3cqmin',
        padding: '0.8cqmin 4cqmin',
        background: gradient,
        clipPath: 'polygon(3% 0%, 97% 0%, 100% 50%, 97% 100%, 3% 100%, 0% 50%)',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        letterSpacing: '0.1em',
        marginBottom: '1cqmin',
      }}
    >
      {label}
    </div>
  )
}

/* ── バッジエリア（見出し + グリッド） ── */

function BadgeArea({
  area,
  slots,
  badges,
  columns,
  onShowTooltip,
  hidden = false,
}: {
  area: { label: string; gradient: string }
  slots: BadgeSlotDef[]
  badges: Partial<Record<string, BadgeRank>>
  columns: number
  onShowTooltip: (info: TooltipInfo) => void
  hidden?: boolean
}) {
  return (
    <div>
      <RibbonHeader gradient={area.gradient} label={hidden ? '？？？' : area.label} />
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1cqmin',
        }}
      >
        {slots.map((slot) => {
          const rank = badges[slot.id] ?? null
          return <BadgeSlotCard key={slot.id} slot={slot} rank={rank} onTap={() => onShowTooltip(getBadgeTooltip(slot, rank))} />
        })}
      </div>
    </div>
  )
}

/* ── バッジカード ── */

function BadgeSlotCard({
  slot,
  rank,
  onTap,
}: {
  slot: BadgeSlotDef
  rank: BadgeRank | null
  onTap: () => void
}) {
  const isDorm = slot.id.startsWith('dorm_')
  const shortLabel = isDorm
    ? slot.label
    : slot.category === 'clear'
      ? '顔名前当て'
      : '知識クイズ'
  const imageMap = BADGE_IMAGES[slot.category]
  const imageSrc = rank && imageMap ? imageMap[rank] : null

  let cardBg: string
  let cardBorder: string
  let cardShadow: string

  if (!rank) {
    cardBg = 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%)'
    cardBorder = 'rgba(0,0,0,0.08)'
    cardShadow = 'inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.2)'
  } else if (isDorm && DORM_CARD_STYLES[slot.id]) {
    const dorm = DORM_CARD_STYLES[slot.id]
    cardBg = dorm.gradient
    cardBorder = dorm.border
    cardShadow = `inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.4), 0 0.3cqmin 0.8cqmin ${dorm.shadow}`
  } else {
    const rankStyle = RANK_CARD_STYLES[rank]
    cardBg = rankStyle.gradient
    cardBorder = RANK_BORDER[rank]
    cardShadow = `inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.4), 0 0.3cqmin 0.8cqmin ${rankStyle.shadow}`
  }

  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer transition active:scale-95"
      onClick={onTap}
      style={{
        padding: '1cqmin 0.5cqmin',
        borderRadius: '2cqmin',
        background: cardBg,
        opacity: rank ? 1 : 0.6,
        border: `0.3cqmin solid ${cardBorder}`,
        boxShadow: cardShadow,
      }}
    >
      {imageSrc ? (
        <div style={{
          position: 'relative',
          width: '8cqmin',
          height: '8cqmin',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.35)',
          border: '0.2cqmin solid rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={imageSrc}
            alt={`${shortLabel} ${rank ? RANK_LABELS[rank] : ''}`}
            style={{ width: '6.5cqmin', height: '6.5cqmin', objectFit: 'contain' }}
            draggable={false}
          />
          {(rank === 'gold' || rank === 'silver') && (
            <div
              style={{
                position: 'absolute',
                inset: '-1cqmin',
                pointerEvents: 'none',
                animation: rank === 'gold' ? 'badge-sparkle 2s ease-in-out infinite' : 'badge-sparkle 3s ease-in-out infinite',
                opacity: rank === 'gold' ? 0.8 : 0.4,
                color: rank === 'gold' ? '#ffd700' : '#c0c0c0',
              }}
            >
              <span style={{ position: 'absolute', top: '0', right: '10%', fontSize: '2cqmin' }}>✦</span>
              <span style={{ position: 'absolute', bottom: '5%', left: '5%', fontSize: '1.5cqmin' }}>✧</span>
              <span style={{ position: 'absolute', top: '30%', right: '0', fontSize: '1.2cqmin' }}>✦</span>
              {rank === 'gold' && (
                <span style={{ position: 'absolute', bottom: '20%', right: '15%', fontSize: '1.8cqmin' }}>✧</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: '8cqmin', height: '8cqmin', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '5cqmin', lineHeight: 1 }}>🔒</span>
        </div>
      )}
      <style>{`
        @keyframes badge-sparkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      <span
        className="font-bold"
        style={{
          fontSize: '2.2cqmin',
          color: rank ? '#444' : '#999',
          textAlign: 'center',
          marginTop: '0.2cqmin',
        }}
      >
        {rank ? shortLabel : '？？？'}
      </span>
    </div>
  )
}

/* ── 称号カード ── */

function TitleCard({
  label,
  achieved,
  image,
  gradient,
  onTap,
}: {
  label: string
  achieved: boolean
  image: string
  gradient: string
  onTap?: () => void
}) {
  return (
    <div
      className="flex flex-col items-center justify-center font-bold cursor-pointer transition active:scale-95"
      onClick={onTap}
      style={{
        position: 'relative',
        flex: 1,
        borderRadius: '2cqmin',
        background: achieved
          ? `radial-gradient(ellipse at center 45%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.4) 55%, transparent 75%), ${gradient}`
          : 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%)',
        border: achieved
          ? '0.3cqmin solid rgba(255,255,255,0.5)'
          : '0.3cqmin solid rgba(0,0,0,0.08)',
        boxShadow: achieved
          ? 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.3cqmin 0.8cqmin rgba(0,0,0,0.15)'
          : 'inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.2)',
        overflow: 'hidden',
      }}
    >
      {achieved ? (
        <img
          src={image}
          alt={label}
          style={{ height: '70%', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}
          draggable={false}
        />
      ) : (
        <span style={{ height: '70%', display: 'flex', alignItems: 'center', fontSize: '8cqmin', lineHeight: 1, opacity: 0.5 }}>🔒</span>
      )}
      <span
        style={{
          position: 'absolute',
          bottom: '1cqmin',
          fontSize: '3cqmin',
          color: achieved ? 'white' : '#bbb',
          textShadow: achieved
            ? '0 1px 3px rgba(0,0,0,0.4), 0 0 6px rgba(0,0,0,0.2)'
            : 'none',
          letterSpacing: '0.05em',
        }}
      >
        {achieved ? label : '？？？'}
      </span>
    </div>
  )
}

/* ── シークレット最上位称号（パレ学マスター / グランドマスター） ── */

function SecretMasterCard({
  isGrandMaster,
  onTap,
}: {
  isGrandMaster: boolean
  onTap: () => void
}) {
  const image = isGrandMaster ? TROPHY_IMAGES.grandmaster : TROPHY_IMAGES.master
  const label = isGrandMaster ? 'パレ学グランドマスター' : 'パレ学マスター'
  const gradient = isGrandMaster
    ? 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 30%, #ff9a9e 70%, #fad0c4 100%)'
    : 'linear-gradient(135deg, #fff3a0 0%, #ffd700 50%, #daa520 100%)'

  const sparkles = isGrandMaster
    ? [
        { top: '-5%', left: '10%', size: '3cqmin', delay: '0s' },
        { top: '5%', right: '5%', size: '2.5cqmin', delay: '0.3s' },
        { bottom: '10%', left: '5%', size: '2cqmin', delay: '0.6s' },
        { top: '20%', left: '25%', size: '1.8cqmin', delay: '0.9s' },
        { bottom: '5%', right: '15%', size: '2.5cqmin', delay: '0.4s' },
        { top: '-3%', right: '25%', size: '2cqmin', delay: '0.7s' },
        { bottom: '25%', left: '15%', size: '1.5cqmin', delay: '1.1s' },
        { top: '40%', right: '8%', size: '1.8cqmin', delay: '0.2s' },
      ]
    : [
        { top: '-5%', left: '15%', size: '2.5cqmin', delay: '0s' },
        { top: '10%', right: '10%', size: '2cqmin', delay: '0.5s' },
        { bottom: '10%', left: '10%', size: '1.8cqmin', delay: '1s' },
        { bottom: '5%', right: '20%', size: '2cqmin', delay: '0.3s' },
      ]

  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer transition active:scale-98"
      onClick={onTap}
      style={{
        flex: 1,
        position: 'relative',
        borderRadius: '2cqmin',
        background: gradient,
        border: '0.3cqmin solid rgba(255,255,255,0.6)',
        boxShadow: isGrandMaster
          ? 'inset 0 0.5cqmin 1cqmin rgba(255,255,255,0.4), 0 0 2cqmin rgba(255,150,150,0.5), 0 0 4cqmin rgba(255,200,100,0.3)'
          : 'inset 0 0.5cqmin 1cqmin rgba(255,255,255,0.4), 0 0 2cqmin rgba(255,215,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {sparkles.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            ...s,
            fontSize: s.size,
            color: isGrandMaster ? '#ff8c94' : '#ffd700',
            pointerEvents: 'none',
            animation: `master-sparkle 2s ease-in-out ${s.delay} infinite`,
            zIndex: 1,
          }}
        >
          {i % 2 === 0 ? '✦' : '✧'}
        </span>
      ))}
      <style>{`
        @keyframes master-sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      <img
        src={image}
        alt={label}
        style={{
          height: '80%',
          maxHeight: '25cqmin',
          width: 'auto',
          objectFit: 'contain',
          zIndex: 2,
          filter: isGrandMaster ? 'drop-shadow(0 0 1cqmin rgba(255,150,150,0.6))' : 'drop-shadow(0 0 0.5cqmin rgba(255,215,0,0.5))',
        }}
        draggable={false}
      />

      <span
        className="font-bold"
        style={{
          position: 'absolute',
          bottom: '1cqmin',
          fontSize: '3cqmin',
          color: 'white',
          textShadow: isGrandMaster
            ? '0 1px 3px rgba(124,45,62,0.6), 0 0 8px rgba(124,45,62,0.3)'
            : '0 1px 3px rgba(124,90,0,0.6), 0 0 8px rgba(124,90,0,0.3)',
          zIndex: 2,
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </span>
    </div>
  )
}
