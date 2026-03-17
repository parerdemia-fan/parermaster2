import { create } from 'zustand'
import type { AnswerRecord, ProcessedQuestion } from '../features/quiz/types.ts'

export type QuizState = 'answering' | 'answered'

interface GameState {
  questions: ProcessedQuestion[]
  currentIndex: number
  quizState: QuizState
  selectedAnswer: number | null
  correctCount: number
  answerRecords: AnswerRecord[]
}

interface GameActions {
  startQuiz: (questions: ProcessedQuestion[]) => void
  selectAnswer: (index: number) => void
  nextQuestion: () => void
  isLastQuestion: () => boolean
}

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  questions: [],
  currentIndex: 0,
  quizState: 'answering',
  selectedAnswer: null,
  correctCount: 0,
  answerRecords: [],

  startQuiz: (questions) =>
    set({
      questions,
      currentIndex: 0,
      quizState: 'answering',
      selectedAnswer: null,
      correctCount: 0,
      answerRecords: [],
    }),

  selectAnswer: (index) => {
    const { questions, currentIndex, correctCount, answerRecords } = get()
    const current = questions[currentIndex]
    if (!current) return

    const isCorrect = index === current.correctIndex
    const newRecords = [...answerRecords]
    newRecords[currentIndex] = { selectedAnswer: index, isCorrect }

    set({
      selectedAnswer: index,
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
      selectedAnswer: null,
    })
  },

  isLastQuestion: () => {
    const { currentIndex, questions } = get()
    return currentIndex >= questions.length - 1
  },
}))
