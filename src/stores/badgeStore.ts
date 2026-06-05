import { create } from 'zustand'
import type { BadgeRank, BadgeSlotId } from '../features/achievement/types.ts'
import {
  GEN1_SLOT_IDS,
  GEN2_SLOT_IDS,
  getBadgeSlotDef,
  isRankHigherOrEqual,
} from '../features/achievement/constants.ts'

const STORAGE_KEY = 'parermaster2_badges'
const ACHIEVEMENTS_KEY = 'parermaster2_achievements'
/** achieved-once 称号フラグの初期化（既存到達者の救済）を一度だけ行うためのガード */
const ACHIEVEMENTS_MIGRATION_KEY = 'parermaster2_achievements_migrated'

type BadgeMap = Partial<Record<BadgeSlotId, BadgeRank>>

/**
 * 一度成立したら維持する称号状態（剥奪防止）。
 * バッジの最大ランク（maxRank）が将来引き上げられても、過去に成立した称号・タイムアタック解放を
 * 失わないために永続化する。バッジ値そのものは別管理で、ここでは一切書き換えない。
 */
interface Achievements {
  gen2Master?: boolean
  gen1Master?: boolean
}

function loadBadges(): BadgeMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BadgeMap) : {}
  } catch {
    return {}
  }
}

function saveBadges(badges: BadgeMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(badges))
}

function loadAchievements(): Achievements {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY)
    return raw ? (JSON.parse(raw) as Achievements) : {}
  } catch {
    return {}
  }
}

function saveAchievements(achievements: Achievements): void {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements))
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

/** 現在のバッジから achieved-once フラグを更新（一度 true になったら維持） */
export function deriveAchievements(badges: BadgeMap, prev: Achievements): Achievements {
  return {
    gen2Master: prev.gen2Master || isAreaComplete(badges, GEN2_SLOT_IDS),
    gen1Master: prev.gen1Master || isAreaComplete(badges, GEN1_SLOT_IDS),
  }
}

/**
 * 「むずかしい」解放で gen2_knowledge の最大がシルバー→ゴールドへ上がったため、
 * 旧ルール（知識シルバーが最大）で既に成立していた称号・タイムアタック解放を失わないよう、
 * 達成フラグを一度だけ初期化する。**バッジ値（シルバー等）は一切変更しない。**
 */
export function migrateAchievements(badges: BadgeMap, achievements: Achievements): Achievements {
  try {
    if (localStorage.getItem(ACHIEVEMENTS_MIGRATION_KEY)) return achievements
    localStorage.setItem(ACHIEVEMENTS_MIGRATION_KEY, '1')
    const atLeastSilver = (r?: BadgeRank): boolean => r != null && isRankHigherOrEqual(r, 'silver')
    const migrated: Achievements = {
      // 旧2期生マスター: 2期生全員ゴールド ＋ 知識シルバー以上（むずかしい未実装時代の最大到達）
      gen2Master: achievements.gen2Master || (badges.gen2_all === 'gold' && atLeastSilver(badges.gen2_knowledge)),
      // 1期生は最大ランク不変だが、一貫性のため同様に確定
      gen1Master: achievements.gen1Master || isAreaComplete(badges, GEN1_SLOT_IDS),
    }
    if (migrated.gen2Master || migrated.gen1Master) saveAchievements(migrated)
    return migrated
  } catch {
    return achievements
  }
}

interface BadgeState {
  badges: BadgeMap
  achievements: Achievements
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
  /** 全バッジ・称号をリセット */
  resetAll: () => void
}

const initialBadges = loadBadges()
const initialAchievements = migrateAchievements(initialBadges, loadAchievements())

export const useBadgeStore = create<BadgeState & BadgeActions>()((set, get) => ({
  badges: initialBadges,
  achievements: initialAchievements,

  awardBadge: (slotId, rank) => {
    const { badges, achievements } = get()
    const current = badges[slotId]
    // 既に同等以上のランクなら何もしない
    if (current && isRankHigherOrEqual(current, rank)) return false
    const updated = { ...badges, [slotId]: rank }
    saveBadges(updated)
    // 称号フラグを更新（一度成立したら維持）
    const nextAchievements = deriveAchievements(updated, achievements)
    if (
      nextAchievements.gen2Master !== achievements.gen2Master ||
      nextAchievements.gen1Master !== achievements.gen1Master
    ) {
      saveAchievements(nextAchievements)
      set({ badges: updated, achievements: nextAchievements })
    } else {
      set({ badges: updated })
    }
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

  // 称号・解放は achieved-once: 過去に成立していれば維持し、現在のバッジでも成立すれば true
  isGen2Master: () => get().achievements.gen2Master === true || isAreaComplete(get().badges, GEN2_SLOT_IDS),
  isGen1Master: () => get().achievements.gen1Master === true || isAreaComplete(get().badges, GEN1_SLOT_IDS),
  isParerMaster: () => get().isGen2Master() && get().isGen1Master(),
  // タイムアタック解放 = 両世代マスター（世代別4スロットが全て最大）と同値
  isTimeAttackUnlocked: () => get().isGen2Master() && get().isGen1Master(),

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ACHIEVEMENTS_KEY)
    localStorage.removeItem(ACHIEVEMENTS_MIGRATION_KEY)
    localStorage.removeItem('parermaster2_ta_best')
    localStorage.removeItem('parermaster2_staff_roll_seen')
    localStorage.removeItem('parermaster2_question_history')
    set({ badges: {}, achievements: {} })
  },
}))
