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
import { formatTime } from '../../features/time-attack/constants.ts'

const RANK_BORDER: Record<BadgeRank, string> = {
  bronze: '#cd7f32',
  silver: '#a0a0a0',
  gold: '#daa520',
}

/** バッジの条件情報を生成 */
function getBadgeTooltip(slot: BadgeSlotDef, rank: BadgeRank | null): { title: string; condition: string } {
  const isDorm = slot.id.startsWith('dorm_')
  const area = isDorm ? slot.label : slot.label.replace(/・.*$/, '')
  const mode = slot.category === 'clear' ? '顔名前当て' : '知識クイズ'
  const diffLabels: Record<BadgeRank, string> = { bronze: 'ふつう', silver: 'むずかしい', gold: '激ムズ' }

  const targetRank = rank ?? 'bronze'

  if (slot.maxRank === 'bronze') {
    return { title: '', condition: `${area} ${mode} 全問正解` }
  }
  return { title: '', condition: `${area} ${mode} ${diffLabels[targetRank]} 全問正解` }
}

/** 称号の条件情報を生成 */
function getTitleTooltip(label: string): { title: string; condition: string } {
  if (label === '1期生マスター') {
    return { title: label, condition: '1期生 顔名前当て ゴールド\n+ 1期生 知識クイズ ゴールド' }
  }
  return { title: label, condition: '2期生 顔名前当て ゴールド\n+ 2期生 知識クイズ ブロンズ' }
}

const AREA_STYLES = {
  gen2: { label: '2期生', gradient: 'linear-gradient(180deg, #fcc4dc 0%, #e8789e 100%)' },
  gen1: { label: '1期生', gradient: 'linear-gradient(180deg, #a8dbb8 0%, #6aaa80 100%)' },
  dorm: { label: '寮別', gradient: 'linear-gradient(180deg, #b8d4e8 0%, #5b8db8 100%)' },
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
  const isGrandMaster = isParerMaster() && taBest != null && taBest < 5 * 60 * 1000
  const [tooltip, setTooltip] = useState<{ title: string; condition: string } | null>(null)

  const slotsById = new Map(BADGE_SLOTS.map((s) => [s.id, s]))
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
        style={{ gap: '2cqmin', padding: '2cqmin 2cqmin 2cqmin' }}
      >
        {/* 左カラム: バッジグリッド */}
        <div
          className="overflow-y-auto"
          style={{
            flex: 1,
            minHeight: 0,
            scrollbarWidth: 'none',
            borderRadius: '3cqmin',
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
            padding: '2cqmin',
          }}
        >
          <BadgeArea area={AREA_STYLES.gen1} slots={gen1Slots} badges={badges} columns={2} onShowTooltip={setTooltip} />
          <BadgeArea area={AREA_STYLES.gen2} slots={gen2Slots} badges={badges} columns={2} onShowTooltip={setTooltip} />
          <BadgeArea area={AREA_STYLES.dorm} slots={dormSlots} badges={badges} columns={4} onShowTooltip={setTooltip} />
        </div>

        {/* 右カラム: 称号 + タイムアタック */}
        <div
          className="flex flex-col"
          style={{
            width: '38%',
            minHeight: 0,
            borderRadius: '3cqmin',
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
            padding: '2.5cqmin',
            gap: '2cqmin',
          }}
        >
          {/* セクション見出し */}
          <div
            className="font-bold text-center text-white"
            style={{
              fontSize: '3.5cqmin',
              padding: '1cqmin 0',
              background: 'linear-gradient(180deg, #c4b5fd 0%, #9333ea 100%)',
              borderRadius: '1.5cqmin',
              border: '0.2cqmin solid rgba(255,255,255,0.4)',
              boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.25)',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              letterSpacing: '0.1em',
            }}
          >
            総合称号
          </div>

          {/* 称号カード */}
          <div className="flex flex-col" style={{ gap: '1.5cqmin' }}>
            <TitleCard label="1期生マスター" achieved={isGen1Master()} image={TROPHY_IMAGES.gen1} gradient="linear-gradient(135deg, #a8dbb8 0%, #6aaa80 100%)" onTap={() => setTooltip(getTitleTooltip('1期生マスター'))} />
            <TitleCard label="2期生マスター" achieved={isGen2Master()} image={TROPHY_IMAGES.gen2} gradient="linear-gradient(135deg, #fcc4dc 0%, #e8789e 100%)" onTap={() => setTooltip(getTitleTooltip('2期生マスター'))} />
          </div>

          {/* パレ学マスター / グランドマスター（シークレット: 達成時のみ表示、残りスペースを使う） */}
          {(isParerMaster() || isGrandMaster) && (
            <SecretMasterCard isGrandMaster={isGrandMaster} onTap={() => setTooltip(
              isGrandMaster
                ? { title: 'パレ学グランドマスター', condition: '1期生マスター 取得\n+ 2期生マスター 取得\n+ タイムアタック 5分以内クリア' }
                : { title: 'パレ学マスター', condition: '1期生マスター 取得\n+ 2期生マスター 取得' }
            )} />
          )}

          {/* タイムアタック */}
          <div
            className="flex flex-col items-center"
            style={{
              marginTop: 'auto',
              padding: '2cqmin',
              borderRadius: '2cqmin',
              background: taUnlocked
                ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(230,160,0,0.15) 100%)'
                : 'rgba(0,0,0,0.04)',
              border: taUnlocked
                ? '0.2cqmin solid rgba(230,160,0,0.3)'
                : '0.2cqmin solid rgba(0,0,0,0.08)',
              gap: '0.5cqmin',
            }}
          >
            <span className="font-bold" style={{ fontSize: '3cqmin', color: taUnlocked ? '#c48800' : '#bbb' }}>
              {taUnlocked ? '⏱️ タイムアタック' : '🔒 タイムアタック'}
            </span>
            {taUnlocked && (
              <span style={{ fontSize: '2.5cqmin', color: '#666' }}>
                {taBest != null ? (
                  <>自己ベスト: <span className="font-bold" style={{ color: '#c48800', fontSize: '3.5cqmin' }}>{formatTime(taBest)}</span></>
                ) : (
                  '未プレイ'
                )}
              </span>
            )}
          </div>
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
            className="text-center"
            style={{
              color: '#333',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              padding: '3cqmin 5cqmin',
              borderRadius: '2cqmin',
              boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {tooltip.title && (
              <div className="font-bold" style={{ fontSize: '4cqmin', marginBottom: '1.5cqmin' }}>
                {tooltip.title}
              </div>
            )}
            <div style={{ fontSize: '2.5cqmin', color: '#888', marginBottom: '0.5cqmin' }}>
              獲得条件
            </div>
            <div className="font-bold" style={{ fontSize: '3cqmin', whiteSpace: 'pre-line', lineHeight: 1.8, paddingLeft: '2cqmin', textAlign: 'left' }}>
              {tooltip.condition}
            </div>
          </div>
        </div>
      )}
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
}: {
  area: { label: string; gradient: string }
  slots: BadgeSlotDef[]
  badges: Partial<Record<string, BadgeRank>>
  columns: number
  onShowTooltip: (info: { title: string; condition: string }) => void
}) {
  return (
    <div style={{ marginBottom: '2cqmin' }}>
      <div
        className="font-bold text-center text-white"
        style={{
          fontSize: '3cqmin',
          padding: '0.8cqmin 0',
          background: area.gradient,
          borderRadius: '1.5cqmin',
          border: '0.2cqmin solid rgba(255,255,255,0.4)',
          boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.25)',
          textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          letterSpacing: '0.1em',
          marginBottom: '1.5cqmin',
        }}
      >
        {area.label}
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1.5cqmin',
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
  // 世代別: エリアバーで世代が分かるのでゲームモード名を表示
  // 寮別: 寮名を表示
  const isDorm = slot.id.startsWith('dorm_')
  const shortLabel = isDorm
    ? slot.label
    : slot.category === 'clear'
      ? '顔名前当て'
      : '知識クイズ'
  const imageMap = BADGE_IMAGES[slot.category]
  const imageSrc = rank && imageMap ? imageMap[rank] : null

  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer transition active:scale-95"
      onClick={onTap}
      style={{
        padding: '1.5cqmin 1cqmin',
        borderRadius: '2cqmin',
        background: rank === 'gold'
          ? 'linear-gradient(135deg, #fffcf0 0%, #ffe9a0 100%)'
          : rank === 'silver'
            ? 'linear-gradient(135deg, #f8f8f8 0%, #d8d8d8 100%)'
            : rank === 'bronze'
              ? 'linear-gradient(135deg, #faf0e4 0%, #e4c8a8 100%)'
              : 'rgba(200,200,200,0.3)',
        opacity: rank ? 1 : 0.6,
        border: rank
          ? `0.3cqmin solid ${RANK_BORDER[rank]}`
          : '0.2cqmin solid rgba(0,0,0,0.08)',
        boxShadow: rank === 'gold'
          ? '0 0 1.5cqmin rgba(255, 215, 0, 0.5)'
          : rank === 'silver'
            ? '0 0 0.8cqmin rgba(160, 160, 160, 0.4)'
            : 'none',
      }}
    >
      {/* バッジ画像 */}
      {imageSrc ? (
        <div style={{ position: 'relative', width: '8cqmin', height: '8cqmin' }}>
          <img
            src={imageSrc}
            alt={`${shortLabel} ${rank ? RANK_LABELS[rank] : ''}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
        <span style={{ fontSize: '5cqmin', lineHeight: 1 }}>🔒</span>
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
          fontSize: '2.5cqmin',
          color: rank ? '#444' : '#999',
          textAlign: 'center',
          marginTop: '0.3cqmin',
        }}
      >
        {shortLabel}
      </span>
      <span
        style={{
          fontSize: '2cqmin',
          color: rank ? RANK_BORDER[rank] : '#bbb',
          fontWeight: 'bold',
          marginTop: '0.2cqmin',
        }}
      >
        {rank ? RANK_LABELS[rank] : '未獲得'}
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
      className="flex items-center justify-center font-bold cursor-pointer transition active:scale-95"
      onClick={onTap}
      style={{
        padding: '2.5cqmin 2cqmin',
        borderRadius: '2cqmin',
        background: achieved ? gradient : 'rgba(200,200,200,0.4)',
        border: achieved
          ? '0.2cqmin solid rgba(255,255,255,0.5)'
          : '0.2cqmin solid rgba(0,0,0,0.08)',
        boxShadow: achieved
          ? 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.25)'
          : 'none',
        gap: '1.5cqmin',
      }}
    >
      {achieved ? (
        <img
          src={image}
          alt={label}
          style={{ height: '6cqmin', width: 'auto', flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          draggable={false}
        />
      ) : (
        <span style={{ fontSize: '5cqmin', lineHeight: 1, opacity: 0.5 }}>🔒</span>
      )}
      <span
        style={{
          fontSize: '3cqmin',
          color: achieved ? 'white' : '#bbb',
          textShadow: achieved ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        {label}
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
        gap: '1cqmin',
      }}
    >
      {/* キラキラエフェクト */}
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

      {/* トロフィー画像 */}
      <img
        src={image}
        alt={label}
        style={{
          width: isGrandMaster ? '28cqmin' : '21cqmin',
          height: isGrandMaster ? '28cqmin' : '21cqmin',
          objectFit: 'contain',
          zIndex: 2,
          filter: isGrandMaster ? 'drop-shadow(0 0 1cqmin rgba(255,150,150,0.6))' : 'drop-shadow(0 0 0.5cqmin rgba(255,215,0,0.5))',
        }}
        draggable={false}
      />

      {/* 称号名 */}
      <span
        className="font-bold"
        style={{
          fontSize: '3.5cqmin',
          color: isGrandMaster ? '#7c2d3e' : '#7c5a00',
          textShadow: '0 1px 3px rgba(255,255,255,0.5)',
          zIndex: 2,
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </span>
    </div>
  )
}
