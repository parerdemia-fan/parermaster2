import { useEffect, useMemo } from 'react'
import { useRoomStore, type SlotPosition } from './useRoomStore.ts'
import { TalentSlot } from './TalentSlot.tsx'
import { TalentSelector } from './TalentSelector.tsx'
import { SpeechBubble } from './SpeechBubble.tsx'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { getTalentStandingPath, isSquareStandingImage } from '../../shared/utils/talent.ts'

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
  const { slots, dormitory, activeSelector, speechBubble, setSlot, setDormitory, openSelector, closeSelector, setSpeechBubble } = useRoomStore()

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

  // スロット位置とタレントのペア（SpeechBubble用）
  const slotTalents = useMemo(
    () => SLOT_POSITIONS.map((pos) => {
      const id = slots[pos]
      const talent = id ? talents.find((t) => t.id === id) ?? null : null
      return talent ? { position: pos, talent } : null
    }).filter((e): e is NonNullable<typeof e> => e !== null),
    [slots, talents],
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
        const isSquare = talent ? isSquareStandingImage(talent) : false

        return (
          <TalentSlot
            key={pos}
            talentId={talentId}
            imagePath={imagePath}
            isSquare={isSquare}
            position={pos}
            showSelector={showSelector}
            onClick={() => openSelector(pos)}
          />
        )
      })}

      {/* テーブル（立ち絵の手前） */}
      <img
        src={`${BASE}data/images/ui/room_table.png`}
        alt=""
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 5,
          pointerEvents: 'none',
        }}
        draggable={false}
      />

      {/* 吹き出し（テーブルの手前） */}
      {speechBubble && slotTalents.length > 0 && !activeSelector && (
        <SpeechBubble entries={slotTalents} />
      )}

      {/* タレント選択ドロップダウン（1つだけ表示、fixed で画面下部に展開） */}
      {showSelector && activeSelector && (
        <TalentSelector
          talents={talents}
          position={activeSelector}
          currentTalentId={slots[activeSelector]}
          usedTalentIds={usedTalentIds}
          onSelect={(id) => setSlot(activeSelector, id)}
          onClose={closeSelector}
        />
      )}

      {/* 横画面推奨画像（タイトル画面のみ、iPhoneでは横にしても変わらないので非表示） */}
      {showSelector && !/iPhone/i.test(navigator.userAgent) && (
        <img
          src={`${BASE}data/images/ui/landscape_recommended.png`}
          alt="横画面推奨"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            width: '72px',
            height: 'auto',
            opacity: 0.6,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
          }}
          draggable={false}
        />
      )}

      {/* 寮選択・吹き出しトグル（タイトル画面のみ） */}
      {showSelector && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 10,
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          {/* 吹き出しON/OFF */}
          <button
            onClick={() => setSpeechBubble(!speechBubble)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid transparent',
              background: 'rgba(0,0,0,0.5)',
              cursor: 'pointer',
              opacity: speechBubble ? 1 : 0.4,
              padding: 0,
              fontSize: '18px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={speechBubble ? '吹き出し: ON' : '吹き出し: OFF'}
          >
            💬
          </button>
          {DORM_IDS.map((dorm) => (
            <button
              key={dorm}
              onClick={() => setDormitory(dorm)}
              style={{
                width: '36px',
                height: '36px',
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

