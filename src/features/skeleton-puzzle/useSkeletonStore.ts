import { create } from 'zustand'
import type { PuzzleVariant, Placements, SkeletonProgress } from './types.ts'
import { getStorageKey } from './constants.ts'

interface SkeletonState {
  currentVariant: PuzzleVariant | null
  progressMap: Partial<Record<PuzzleVariant, SkeletonProgress>>
}

interface SkeletonActions {
  selectVariant: (variant: PuzzleVariant) => void
  clearVariant: () => void
  placeWord: (variant: PuzzleVariant, wordId: number, talentId: string) => void
  removeWord: (variant: PuzzleVariant, wordId: number) => void
  moveWord: (variant: PuzzleVariant, fromWordId: number, toWordId: number, talentId: string) => void
  markMessageCompleted: (variant: PuzzleVariant) => void
  markPuzzleCompleted: (variant: PuzzleVariant) => void
  resetProgress: (variant: PuzzleVariant) => void
  getProgress: (variant: PuzzleVariant) => SkeletonProgress
}

function loadProgress(variant: PuzzleVariant): SkeletonProgress {
  try {
    const raw = localStorage.getItem(getStorageKey(variant))
    if (!raw) return { placements: {}, messageCompleted: false, puzzleCompleted: false }
    return JSON.parse(raw) as SkeletonProgress
  } catch {
    return { placements: {}, messageCompleted: false, puzzleCompleted: false }
  }
}

function saveProgress(variant: PuzzleVariant, progress: SkeletonProgress): void {
  localStorage.setItem(getStorageKey(variant), JSON.stringify(progress))
}

function updateAndSave(
  get: () => SkeletonState & SkeletonActions,
  set: (fn: (s: SkeletonState) => Partial<SkeletonState>) => void,
  variant: PuzzleVariant,
  updater: (progress: SkeletonProgress) => SkeletonProgress,
): void {
  const progress = get().getProgress(variant)
  const updated = updater(progress)
  saveProgress(variant, updated)
  set((s) => ({ progressMap: { ...s.progressMap, [variant]: updated } }))
}

export const useSkeletonStore = create<SkeletonState & SkeletonActions>()(
  (set, get) => ({
    currentVariant: null,
    progressMap: {},

    selectVariant: (variant) => {
      const progress = loadProgress(variant)
      set((s) => ({
        currentVariant: variant,
        progressMap: { ...s.progressMap, [variant]: progress },
      }))
    },

    clearVariant: () => set({ currentVariant: null }),

    placeWord: (variant, wordId, talentId) => {
      updateAndSave(get, set, variant, (p) => ({
        ...p,
        placements: { ...p.placements, [wordId]: talentId },
      }))
    },

    removeWord: (variant, wordId) => {
      updateAndSave(get, set, variant, (p) => {
        const placements: Placements = { ...p.placements }
        delete placements[wordId]
        return { ...p, placements }
      })
    },

    moveWord: (variant, fromWordId, toWordId, talentId) => {
      updateAndSave(get, set, variant, (p) => {
        const placements: Placements = { ...p.placements }
        delete placements[fromWordId]
        placements[toWordId] = talentId
        return { ...p, placements }
      })
    },

    markMessageCompleted: (variant) => {
      updateAndSave(get, set, variant, (p) => ({ ...p, messageCompleted: true }))
    },

    markPuzzleCompleted: (variant) => {
      updateAndSave(get, set, variant, (p) => ({ ...p, puzzleCompleted: true }))
    },

    resetProgress: (variant) => {
      const empty: SkeletonProgress = { placements: {}, messageCompleted: false, puzzleCompleted: false }
      saveProgress(variant, empty)
      set((s) => ({ progressMap: { ...s.progressMap, [variant]: empty } }))
    },

    getProgress: (variant) => {
      return get().progressMap[variant] ?? loadProgress(variant)
    },
  }),
)
