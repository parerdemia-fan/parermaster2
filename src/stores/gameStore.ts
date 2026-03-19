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
  recordAnswer: (isCorrect: boolean, selectedIndex?: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
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
}))
