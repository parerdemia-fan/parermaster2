import { create } from 'zustand'
import type { AnswerRecord, BaseQuestion } from '../features/quiz/types.ts'
import type { BadgeRank } from '../features/achievement/types.ts'

/** 結果画面のバッジ表示情報（デバッグ用オーバーライドにも使用） */
export interface BadgeAwardResult {
  awarded: boolean
  isRankUp: boolean
  slotLabel: string
  rank: BadgeRank | null
  badgeCategory: 'clear' | 'knowledge' | null
  masterAchievement: string | null
}

export type QuizState = 'answering' | 'answered'

/** 問題タイプ別ペナルティ秒数 */
const PENALTY_SECONDS: Record<string, number> = {
  'name-build': 15,
  'blur': 10,
  'spotlight': 10,
}
const DEFAULT_PENALTY_SECONDS = 5

export function getPenaltySeconds(questionType: string): number {
  return PENALTY_SECONDS[questionType] ?? DEFAULT_PENALTY_SECONDS
}

interface GameState {
  questions: BaseQuestion[]
  currentIndex: number
  quizState: QuizState
  correctCount: number
  answerRecords: AnswerRecord[]
  // タイマー（タイムアタック用）
  timerStartedAt: number | null
  accumulatedTime: number
  /** ペナルティ累計（ミリ秒） */
  penaltyMs: number
  /** デバッグ用: 結果画面のバッジ表示をオーバーライド（nullなら通常判定） */
  debugBadgeOverride: BadgeAwardResult | null
}

interface GameActions {
  startQuiz: (questions: BaseQuestion[]) => void
  recordAnswer: (isCorrect: boolean, selectedIndex?: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  isLastQuestion: () => boolean
  // タイマー
  startTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  addPenalty: (seconds: number) => void
  /** 現在の経過時間（ms）= 累積 + 稼働中の分 + ペナルティ */
  getElapsedMs: () => number
}

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  questions: [],
  currentIndex: 0,
  quizState: 'answering',
  correctCount: 0,
  answerRecords: [],
  timerStartedAt: null,
  accumulatedTime: 0,
  penaltyMs: 0,
  debugBadgeOverride: null,

  startQuiz: (questions) =>
    set({
      questions,
      currentIndex: 0,
      quizState: 'answering',
      correctCount: 0,
      answerRecords: [],
      timerStartedAt: null,
      accumulatedTime: 0,
      penaltyMs: 0,
      debugBadgeOverride: null,
    }),

  recordAnswer: (isCorrect, selectedIndex) => {
    const { currentIndex, correctCount, answerRecords } = get()
    const newRecords = [...answerRecords]
    newRecords[currentIndex] = { isCorrect, selectedIndex }

    set({
      quizState: 'answered',
      correctCount: isCorrect ? correctCount + 1 : correctCount,
      answerRecords: newRecords,
    })
  },

  nextQuestion: () => {
    const { currentIndex, questions, answerRecords } = get()
    if (currentIndex >= questions.length - 1) return

    const nextIndex = currentIndex + 1
    set({
      currentIndex: nextIndex,
      quizState: answerRecords[nextIndex] ? 'answered' : 'answering',
    })
  },

  prevQuestion: () => {
    const { currentIndex } = get()
    if (currentIndex <= 0) return

    set({
      currentIndex: currentIndex - 1,
      quizState: 'answered',
    })
  },

  isLastQuestion: () => {
    const { currentIndex, questions } = get()
    return currentIndex >= questions.length - 1
  },

  // タイマー
  startTimer: () => set({ timerStartedAt: Date.now(), accumulatedTime: 0, penaltyMs: 0 }),

  pauseTimer: () => {
    const { timerStartedAt, accumulatedTime } = get()
    if (timerStartedAt == null) return
    set({
      accumulatedTime: accumulatedTime + (Date.now() - timerStartedAt),
      timerStartedAt: null,
    })
  },

  resumeTimer: () => set({ timerStartedAt: Date.now() }),

  addPenalty: (seconds) => set((s) => ({ penaltyMs: s.penaltyMs + seconds * 1000 })),

  getElapsedMs: () => {
    const { timerStartedAt, accumulatedTime, penaltyMs } = get()
    const running = timerStartedAt != null ? Date.now() - timerStartedAt : 0
    return accumulatedTime + running + penaltyMs
  },
}))
