import { create } from 'zustand'

const STORAGE_KEY = 'parermaster2_question_history'
const CLEARED_KEY = 'parermaster2_question_cleared'

/** フィンガープリント → 連続正解回数。キーの存在＝一度は回答したことがある */
export type HistoryRecords = Record<string, number>

/** 一度でも正解した問題のフィンガープリント集合 */
export type ClearedRecords = Record<string, true>

function loadRecords(): HistoryRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as HistoryRecords
  } catch {
    return {}
  }
}

function saveRecords(records: HistoryRecords): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function loadClearedKeys(): string[] {
  try {
    const raw = localStorage.getItem(CLEARED_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

/**
 * 正解済み集合を復元する。
 * 連続正解回数が残っている問題は正解済みとみなす（CLEARED_KEY 導入前のセーブデータ救済）。
 */
function loadCleared(records: HistoryRecords): ClearedRecords {
  const cleared: ClearedRecords = {}
  for (const [fp, streak] of Object.entries(records)) {
    if (streak > 0) cleared[fp] = true
  }
  for (const fp of loadClearedKeys()) {
    cleared[fp] = true
  }
  return cleared
}

function saveCleared(cleared: ClearedRecords): void {
  localStorage.setItem(CLEARED_KEY, JSON.stringify(Object.keys(cleared)))
}

interface QuestionHistoryState {
  records: HistoryRecords
  cleared: ClearedRecords
  /** 正解→連続正解回数をインクリメント、不正解→0にリセット */
  recordResult: (fingerprint: string, isCorrect: boolean) => void
  /** 正解履歴を全消去（データリセット用） */
  reset: () => void
}

export const useQuestionHistoryStore = create<QuestionHistoryState>()(
  (set, get) => {
    const records = loadRecords()
    return {
      records,
      cleared: loadCleared(records),

      recordResult: (fingerprint, isCorrect) => {
        const records = { ...get().records }
        records[fingerprint] = isCorrect ? (records[fingerprint] ?? 0) + 1 : 0
        saveRecords(records)
        set({ records })

        if (!isCorrect || get().cleared[fingerprint]) return
        const cleared: ClearedRecords = { ...get().cleared, [fingerprint]: true }
        saveCleared(cleared)
        set({ cleared })
      },

      reset: () => {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(CLEARED_KEY)
        set({ records: {}, cleared: {} })
      },
    }
  },
)
