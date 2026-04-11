import { create } from 'zustand'

const STORAGE_KEY = 'parermaster2_question_history'

/** フィンガープリント → 連続正解回数 */
type HistoryRecords = Record<string, number>

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

interface QuestionHistoryState {
  records: HistoryRecords
  /** 正解→連続正解回数をインクリメント、不正解→0にリセット */
  recordResult: (fingerprint: string, isCorrect: boolean) => void
}

export const useQuestionHistoryStore = create<QuestionHistoryState>()(
  (set, get) => ({
    records: loadRecords(),

    recordResult: (fingerprint, isCorrect) => {
      const records = { ...get().records }
      records[fingerprint] = isCorrect ? (records[fingerprint] ?? 0) + 1 : 0
      saveRecords(records)
      set({ records })
    },
  }),
)
