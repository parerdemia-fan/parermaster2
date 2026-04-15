import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

export const PERSONALITY_AXES = ['tension', 'interest', 'thinking', 'stance', 'expression'] as const

export interface DiagnosisChoice {
  text: string
  scores: Record<string, number>
}

export interface DiagnosisQuestion {
  question: string
  choices: DiagnosisChoice[]
}

interface DiagnosisQuestionsJson {
  version: number
  questions: DiagnosisQuestion[]
}

export interface PersonalityProfile {
  tension: number
  interest: number
  thinking: number
  stance: number
  expression: number
}

interface PersonalityJson {
  version: number
  axes: string[]
  axisLabels: Record<string, [string, string]>
  profiles: Record<string, PersonalityProfile>
}

let cachedQuestions: DiagnosisQuestion[] | null = null
let cachedProfiles: Record<string, PersonalityProfile> | null = null
let cachedAxisLabels: Record<string, [string, string]> | null = null

export function useDiagnosisData() {
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>(cachedQuestions ?? [])
  const [profiles, setProfiles] = useState<Record<string, PersonalityProfile>>(cachedProfiles ?? {})
  const [axisLabels, setAxisLabels] = useState<Record<string, [string, string]>>(cachedAxisLabels ?? {})
  const [loading, setLoading] = useState(cachedQuestions === null || cachedProfiles === null)

  useEffect(() => {
    if (cachedQuestions && cachedProfiles) return

    Promise.all([
      fetch(`${BASE}data/diagnosis-questions.json`).then((r) => r.json() as Promise<DiagnosisQuestionsJson>),
      fetch(`${BASE}data/personality.json`).then((r) => r.json() as Promise<PersonalityJson>),
    ]).then(([qData, pData]) => {
      cachedQuestions = qData.questions
      cachedProfiles = pData.profiles
      cachedAxisLabels = pData.axisLabels
      setQuestions(qData.questions)
      setProfiles(pData.profiles)
      setAxisLabels(pData.axisLabels)
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to load diagnosis data:', err)
      setLoading(false)
    })
  }, [])

  return { questions, profiles, axisLabels, loading }
}

/** コサイン類似度を計算（0〜1） */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

/** プロフィールを数値配列に変換 */
export function profileToVector(p: PersonalityProfile): number[] {
  return [p.tension, p.interest, p.thinking, p.stance, p.expression]
}

/* ── 診断結果の受け渡し（モジュールレベル変数） ── */

export interface DiagnosisResult {
  scores: Record<string, number>
  top3: { talentId: string; similarity: number }[]
}

let diagnosisResult: DiagnosisResult | null = null

export function setDiagnosisResult(result: DiagnosisResult): void {
  diagnosisResult = result
}

export function getDiagnosisResult(): DiagnosisResult | null {
  return diagnosisResult
}
