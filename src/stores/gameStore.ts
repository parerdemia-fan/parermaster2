import { create } from 'zustand'
import type { AnswerRecord, BaseQuestion } from '../features/quiz/types.ts'

export type QuizState = 'answering' | 'answered'

/** ペナルティ1回あたりの加算秒数 */
const PENALTY_SECONDS = 5

interface GameState {
  questions: BaseQuestion[]
  currentIndex: number
  quizState: QuizState
  correctCount: number
  answerRecords: AnswerRecord[]
  // タイマー（タイムアタック用）
  timerStartedAt: number | null
  accumulatedTime: number
  penaltyCount: number
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
  addPenalty: () => void
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
  penaltyCount: 0,

  startQuiz: (questions) =>
    set({
      questions,
      currentIndex: 0,
      quizState: 'answering',
      correctCount: 0,
      answerRecords: [],
      timerStartedAt: null,
      accumulatedTime: 0,
      penaltyCount: 0,
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
  startTimer: () => set({ timerStartedAt: Date.now(), accumulatedTime: 0, penaltyCount: 0 }),

  pauseTimer: () => {
    const { timerStartedAt, accumulatedTime } = get()
    if (timerStartedAt == null) return
    set({
      accumulatedTime: accumulatedTime + (Date.now() - timerStartedAt),
      timerStartedAt: null,
    })
  },

  resumeTimer: () => set({ timerStartedAt: Date.now() }),

  addPenalty: () => set((s) => ({ penaltyCount: s.penaltyCount + 1 })),

  getElapsedMs: () => {
    const { timerStartedAt, accumulatedTime, penaltyCount } = get()
    const running = timerStartedAt != null ? Date.now() - timerStartedAt : 0
    return accumulatedTime + running + penaltyCount * PENALTY_SECONDS * 1000
  },
}))
