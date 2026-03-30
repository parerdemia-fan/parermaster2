import { useEffect } from 'react'
import { useRoomStore, type SlotPosition } from './useRoomStore.ts'
import { TalentSlot } from './TalentSlot.tsx'
import { TalentSelector } from './TalentSelector.tsx'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentStandingPath } from '../../shared/utils/talent.ts'

const BASE = import.meta.env.BASE_URL

const DORM_BG: Record<string, string> = {
  wa: `${BASE}data/images/ui/bg_wa.png`,
  me: `${BASE}data/images/ui/bg_me.png`,
  co: `${BASE}data/images/ui/bg_co.png`,
  wh: `${BASE}data/images/ui/bg_wh.png`,
}

const DORM_IDS = ['wa', 'me', 'co', 'wh'] as const

const SLOT_POSITIONS: SlotPosition[] = ['left', 'center', 'right']

interface RoomAreaProps {
  showSelector: boolean
}

export function RoomArea({ showSelector }: RoomAreaProps) {
  const { talents } = useTalents()
  const { slots, dormitory, activeSelector, setSlot, setDormitory, openSelector, closeSelector } = useRoomStore()

  // 初回: 中央スロットが空でタレントがいたらランダムに1期生を配置
  useEffect(() => {
    if (talents.length === 0) return
    const { slots: currentSlots } = useRoomStore.getState()
    if (currentSlots.center !== null) return
    // 全スロットが空の場合のみ初期化（ユーザーが意図的に全解除した場合は再セットしない）
    const hasAny = Object.values(currentSlots).some((v) => v !== null)
    if (hasAny) return
    // LocalStorage に保存がない初回アクセス
    const gen1 = talents.filter((t) => t.generation === 1)
    if (gen1.length === 0) return
    const picked = gen1[Math.floor(Math.random() * gen1.length)]
    setSlot('center', picked.id)
  }, [talents, setSlot])

  const usedTalentIds = new Set(
    Object.values(slots).filter((id): id is string => id !== null),
  )

  const bgImage = DORM_BG[dormitory] ?? DORM_BG.wa

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100dvh - 75dvw)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景画像 */}
      <img
        src={bgImage}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        draggable={false}
      />

      {/* 立ち絵スロット × 3 */}
      {SLOT_POSITIONS.map((pos) => {
        const talentId = slots[pos]
        const talent = talentId ? talents.find((t) => t.id === talentId) : null
        const imagePath = talent ? getTalentStandingPath(talent) : null

        return (
          <TalentSlot
            key={pos}
            talentId={talentId}
            imagePath={imagePath}
            position={pos}
            showSelector={showSelector}
            onClick={() => openSelector(pos)}
          />
        )
      })}

      {/* タレント選択ドロップダウン（1つだけ表示） */}
      {showSelector && activeSelector && (
        <div style={{ position: 'absolute', bottom: '8px', left: POSITION_PERCENT[activeSelector], transform: 'translateX(-50%)', zIndex: 100 }}>
          <TalentSelector
            talents={talents}
            position={activeSelector}
            currentTalentId={slots[activeSelector]}
            usedTalentIds={usedTalentIds}
            onSelect={(id) => setSlot(activeSelector, id)}
            onClose={closeSelector}
          />
        </div>
      )}

      {/* 寮選択ボタン（タイトル画面のみ） */}
      {showSelector && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 10,
            display: 'flex',
            gap: '4px',
          }}
        >
          {DORM_IDS.map((dorm) => (
            <button
              key={dorm}
              onClick={() => setDormitory(dorm)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: dormitory === dorm ? '2px solid #fff' : '2px solid transparent',
                background: 'rgba(0,0,0,0.5)',
                cursor: 'pointer',
                opacity: dormitory === dorm ? 1 : 0.6,
                overflow: 'hidden',
                padding: 0,
              }}
            >
              <img
                src={`${BASE}data/images/ui/emblem_${dorm}.webp`}
                alt={dorm}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const POSITION_PERCENT: Record<SlotPosition, string> = {
  left: '25%',
  center: '50%',
  right: '75%',
}
