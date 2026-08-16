import { useEffect, useMemo, useRef, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentStandingPath, getStandingImageVariant } from '../../shared/utils/talent.ts'
import type { Talent } from '../../shared/types/talent.ts'
import { useKvScaleStore, useKvScale, resolveKvScale } from '../../features/room/useKvScaleStore.ts'
import { getStandingStyle, DEFAULT_STANDING_PARAMS, TABLE_TOP_DVW_VALUE, type StandingParams } from '../../features/room/kvScaleStyle.ts'

const GEN_KEY = 'parermaster2_kv_check_gen'
const PARAMS_KEY = 'parermaster2_kv_check_params'
const SORT_KEY = 'parermaster2_kv_check_sort'

/**
 * 横長のPCで開いても談話室と同じ見え方になるよう、縦長の仮想ビューポートを再現する。
 * 実画面の dvw をそのまま使うと `100dvh - 75dvw` が負になり立ち絵が消えてしまう。
 *
 * 仮想ビューポート: 縦横比 VIEWPORT_ASPECT の縦画面。その下部（100dvh - 75dvw）が談話室エリア。
 * 談話室エリアの高さを画面の残り高さいっぱいに取り、そこから逆算して仮想ビューポート幅を決める。
 */
const VIEWPORT_ASPECT = 2.167       // iPhone 相当（19.5:9）

interface Layout {
  areaHeightCss: string
  vwCss: string
  columnWidthCss: string
}

/** ツールバーの実高さ（折り返し段数で変わる）から仮想ビューポートを組み立てる */
function buildLayout(toolbarHeightPx: number): Layout {
  const areaHeightCss = `calc(100dvh - ${toolbarHeightPx}px)`
  // エリア高さ = 仮想幅 × (アスペクト - 0.75) なので、そこから 1dvw 相当を逆算する
  const vwCss = `((100dvh - ${toolbarHeightPx}px) / ${((VIEWPORT_ASPECT - 0.75) * 100).toFixed(2)})`
  return { areaHeightCss, vwCss, columnWidthCss: `calc(33.333 * ${vwCss})` }
}

type GenFilter = 1 | 2 | 'all'
type SortKey = 'id' | 'height' | 'random'

/** シード付きシャッフル（再描画で並びが暴れないように決定的にする） */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const a = [...items]
  let s = seed || 1
  const next = () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function KvScaleCheckScreen() {
  const { talents } = useTalents()

  const [gen, setGen] = useState<GenFilter>(() => {
    const raw = loadString(GEN_KEY)
    return raw === '2' ? 2 : raw === 'all' ? 'all' : 1
  })
  const [sort, setSort] = useState<SortKey>(() => {
    const raw = loadString(SORT_KEY)
    return raw === 'height' || raw === 'random' ? raw : 'id'
  })
  const [shuffleSeed, setShuffleSeed] = useState(1)
  const [params, setParams] = useState<Required<StandingParams>>(() => ({
    ...DEFAULT_STANDING_PARAMS,
    ...(loadJson(PARAMS_KEY) ?? {}),
  }))
  const [showGuide, setShowGuide] = useState(true)

  // ツールバーは幅によって折り返し段数が変わるので、実高さを測って表示領域に反映する
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [toolbarHeight, setToolbarHeight] = useState(92)
  useEffect(() => {
    const el = toolbarRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setToolbarHeight(el.offsetHeight))
    observer.observe(el)
    setToolbarHeight(el.offsetHeight)
    return () => observer.disconnect()
  }, [])
  const layout = useMemo(() => buildLayout(toolbarHeight), [toolbarHeight])

  const filtered = useMemo(() => {
    const list = gen === 'all' ? talents : talents.filter((t) => t.generation === gen)
    if (sort === 'height') return [...list].sort((a, b) => a.height - b.height)
    if (sort === 'random') return seededShuffle(list, shuffleSeed)
    return list
  }, [talents, gen, sort, shuffleSeed])

  const overrides = useKvScaleStore((s) => s.overrides)
  const resetAll = useKvScaleStore((s) => s.resetAll)

  const updateGen = (g: GenFilter) => {
    setGen(g)
    saveString(GEN_KEY, String(g))
  }

  const updateSort = (s: SortKey) => {
    // ランダムは押すたびに引き直す（世代混在の並びを変えて比べたいため）
    if (s === 'random') setShuffleSeed(Math.floor(Math.random() * 2147483647))
    setSort(s)
    saveString(SORT_KEY, s)
  }

  const updateParam = (key: keyof StandingParams, value: number) => {
    const next = { ...params, [key]: value }
    setParams(next)
    saveJson(PARAMS_KEY, next)
  }

  const resetParams = () => {
    setParams(DEFAULT_STANDING_PARAMS)
    saveJson(PARAMS_KEY, DEFAULT_STANDING_PARAMS)
  }

  // 1.0 と異なる倍率を持つエントリ（FACE_SCALE_MAP に貼る用）
  const buildEntries = (): [string, number][] =>
    filtered
      .map((t): [string, number] => [t.id, resolveKvScale(t.id, overrides)])
      .filter(([, s]) => s !== 1.0)

  const copyTs = () => {
    const body = buildEntries()
      .map(([id, v]) => `  '${id}': ${v.toFixed(3)},`)
      .join('\n')
    navigator.clipboard.writeText(`${gen === 'all' ? '// 全員' : `// ${gen}期生`}\n${body}\n`)
  }

  const copyParams = () => {
    navigator.clipboard.writeText(
      `const BASE_FACE_DVW = ${params.baseFaceDvw}\n` +
      `const CHIN_ABOVE_TABLE_U = ${params.chinAboveTableU}\n` +
      `const HEIGHT_REFLECT = ${params.heightReflect}\n`,
    )
  }

  const handleResetAll = () => {
    if (confirm('全ての倍率を初期値（1.0）に戻します')) resetAll()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#1a1a1a' }}>
      {/* ツールバー */}
      <div
        ref={toolbarRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '6px 8px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <button onClick={() => useSettingsStore.getState().goToDebug()} style={tbBtn}>← 戻る</button>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([[1, '1期生'], [2, '2期生'], ['all', '全員']] as const).map(([g, label]) => (
            <button
              key={String(g)}
              onClick={() => updateGen(g)}
              style={{ ...tbBtn, background: gen === g ? 'rgba(80,160,255,0.5)' : tbBtn.background }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([['id', 'ID順'], ['height', '身長順'], ['random', 'ランダム']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => updateSort(k)}
              style={{ ...tbBtn, background: sort === k ? 'rgba(80,160,255,0.5)' : tbBtn.background }}
            >
              {label}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={showGuide} onChange={(e) => setShowGuide(e.target.checked)} />
          基準線
        </label>
        <button onClick={copyTs} style={tbBtn}>倍率TSコピー</button>
        <button onClick={copyParams} style={tbBtn}>パラメータコピー</button>
        <button onClick={handleResetAll} style={{ ...tbBtn, background: 'rgba(200,50,50,0.7)' }}>Reset All</button>
        </div>

        {/* 全体パラメータ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <ParamSlider label="顔サイズ" unit="dvw" min={5} max={11} step={0.1} value={params.baseFaceDvw} onChange={(v) => updateParam('baseFaceDvw', v)} />
        <ParamSlider label="顎の高さ" unit="U" min={2} max={8} step={0.01} value={params.chinAboveTableU} onChange={(v) => updateParam('chinAboveTableU', v)} />
        <ParamSlider label="身長反映" unit="" min={0} max={1.5} step={0.05} value={params.heightReflect} onChange={(v) => updateParam('heightReflect', v)} />
        <button onClick={resetParams} style={tbBtn}>既定値に戻す</button>
        </div>
      </div>

      {/* 談話室エリアの再現（画面下部に配置し、実機と同じ縦位置関係で確認する） */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: layout.areaHeightCss,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        <div style={{ display: 'flex', width: 'max-content', height: '100%' }}>
          {filtered.map((t) => (
            <TalentColumn key={t.id} talent={t} params={params} layout={layout} />
          ))}
        </div>
      </div>

      {showGuide && (
        <>
          {/* テーブル上端 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `calc(${TABLE_TOP_DVW_VALUE} * ${layout.vwCss})`,
              height: '2px',
              background: 'rgba(255,180,60,0.8)',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
          {/* 基準身長のタレントの顎の高さ */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `calc(${(TABLE_TOP_DVW_VALUE + params.baseFaceDvw * params.chinAboveTableU).toFixed(3)} * ${layout.vwCss})`,
              height: '1px',
              background: 'rgba(0,255,255,0.6)',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        </>
      )}
    </div>
  )
}

function TalentColumn({ talent, params, layout }: { talent: Talent; params: StandingParams; layout: Layout }) {
  const headScale = useKvScale(talent.id)
  const setOverride = useKvScaleStore((s) => s.setOverride)
  const resetOverride = useKvScaleStore((s) => s.resetOverride)
  const style = getStandingStyle(talent.id, getStandingImageVariant(talent), talent.height, {
    areaHeightCss: layout.areaHeightCss,
    vwCss: layout.vwCss,
    headScale,
    params,
  })

  return (
    <div
      style={{
        position: 'relative',
        width: layout.columnWidthCss,
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        borderLeft: '1px dashed rgba(255,255,255,0.15)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: style.containerTop,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <img
          src={getTalentStandingPath(talent)}
          alt={talent.name}
          draggable={false}
          style={{ flexShrink: 0, width: style.imgWidth, height: 'auto', maxWidth: 'none' }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '4px',
          right: '4px',
          bottom: '6px',
          zIndex: 16,
          background: 'rgba(0,0,0,0.78)',
          borderRadius: '6px',
          padding: '6px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '12px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {talent.name} <span style={{ opacity: 0.7, fontWeight: 'normal' }}>{talent.height}cm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.01}
            value={headScale}
            onChange={(e) => setOverride(talent.id, Number(e.target.value))}
            style={{ flex: 1, minWidth: 0 }}
          />
          <span style={{ width: '36px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {headScale.toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => resetOverride(talent.id)}
          style={{ ...tbBtn, padding: '2px 4px', fontSize: '11px' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function ParamSlider({ label, unit, min, max, step, value, onChange }: {
  label: string
  unit: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {label}:
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '120px' }}
      />
      <span style={{ width: '52px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {value.toFixed(2)}{unit}
      </span>
    </label>
  )
}

function loadString(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function saveString(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}

function loadJson(key: string): Partial<StandingParams> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch { return null }
}

function saveJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

const tbBtn: React.CSSProperties = {
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(255,255,255,0.1)',
  color: 'white',
  cursor: 'pointer',
}
