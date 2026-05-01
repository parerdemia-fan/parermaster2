import type { PuzzleVariant } from './types.ts'

export const PUZZLE_VARIANTS: { variant: PuzzleVariant; label: string; ready: boolean }[] = [
  { variant: 'gen1', label: '1期生', ready: true },
  { variant: 'gen2', label: '2期生', ready: true },
  { variant: 'all', label: '全員', ready: true },
]

export const NUMBERED_LABELS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

export const STORAGE_KEY_PREFIX = 'parermaster2_skeleton_'

export function getStorageKey(variant: PuzzleVariant): string {
  return `${STORAGE_KEY_PREFIX}${variant}`
}
