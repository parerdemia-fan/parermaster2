import { useMemo, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useDiary } from '../../shared/hooks/useDiary.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { parseTextWithTalentIcons } from '../../shared/utils/talentIconParser.tsx'

const backButtonStyle: React.CSSProperties = {
  fontSize: '3cqmin',
  padding: '0.8cqmin 1.5cqmin',
  borderRadius: '2cqmin',
  border: 'none',
  background: 'rgba(255,255,255,0.6)',
  color: '#555',
}

const navButtonStyle: React.CSSProperties = {
  fontSize: '2.5cqmin',
  padding: '0.5cqmin 1.5cqmin',
  borderRadius: '1.5cqmin',
  border: 'none',
  background: 'rgba(255,255,255,0.4)',
  color: '#777',
}

export function DiaryScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const { entries, loading } = useDiary()
  const { talents } = useTalents()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const reversedEntries = useMemo(() => [...entries].reverse(), [entries])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span style={{ fontSize: '4cqmin', color: 'white' }}>読み込み中...</span>
      </div>
    )
  }

  // エントリ詳細表示
  if (selectedIndex !== null) {
    const entry = entries[selectedIndex]
    if (!entry) return null
    return (
      <div className="relative w-full h-full flex flex-col overflow-hidden animate-fade-in">
        {/* ヘッダー */}
        <div
          className="w-full flex items-center"
          style={{ padding: '2cqmin 3cqmin 0' }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
            style={backButtonStyle}
            onClick={() => setSelectedIndex(null)}
          >
            ◀ 一覧
          </button>
          <div className="flex items-center" style={{ marginLeft: '3cqmin', gap: '2cqmin' }}>
            {selectedIndex > 0 && (
              <button
                className="cursor-pointer transition active:scale-95"
                style={navButtonStyle}
                onClick={() => setSelectedIndex(selectedIndex - 1)}
              >
                ← 前
              </button>
            )}
            {selectedIndex < entries.length - 1 && (
              <button
                className="cursor-pointer transition active:scale-95"
                style={navButtonStyle}
                onClick={() => setSelectedIndex(selectedIndex + 1)}
              >
                次 →
              </button>
            )}
          </div>
        </div>

        {/* 本文 */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: '2cqmin 4cqmin 3cqmin' }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '3cqmin',
              padding: '3cqmin 4cqmin',
              boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '2.5cqmin', color: '#888', marginBottom: '1cqmin' }}>
              {entry.date}
            </div>
            <div
              className="font-bold"
              style={{ fontSize: '4cqmin', color: '#333', marginBottom: '2.5cqmin' }}
            >
              {entry.title}
            </div>
            <div
              style={{
                fontSize: '2.8cqmin',
                color: '#444',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {parseTextWithTalentIcons(entry.body, talents, true)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // エントリ一覧
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden animate-fade-in">
      {/* ヘッダー */}
      <div
        className="w-full flex items-center"
        style={{ padding: '2cqmin 3cqmin 0' }}
      >
        <button
          className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
          style={backButtonStyle}
          onClick={goToTitle}
        >
          ◀ 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            marginLeft: '3cqmin',
            color: '#e8789e',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          開発日誌
        </span>
      </div>

      {/* エントリ一覧 */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ padding: '2cqmin 4cqmin 3cqmin', gap: '2cqmin' }}
      >
        {reversedEntries.map((entry, i) => {
          const originalIndex = entries.length - 1 - i
          return (
            <button
              key={originalIndex}
              className="text-left cursor-pointer transition hover:brightness-105 active:scale-99"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '2cqmin',
                padding: '2cqmin 3cqmin',
                border: 'none',
                boxShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.08)',
              }}
              onClick={() => setSelectedIndex(originalIndex)}
            >
              <div style={{ fontSize: '2.2cqmin', color: '#999' }}>
                {entry.date}
              </div>
              <div
                className="font-bold"
                style={{ fontSize: '3cqmin', color: '#333', marginTop: '0.5cqmin' }}
              >
                {entry.title}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
