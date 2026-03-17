import { create } from 'zustand'
import type { AnswerRecord, BaseQuestion } from '../features/quiz/types.ts'

export type QuizState = 'answering' | 'answered'

interface GameState {
  questions: BaseQuestion[]
  currentIndex: number
  quizState: QuizState
  correctCount: number
  answerRecords: AnswerRecord[]
}

interface GameActions {
  startQuiz: (questions: BaseQuestion[]) => void
  recordAnswer: (isCorrect: boolean) => void
  nextQuestion: () => void
  isLastQuestion: () => boolean
}

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  questions: [],
  currentIndex: 0,
  quizState: 'answering',
  correctCount: 0,
  answerRecords: [],

  startQuiz: (questions) =>
    set({
      questions,
      currentIndex: 0,
      quizState: 'answering',
      correctCount: 0,
      answerRecords: [],
    }),

  recordAnswer: (isCorrect) => {
    const { currentIndex, correctCount, answerRecords } = get()
    const newRecords = [...answerRecords]
    newRecords[currentIndex] = { isCorrect }

    set({
      quizState: 'answered',
      correctCount: isCorrect ? correctCount + 1 : correctCount,
      answerRecords: newRecords,
    })
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get()
    if (currentIndex >= questions.length - 1) return

    set({
      currentIndex: currentIndex + 1,
      quizState: 'answering',
    })
  },

  isLastQuestion: () => {
    const { currentIndex, questions } = get()
    return currentIndex >= questions.length - 1
  },
}))
