import { useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { useQuestionHistoryStore, type ClearedRecords, type HistoryRecords } from '../../stores/questionHistoryStore.ts'
import { useQuestions } from '../../shared/hooks/useQuestions.ts'
import type { QuestionData } from '../../shared/types/question.ts'
import {
  buildStarBreakdown,
  countClearedQuestions,
  filterByGeneration,
  type GenerationFilter,
} from '../../features/achievement/clearedStats.ts'
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

/**
 * ポップアップ内のサイズ単位。ポップアップは 4:3 コンテナの外（body 直下）に出すため、
 * コンテナ基準の cqmin ではなくビューポート基準で決める。
 *
 * - `1dvmin`: デスクトップの見た目（コンテナ基準だった頃と同値）
 * - `5.5px`: モバイルでも読めるようにする下限
 * - `1.55dvw` / `1.38dvh`: 最も背が高い内訳ポップアップ（約 59 × 68 単位）が
 *   画面の 92% × 94% に収まるようにする上限。内容の行数を増やすときは要再計算
 */
const TIP_UNIT = 'min(max(1dvmin, 5.5px), 1.55dvw, 1.38dvh)'

/** ポップアップ内のサイズ指定（TIP_UNIT の n 倍） */
function tu(n: number): string {
  return `calc(${n} * var(--tip-unit))`
}

const RANK_BORDER: Record<BadgeRank, string> = {
  bronze: '#cd7f32',
  silver: '#a0a0a0',
  gold: '#daa520',
}

/** 正解済み内訳パネルに渡す集計元データ */
type ClearedStatsSource = {
  questions: readonly QuestionData[]
  cleared: ClearedRecords
  records: HistoryRecords
}

type TooltipInfo = {
  title: string
  condition: string
  /** 条件文の見出し（省略時は見出しなし） */
  conditionLabel?: string
  imageSrc?: string
  /** 画像サイズ（TIP_UNIT 倍率） */
  imageSize?: number
  rankLabel?: string
  /** 指定すると★別内訳パネルを表示する */
  clearedStats?: ClearedStatsSource
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

  return { title: shortLabel, condition, conditionLabel: '獲得条件', imageSrc, imageSize: 12, rankLabel }
}

/** 称号の条件情報を生成 */
function getTitleTooltip(label: string): TooltipInfo {
  if (label === '1期生マスター') {
    return { title: label, condition: '1期生 顔名前当て ゴールド\n+ 1期生 知識クイズ ゴールド', conditionLabel: '獲得条件', imageSrc: TROPHY_IMAGES.gen1, imageSize: 18 }
  }
  return { title: label, condition: '2期生 顔名前当て ゴールド\n+ 2期生 知識クイズ ゴールド', conditionLabel: '獲得条件', imageSrc: TROPHY_IMAGES.gen2, imageSize: 18 }
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
  const { badges, isGen2Master, isGen1Master, isParerMaster } = useBadgeStore()
  const taBest = (() => {
    try {
      const raw = localStorage.getItem('parermaster2_ta_best')
      return raw ? Number(raw) : null
    } catch { return null }
  })()
  const isGrandMaster = isParerMaster() && taBest != null && taBest < GRANDMASTER_THRESHOLD_MS
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  // 知識クイズの正解数（一度でも正解した問題数 / 現存する全問題数）
  const { questions: questionPool } = useQuestions()
  const cleared = useQuestionHistoryStore((s) => s.cleared)
  const records = useQuestionHistoryStore((s) => s.records)
  const clearedCount = useMemo(
    () => countClearedQuestions(cleared, questionPool),
    [cleared, questionPool],
  )

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
            <div className="flex flex-col" style={{ width: '28%', gap: '1cqmin' }}>
              <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
                <RibbonHeader
                  gradient="linear-gradient(180deg, #ffd700 0%, #ffb700 40%, #e6a000 100%)"
                  label="TA"
                />
                <StatCard
                  emoji="⏱️"
                  label="自己ベスト"
                  value={taBest != null ? formatTime(taBest) : '未プレイ'}
                  style={STAT_CARD_STYLES.timeAttack}
                  onTap={() => setTooltip(TIME_ATTACK_TOOLTIP)}
                />
              </div>
              <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
                <RibbonHeader
                  gradient="linear-gradient(180deg, #d8c4f5 0%, #b088e0 40%, #9163c8 100%)"
                  label="知識"
                />
                <StatCard
                  emoji="⭕"
                  label="正解済み"
                  value={questionPool.length > 0 ? `${clearedCount}/${questionPool.length}` : '…'}
                  style={STAT_CARD_STYLES.knowledge}
                  onTap={() => setTooltip({
                    ...CLEARED_COUNT_TOOLTIP,
                    clearedStats: { questions: questionPool, cleared, records },
                  })}
                />
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
                ? { title: 'パレ学グランドマスター', condition: '1期生マスター 取得\n+ 2期生マスター 取得\n+ タイムアタック 7分切り', conditionLabel: '獲得条件', imageSrc: TROPHY_IMAGES.grandmaster, imageSize: 25 }
                : { title: 'パレ学マスター', condition: '1期生マスター 取得\n+ 2期生マスター 取得', conditionLabel: '獲得条件', imageSrc: TROPHY_IMAGES.master, imageSize: 25 }
            )} />
          )}
        </div>
      </div>

      {/* 条件ポップアップ（4:3コンテナの外に出して画面いっぱいを使う） */}
      {tooltip && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 100 }}
          onClick={() => setTooltip(null)}
        >
          <div
            className="flex flex-col items-center"
            style={{
              '--tip-unit': TIP_UNIT,
              color: '#333',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              padding: `${tu(3)} ${tu(5)}`,
              borderRadius: tu(3),
              boxShadow: `0 ${tu(0.5)} ${tu(3)} rgba(0,0,0,0.25)`,
              minWidth: tu(25),
              // 内容が増えても画面外にはみ出さない保険
              maxHeight: '94dvh',
              overflowY: 'auto',
            } as CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {tooltip.imageSrc && (
              <img
                src={tooltip.imageSrc}
                alt=""
                style={{ width: tu(tooltip.imageSize ?? 25), height: tu(tooltip.imageSize ?? 25), objectFit: 'contain', marginBottom: tu(0.5) }}
                draggable={false}
              />
            )}
            {tooltip.title && (
              <div className="font-bold" style={{ fontSize: tu(3), marginBottom: tu(1) }}>
                {tooltip.title}
              </div>
            )}
            {tooltip.rankLabel && (
              <div className="font-bold" style={{ fontSize: tu(3.5), color: '#8a6500', marginBottom: tu(1.5) }}>
                {tooltip.rankLabel}
              </div>
            )}
            <div style={{ width: '80%', height: '1px', background: 'linear-gradient(90deg, transparent, #ccc, transparent)', marginBottom: tu(1.5) }} />
            {tooltip.conditionLabel && (
              <div style={{ fontSize: tu(2.5), color: '#888', marginBottom: tu(0.5) }}>
                {tooltip.conditionLabel}
              </div>
            )}
            <div className="font-bold" style={{ fontSize: tu(2.5), whiteSpace: 'pre-line', lineHeight: 1.8, textAlign: 'center' }}>
              {tooltip.condition}
            </div>
            {tooltip.clearedStats && <ClearedStatsPanel {...tooltip.clearedStats} />}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ── ★別内訳（正解済みポップアップ内） ── */

/** 内訳バー・凡例の色 */
const STATS_COLORS = {
  cleared: '#9163c8',
  wrong: '#f0b429',
  untouched: 'rgba(0,0,0,0.10)',
}

const GEN_TABS: readonly { value: GenerationFilter; label: string }[] = [
  { value: 'all', label: '全体' },
  { value: 1, label: '1期生' },
  { value: 2, label: '2期生' },
]

const STATS_LEGEND: readonly { color: string; label: string }[] = [
  { color: STATS_COLORS.cleared, label: '正解済み' },
  { color: STATS_COLORS.wrong, label: '未正解' },
  { color: STATS_COLORS.untouched, label: '未出題' },
]

function ClearedStatsPanel({ questions, cleared, records }: ClearedStatsSource) {
  // 共通問題（世代0）は1期生・2期生の両タブに含まれるため、タブごとの合計は全体と一致しない
  const [genTab, setGenTab] = useState<GenerationFilter>('all')
  const rows = useMemo(
    () => buildStarBreakdown(filterByGeneration(questions, genTab), cleared, records),
    [questions, cleared, records, genTab],
  )
  const clearedTotal = rows.reduce((n, row) => n + row.cleared, 0)
  const questionTotal = rows.reduce((n, row) => n + row.total, 0)

  return (
    <div style={{ width: tu(48), marginTop: tu(1.5) }}>
      {/* 世代タブ */}
      <div className="flex justify-center" style={{ gap: tu(1), marginBottom: tu(1.5) }}>
        {GEN_TABS.map((tab) => {
          const active = tab.value === genTab
          return (
            <button
              key={String(tab.value)}
              className="font-bold cursor-pointer transition active:scale-95"
              onClick={() => setGenTab(tab.value)}
              style={{
                fontSize: tu(2.2),
                padding: `${tu(0.6)} ${tu(2.5)}`,
                borderRadius: tu(3),
                border: `${tu(0.25)} solid ${active ? STATS_COLORS.cleared : 'rgba(0,0,0,0.15)'}`,
                background: active ? STATS_COLORS.cleared : 'rgba(255,255,255,0.8)',
                color: active ? 'white' : '#888',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {rows.map((row) => (
        <div
          key={row.stars}
          className="flex items-center"
          style={{ gap: tu(1.5), marginTop: tu(0.8) }}
        >
          <span
            className="font-bold"
            style={{ fontSize: tu(2.2), color: '#c9a600', width: tu(5), whiteSpace: 'nowrap' }}
          >
            ★{row.stars}
          </span>
          <div
            className="flex"
            style={{
              flex: 1,
              height: tu(1.4),
              borderRadius: tu(0.7),
              background: STATS_COLORS.untouched,
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${(row.cleared / row.total) * 100}%`, background: STATS_COLORS.cleared }} />
            <div style={{ width: `${((row.attempted - row.cleared) / row.total) * 100}%`, background: STATS_COLORS.wrong }} />
          </div>
          <span
            className="font-bold"
            style={{ fontSize: tu(2.2), color: '#6b3fa0', width: tu(10), textAlign: 'right' }}
          >
            {row.cleared}/{row.total}
          </span>
        </div>
      ))}

      <div
        className="flex items-center"
        style={{
          gap: tu(1.5),
          marginTop: tu(1),
          paddingTop: tu(1),
          borderTop: '1px solid rgba(0,0,0,0.12)',
        }}
      >
        <span className="font-bold" style={{ fontSize: tu(2.2), color: '#888', flex: 1 }}>
          合計
        </span>
        <span
          className="font-bold"
          style={{ fontSize: tu(2.5), color: '#6b3fa0', width: tu(12), textAlign: 'right' }}
        >
          {clearedTotal}/{questionTotal}
        </span>
      </div>

      {/* 凡例 */}
      <div className="flex justify-center" style={{ gap: tu(2), marginTop: tu(1.5) }}>
        {STATS_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center" style={{ gap: tu(0.6) }}>
            <span
              style={{
                width: tu(1.6),
                height: tu(1.6),
                borderRadius: tu(0.4),
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: tu(2.1), color: '#888' }}>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── 数値カード（タイムアタック自己ベスト / 知識クイズ正解数） ── */

interface StatCardStyle {
  background: string
  border: string
  shadow: string
  valueColor: string
}

const STAT_CARD_STYLES: Record<'timeAttack' | 'knowledge', StatCardStyle> = {
  timeAttack: {
    background: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 50%, #ffd54f 100%)',
    border: 'rgba(255,215,0,0.6)',
    shadow: 'rgba(200,170,0,0.3)',
    valueColor: '#c48800',
  },
  knowledge: {
    background: 'linear-gradient(135deg, #f6efff 0%, #ddc8f5 50%, #c9adec 100%)',
    border: 'rgba(145,99,200,0.5)',
    shadow: 'rgba(120,80,180,0.3)',
    valueColor: '#6b3fa0',
  },
}

const TIME_ATTACK_TOOLTIP: TooltipInfo = {
  title: 'タイムアタック 自己ベスト',
  condition: 'タイムアタックを完走した最速タイム',
}

const CLEARED_COUNT_TOOLTIP: TooltipInfo = {
  title: '知識クイズ 正解済み',
  condition: '一度でも正解した問題数 ／ 現在の全問題数',
}

function StatCard({
  emoji,
  label,
  value,
  style,
  onTap,
}: {
  emoji: string
  label: string
  value: string
  style: StatCardStyle
  onTap: () => void
}) {
  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer transition active:scale-95"
      onClick={onTap}
      style={{
        flex: 1,
        minHeight: 0,
        padding: '0.5cqmin',
        borderRadius: '2cqmin',
        background: style.background,
        border: `0.3cqmin solid ${style.border}`,
        boxShadow: `inset 0 0.3cqmin 0.5cqmin rgba(255,255,255,0.4), 0 0.3cqmin 0.8cqmin ${style.shadow}`,
      }}
    >
      <span style={{ fontSize: '2cqmin', color: '#666', textAlign: 'center', lineHeight: 1.4 }}>
        {emoji} {label}
      </span>
      <span
        className="font-bold"
        style={{ fontSize: '2.8cqmin', color: style.valueColor, lineHeight: 1.4 }}
      >
        {value}
      </span>
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
