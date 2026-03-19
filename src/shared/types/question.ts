export interface QuestionData {
  id: string
  generation: number
  question: string
  answers: string[]
  difficulty: number
  genre: string
  sortAnswers: boolean
  hideIcon: boolean
  questionImage: string | null
  commentImage: string | null
  answerPool: string
  comment: string
  sourceUrl: string
}

export interface QuestionsJson {
  version: number
  questions: QuestionData[]
  answerSets: Record<string, string[]>
}
