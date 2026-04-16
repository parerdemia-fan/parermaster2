import type { BadgeRank, BadgeSlotId } from './types.ts'
import type { Difficulty, GameMode, ModeCategory, Scope } from '../../stores/settingsStore.ts'

export type BadgeCategory = 'clear' | 'knowledge'

export interface BadgeSlotDef {
  id: BadgeSlotId
  label: string
  category: BadgeCategory
  maxRank: BadgeRank
}

export const BADGE_SLOTS: readonly BadgeSlotDef[] = [
  // 2期生エリア
  { id: 'gen2_all', label: '2期生', category: 'clear', maxRank: 'gold' },
  { id: 'gen2_knowledge', label: '2期生・知識クイズ', category: 'knowledge', maxRank: 'silver' },
  // 1期生エリア
  { id: 'gen1_all', label: '1期生', category: 'clear', maxRank: 'gold' },
  { id: 'gen1_knowledge', label: '1期生・知識クイズ', category: 'knowledge', maxRank: 'gold' },
  // 寮別エリア
  { id: 'dorm_wa', label: 'バゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'dorm_me', label: 'ミュゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'dorm_co', label: 'クゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'dorm_wh', label: 'ウィニー寮', category: 'clear', maxRank: 'gold' },
] as const

export const GEN2_SLOT_IDS: readonly BadgeSlotId[] = ['gen2_all', 'gen2_knowledge']

export const GEN1_SLOT_IDS: readonly BadgeSlotId[] = ['gen1_all', 'gen1_knowledge']

export const DORM_SLOT_IDS: readonly BadgeSlotId[] = ['dorm_wa', 'dorm_me', 'dorm_co', 'dorm_wh']

/** タイムアタック解放に必要なスロット（世代別のみ） */
export const TIME_ATTACK_SLOT_IDS: readonly BadgeSlotId[] = [...GEN2_SLOT_IDS, ...GEN1_SLOT_IDS]

const BADGE_SLOT_MAP = new Map(BADGE_SLOTS.map((s) => [s.id, s]))

export function getBadgeSlotDef(id: BadgeSlotId): BadgeSlotDef {
  return BADGE_SLOT_MAP.get(id)!
}

const RANK_ORDER: Record<BadgeRank, number> = { bronze: 1, silver: 2, gold: 3 }

export function isRankHigherOrEqual(a: BadgeRank, b: BadgeRank): boolean {
  return RANK_ORDER[a] >= RANK_ORDER[b]
}

export function difficultyToRank(difficulty: Difficulty): BadgeRank {
  if (difficulty === 3) return 'gold'
  if (difficulty === 2) return 'silver'
  return 'bronze'
}

export function toSlotId(gameMode: GameMode, modeCategory: ModeCategory, scope: Scope): BadgeSlotId {
  if (gameMode === 'knowledge') return `${modeCategory}_knowledge` as BadgeSlotId
  if (modeCategory === 'dorm') return `dorm_${scope}` as BadgeSlotId
  return `${modeCategory}_all` as BadgeSlotId
}

export const RANK_LABELS: Record<BadgeRank, string> = {
  bronze: 'ブロンズ',
  silver: 'シルバー',
  gold: 'ゴールド',
}

export const RANK_COLORS: Record<BadgeRank, string> = {
  bronze: '#cd7f32',
  silver: '#a0a0a0',
  gold: '#ffd700',
}
