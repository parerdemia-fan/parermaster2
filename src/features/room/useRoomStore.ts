import { create } from 'zustand'

const STORAGE_KEY = 'parermaster2_room'
const DORMITORIES = ['wa', 'me', 'co', 'wh'] as const
type DormId = typeof DORMITORIES[number]

export type SlotPosition = 'left' | 'center' | 'right'

interface RoomState {
  /** 各スロットのタレントID（null = 空） */
  slots: Record<SlotPosition, string | null>
  /** 談話室の背景寮 */
  dormitory: DormId
  /** 現在開いているセレクターのスロット（null = 閉じている） */
  activeSelector: SlotPosition | null
}

interface RoomActions {
  setSlot: (position: SlotPosition, talentId: string | null) => void
  setDormitory: (dorm: DormId) => void
  openSelector: (position: SlotPosition) => void
  closeSelector: () => void
}

function loadState(): Pick<RoomState, 'slots' | 'dormitory'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        slots: {
          left: data.left ?? null,
          center: data.center ?? null,
          right: data.right ?? null,
        },
        dormitory: DORMITORIES.includes(data.dormitory) ? data.dormitory : randomDorm(),
      }
    }
  } catch { /* ignore */ }
  return { slots: { left: null, center: null, right: null }, dormitory: randomDorm() }
}

function randomDorm(): DormId {
  return DORMITORIES[Math.floor(Math.random() * DORMITORIES.length)]
}

function saveState(slots: RoomState['slots'], dormitory: DormId) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    left: slots.left,
    center: slots.center,
    right: slots.right,
    dormitory,
  }))
}

const initial = loadState()

export const useRoomStore = create<RoomState & RoomActions>()((set, get) => ({
  slots: initial.slots,
  dormitory: initial.dormitory,
  activeSelector: null,

  setSlot: (position, talentId) => {
    const slots = { ...get().slots, [position]: talentId }
    saveState(slots, get().dormitory)
    set({ slots, activeSelector: null })
  },

  setDormitory: (dorm) => {
    saveState(get().slots, dorm)
    set({ dormitory: dorm })
  },

  openSelector: (position) => set({ activeSelector: position }),
  closeSelector: () => set({ activeSelector: null }),
}))
