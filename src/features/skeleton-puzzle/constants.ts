import type { PuzzleVariant } from './types.ts'

export const PUZZLE_VARIANTS: { variant: PuzzleVariant; label: string; ready: boolean }[] = [
  { variant: 'gen1', label: '1期生', ready: true },
  { variant: 'gen2', label: '2期生', ready: true },
  { variant: 'all', label: '全員', ready: true },
]

export const NUMBERED_LABELS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

export const STORAGE_KEY_PREFIX = 'parermaster2_skeleton_'

/**
 * 保存キーの版（未記載＝初版）。進捗は wordId をキーに保存するため、
 * パズルデータの wordId 構成を変更したら該当 variant の版を上げて既存進捗を捨てる
 */
const STORAGE_KEY_VERSION: Partial<Record<PuzzleVariant, number>> = {
  gen1: 2,
}

export function getStorageKey(variant: PuzzleVariant): string {
  const version = STORAGE_KEY_VERSION[variant]
  return `${STORAGE_KEY_PREFIX}${variant}${version ? `_v${version}` : ''}`
}
