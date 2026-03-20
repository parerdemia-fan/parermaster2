import { create } from 'zustand'
import type { BadgeRank, BadgeSlotId } from '../features/achievement/types.ts'
import {
  BADGE_SLOTS,
  GEN1_SLOT_IDS,
  GEN2_SLOT_IDS,
  getBadgeSlotDef,
  isRankHigherOrEqual,
} from '../features/achievement/constants.ts'

const STORAGE_KEY = 'parermaster2_badges'

type BadgeMap = Partial<Record<BadgeSlotId, BadgeRank>>

function loadBadges(): BadgeMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as BadgeMap
  } catch {
    return {}
  }
}

function saveBadges(badges: BadgeMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(badges))
}

interface BadgeState {
  badges: BadgeMap
}

interface BadgeActions {
  /** バッジ付与（上位ランクのみ上書き）。実際に更新されたら true を返す */
  awardBadge: (slotId: BadgeSlotId, rank: BadgeRank) => boolean
  getBadgeRank: (slotId: BadgeSlotId) => BadgeRank | null
  isMaxLevel: (slotId: BadgeSlotId) => boolean
  /** 該当スロットでシルバー以上を獲得済みか（★★★解放判定） */
  isDifficulty3Unlocked: (slotId: BadgeSlotId) => boolean
  isGen2Master: () => boolean
  isGen1Master: () => boolean
  isParerMaster: () => boolean
  isTimeAttackUnlocked: () => boolean
  /** 全バッジをリセット */
  resetAll: () => void
}

function isSlotMaxLevel(badges: BadgeMap, slotId: BadgeSlotId): boolean {
  const current = badges[slotId]
  if (!current) return false
  const def = getBadgeSlotDef(slotId)
  return isRankHigherOrEqual(current, def.maxRank)
}

function isAreaComplete(badges: BadgeMap, slotIds: readonly BadgeSlotId[]): boolean {
  return slotIds.every((id) => isSlotMaxLevel(badges, id))
}

export const useBadgeStore = create<BadgeState & BadgeActions>()((set, get) => ({
  badges: loadBadges(),

  awardBadge: (slotId, rank) => {
    const { badges } = get()
    const current = badges[slotId]
    // 既に同等以上のランクなら何もしない
    if (current && isRankHigherOrEqual(current, rank)) return false
    const updated = { ...badges, [slotId]: rank }
    saveBadges(updated)
    set({ badges: updated })
    return true
  },

  getBadgeRank: (slotId) => {
    return get().badges[slotId] ?? null
  },

  isMaxLevel: (slotId) => {
    return isSlotMaxLevel(get().badges, slotId)
  },

  isDifficulty3Unlocked: (slotId) => {
    const current = get().badges[slotId]
    if (!current) return false
    return isRankHigherOrEqual(current, 'silver')
  },

  isGen2Master: () => isAreaComplete(get().badges, GEN2_SLOT_IDS),
  isGen1Master: () => isAreaComplete(get().badges, GEN1_SLOT_IDS),

  isParerMaster: () => {
    const badges = get().badges
    return isAreaComplete(badges, GEN2_SLOT_IDS) && isAreaComplete(badges, GEN1_SLOT_IDS)
  },

  isTimeAttackUnlocked: () => {
    const badges = get().badges
    return BADGE_SLOTS.every((slot) => isSlotMaxLevel(badges, slot.id))
  },

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ badges: {} })
  },
}))
