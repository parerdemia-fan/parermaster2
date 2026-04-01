import { useRef, useEffect } from 'react'
import type { Talent } from '../../shared/types/talent.ts'
import type { SlotPosition } from './useRoomStore.ts'
import { DORM_LABELS } from '../../shared/constants/dorm.ts'

interface TalentSelectorProps {
  talents: Talent[]
  position: SlotPosition
  currentTalentId: string | null
  usedTalentIds: Set<string>
  onSelect: (talentId: string | null) => void
  onClose: () => void
}

const DORM_ORDER = ['wa', 'me', 'co', 'wh']

export function TalentSelector({ talents, position, currentTalentId, usedTalentIds, onSelect, onClose }: TalentSelectorProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  // 選択中アイテムへスクロール
  useEffect(() => {
    if (!menuRef.current) return
    const timer = setTimeout(() => {
      menuRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' })
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const byDorm = talents.reduce<Record<string, Talent[]>>((acc, t) => {
    (acc[t.dormitory] ??= []).push(t)
    return acc
  }, {})

  const posLabel = position === 'left' ? '左' : position === 'center' ? '中央' : '右'

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(30,30,30,0.97)',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
        maxHeight: '60dvh',
        overflowY: 'auto',
        zIndex: 100,
        scrollbarWidth: 'none' as const,
      }}
    >
      {/* ヘッダー */}
      <div style={{ padding: '6px 12px', fontSize: '12px', color: '#aaa', borderBottom: '1px solid #444' }}>
        {posLabel}スロット
      </div>

      {/* 解除 */}
      <button
        style={{
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          fontSize: '13px',
          color: currentTalentId ? '#ff8888' : '#666',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid #333',
          cursor: currentTalentId ? 'pointer' : 'default',
        }}
        onClick={() => onSelect(null)}
        disabled={!currentTalentId}
      >
        ✕ 解除
      </button>

      {/* 寮別タレント一覧 */}
      {DORM_ORDER.map((dorm) => {
        const list = byDorm[dorm]
        if (!list || list.length === 0) return null
        return (
          <div key={dorm}>
            <div style={{ padding: '4px 12px', fontSize: '11px', color: '#aaa', background: '#222', position: 'sticky', top: 0 }}>
              {DORM_LABELS[dorm] ?? dorm}
            </div>
            {list.map((t) => {
              const isUsed = usedTalentIds.has(t.id) && t.id !== currentTalentId
              const isSelected = t.id === currentTalentId
              return (
                <button
                  key={t.id}
                  data-selected={isSelected}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    textAlign: 'left',
                    fontSize: '13px',
                    color: isSelected ? '#ffd700' : isUsed ? '#555' : '#eee',
                    background: 'none',
                    border: 'none',
                    cursor: isUsed ? 'default' : 'pointer',
                  }}
                  onClick={() => { if (!isUsed) onSelect(t.id) }}
                  disabled={isUsed}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
