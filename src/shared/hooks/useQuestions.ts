import { useEffect, useState } from 'react'
import type { QuestionData, QuestionsJson } from '../types/question.ts'

const BASE = import.meta.env.BASE_URL

let cachedQuestions: QuestionData[] | null = null
let cachedAnswerSets: Record<string, string[]> | null = null

export function useQuestions() {
  const [questions, setQuestions] = useState<QuestionData[]>(cachedQuestions ?? [])
  const [answerSets, setAnswerSets] = useState<Record<string, string[]>>(cachedAnswerSets ?? {})
  const [loading, setLoading] = useState(cachedQuestions === null)

  useEffect(() => {
    if (cachedQuestions) return

    fetch(`${BASE}data/questions.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<QuestionsJson>
      })
      .then((data) => {
        cachedQuestions = data.questions
        cachedAnswerSets = data.answerSets
        setQuestions(data.questions)
        setAnswerSets(data.answerSets)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return { questions, answerSets, loading }
}
