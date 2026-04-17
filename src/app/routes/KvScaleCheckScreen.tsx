import { useMemo, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentStandingPath } from '../../shared/utils/talent.ts'
import type { Talent } from '../../shared/types/talent.ts'
import { useKvScaleStore, useKvScale, resolveKvScale } from '../../features/room/useKvScaleStore.ts'
import { getKvImageStyle } from '../../features/room/kvScaleStyle.ts'

const GUIDELINE_KEY = 'parermaster2_kv_check_guideline'

export function KvScaleCheckScreen() {
  const { talents } = useTalents()
  const gen1 = useMemo(
    () => talents.filter((t) => t.generation === 1),
    [talents],
  )

  const overrides = useKvScaleStore((s) => s.overrides)
  const resetAll = useKvScaleStore((s) => s.resetAll)

  const [guidelineVh, setGuidelineVh] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(GUIDELINE_KEY)
      if (raw != null) {
        const n = Number(raw)
        if (isFinite(n)) return n
      }
    } catch { /* ignore */ }
    return 35
  })
  const [showGuide, setShowGuide] = useState(true)

  const updateGuideline = (v: number) => {
    setGuidelineVh(v)
    try { localStorage.setItem(GUIDELINE_KEY, String(v)) } catch { /* ignore */ }
  }

  const buildEntries = (): [string, number][] => {
    const entries: [string, number][] = []
    for (const t of gen1) {
      const s = resolveKvScale(t.id, overrides)
      if (s !== 1.0) entries.push([t.id, s])
    }
    return entries
  }

  const copyJson = () => {
    const obj = Object.fromEntries(buildEntries())
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
  }

  const copyTs = () => {
    const body = buildEntries()
      .map(([id, v]) => `  '${id}': ${v.toFixed(3)},`)
      .join('\n')
    const code = `export const KV_SCALE_MAP: Readonly<Record<string, number>> = {\n${body}\n}\n`
    navigator.clipboard.writeText(code)
  }

  const handleResetAll = () => {
    if (confirm('全ての倍率を初期値（定数マップの値）に戻します')) resetAll()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#1a1a1a' }}>
      {/* ツールバー */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          padding: '6px 8px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: '12px',
        }}
      >
        <button
          onClick={() => useSettingsStore.getState().goToDebug()}
          style={tbBtn}
        >
          ← 戻る
        </button>
        <button onClick={copyJson} style={tbBtn}>JSONコピー</button>
        <button onClick={copyTs} style={tbBtn}>TSコピー</button>
        <button onClick={handleResetAll} style={{ ...tbBtn, background: 'rgba(200,50,50,0.7)' }}>Reset All</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={showGuide} onChange={(e) => setShowGuide(e.target.checked)} />
          基準線
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          目線:
          <input
            type="range"
            min={5}
            max={80}
            step={0.5}
            value={guidelineVh}
            onChange={(e) => updateGuideline(Number(e.target.value))}
            style={{ width: '140px' }}
          />
          <span style={{ width: '48px', textAlign: 'right' }}>{guidelineVh.toFixed(1)}dvh</span>
        </label>
        <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
          調整後は TSコピー → kvScaleMap.ts に貼り付け → Reset All
        </span>
      </div>

      {/* 立ち絵の dvh 座標は viewport 基準なのでスクロール領域は inset: 0 で保つ（ツールバー下にオフセットすると足下基準が狂う） */}
      <div style={{ position: 'absolute', inset: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', width: 'max-content', height: '100%' }}>
          {gen1.map((t) => (
            <TalentColumn key={t.id} talent={t} />
          ))}
        </div>
      </div>

      {showGuide && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '37.5dvw',
              height: '1px',
              background: 'rgba(0,255,255,0.6)',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${guidelineVh}dvh`,
              height: '2px',
              background: 'rgba(255,60,60,0.75)',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        </>
      )}
    </div>
  )
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

const COLUMN_WIDTH_DVW = 33

function TalentColumn({ talent }: { talent: Talent }) {
  const scale = useKvScale(talent.id)
  const setOverride = useKvScaleStore((s) => s.setOverride)
  const resetOverride = useKvScaleStore((s) => s.resetOverride)
  const style = getKvImageStyle(scale)
  const src = getTalentStandingPath(talent)

  return (
    <div
      style={{
        position: 'relative',
        width: `${COLUMN_WIDTH_DVW}dvw`,
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
          src={src}
          alt={talent.name}
          draggable={false}
          style={{
            flexShrink: 0,
            height: style.imgHeight,
            width: 'auto',
            maxWidth: 'none',
          }}
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
          {talent.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.01}
            value={scale}
            onChange={(e) => setOverride(talent.id, Number(e.target.value))}
            style={{ flex: 1, minWidth: 0 }}
          />
          <span style={{ width: '36px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {scale.toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setOverride(talent.id, 1.0)}
            style={{ ...tbBtn, flex: 1, padding: '2px 4px', fontSize: '11px' }}
          >
            1.00
          </button>
          <button
            onClick={() => resetOverride(talent.id)}
            style={{ ...tbBtn, flex: 1, padding: '2px 4px', fontSize: '11px' }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
