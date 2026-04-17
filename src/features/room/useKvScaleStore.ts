import { create } from 'zustand'
import { KV_SCALE_MAP } from './kvScaleMap.ts'

const STORAGE_KEY = 'parermaster2_kv_scale_overrides'

interface KvScaleState {
  /** チェック画面からの上書き。localStorage に永続化される（開発時調整用） */
  overrides: Record<string, number>
}

interface KvScaleActions {
  setOverride: (talentId: string, scale: number) => void
  resetOverride: (talentId: string) => void
  resetAll: () => void
}

function loadOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, number>
  } catch { /* ignore */ }
  return {}
}

function save(overrides: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export const useKvScaleStore = create<KvScaleState & KvScaleActions>()((set, get) => ({
  overrides: loadOverrides(),
  setOverride: (id, scale) => {
    const next = { ...get().overrides, [id]: scale }
    save(next)
    set({ overrides: next })
  },
  resetOverride: (id) => {
    const next = { ...get().overrides }
    delete next[id]
    save(next)
    set({ overrides: next })
  },
  resetAll: () => {
    save({})
    set({ overrides: {} })
  },
}))

/** overrides > KV_SCALE_MAP > 1.0 */
export function resolveKvScale(talentId: string | null, overrides: Record<string, number>): number {
  if (!talentId) return 1.0
  return overrides[talentId] ?? KV_SCALE_MAP[talentId] ?? 1.0
}

export function useKvScale(talentId: string | null): number {
  return useKvScaleStore((s) => resolveKvScale(talentId, s.overrides))
}
