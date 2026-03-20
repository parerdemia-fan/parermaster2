import type { BadgeRank, BadgeSlotId } from './types.ts'
import type { Difficulty, GameMode, Generation, Scope } from '../../stores/settingsStore.ts'

export type BadgeCategory = 'clear' | 'knowledge'

export interface BadgeSlotDef {
  id: BadgeSlotId
  label: string
  category: BadgeCategory
  maxRank: BadgeRank
}

export const BADGE_SLOTS: readonly BadgeSlotDef[] = [
  // 2期生エリア
  { id: 'gen2_wa', label: '2期生・バゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen2_me', label: '2期生・ミュゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen2_co', label: '2期生・クゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen2_wh', label: '2期生・ウィニー寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen2_all', label: '2期生・全員', category: 'clear', maxRank: 'gold' },
  { id: 'gen2_knowledge', label: '2期生・知識クイズ', category: 'knowledge', maxRank: 'bronze' },
  // 1期生エリア
  { id: 'gen1_wa', label: '1期生・バゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen1_me', label: '1期生・ミュゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen1_co', label: '1期生・クゥ寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen1_wh', label: '1期生・ウィニー寮', category: 'clear', maxRank: 'gold' },
  { id: 'gen1_all', label: '1期生・全員', category: 'clear', maxRank: 'gold' },
  { id: 'gen1_knowledge', label: '1期生・知識クイズ', category: 'knowledge', maxRank: 'gold' },
] as const

export const GEN2_SLOT_IDS: readonly BadgeSlotId[] = BADGE_SLOTS.filter((s) =>
  s.id.startsWith('gen2_'),
).map((s) => s.id)

export const GEN1_SLOT_IDS: readonly BadgeSlotId[] = BADGE_SLOTS.filter((s) =>
  s.id.startsWith('gen1_'),
).map((s) => s.id)

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

export function toSlotId(gameMode: GameMode, generation: Generation, scope: Scope): BadgeSlotId {
  if (gameMode === 'knowledge') return `${generation}_knowledge` as BadgeSlotId
  return `${generation}_${scope}` as BadgeSlotId
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
