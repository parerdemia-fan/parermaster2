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

export type DiagnosisGenerationKey = 1 | 2

/** Setting の 'gen1' | 'gen2' 文字列を 1 | 2 に変換 */
export function toDiagnosisGenKey(gen: 'gen1' | 'gen2'): DiagnosisGenerationKey {
  return gen === 'gen1' ? 1 : 2
}

/** 世代表示ラベル（結果画面・シェア文面などで使用） */
export const GEN_LABELS: Record<DiagnosisGenerationKey, string> = {
  1: '1期生編',
  2: '2期生編',
}

let cachedAllProfiles: Record<string, PersonalityProfile> | null = null
let cachedAxisLabels: Record<string, [string, string]> | null = null
const cachedQuestionsByGen: Record<DiagnosisGenerationKey, DiagnosisQuestion[] | null> = { 1: null, 2: null }
const cachedProfilesByGen: Record<DiagnosisGenerationKey, Record<string, PersonalityProfile> | null> = { 1: null, 2: null }

function filterProfilesByGen(
  all: Record<string, PersonalityProfile>,
  gen: DiagnosisGenerationKey,
): Record<string, PersonalityProfile> {
  const prefix = gen === 1 ? '25' : '26'
  const out: Record<string, PersonalityProfile> = {}
  for (const [id, p] of Object.entries(all)) {
    if (id.startsWith(prefix)) out[id] = p
  }
  return out
}

function updateAllProfiles(all: Record<string, PersonalityProfile>): void {
  cachedAllProfiles = all
  cachedProfilesByGen[1] = filterProfilesByGen(all, 1)
  cachedProfilesByGen[2] = filterProfilesByGen(all, 2)
}

export function useDiagnosisData(gen: DiagnosisGenerationKey) {
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>([])
  const [profiles, setProfiles] = useState<Record<string, PersonalityProfile>>({})
  const [axisLabels, setAxisLabels] = useState<Record<string, [string, string]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cachedQ = cachedQuestionsByGen[gen]
    const cachedP = cachedProfilesByGen[gen]
    if (cachedQ && cachedP) {
      setQuestions(cachedQ)
      setProfiles(cachedP)
      setAxisLabels(cachedAxisLabels ?? {})
      setLoading(false)
      return
    }

    const needPersonality = cachedAllProfiles === null
    const questionsFile = `diagnosis-questions-gen${gen}.json`
    const tasks: Promise<unknown>[] = [
      fetch(`${BASE}data/${questionsFile}`).then((r) => r.json() as Promise<DiagnosisQuestionsJson>),
    ]
    if (needPersonality) {
      tasks.push(fetch(`${BASE}data/personality.json`).then((r) => r.json() as Promise<PersonalityJson>))
    }

    Promise.all(tasks).then((results) => {
      const qData = results[0] as DiagnosisQuestionsJson
      if (needPersonality) {
        const pData = results[1] as PersonalityJson
        updateAllProfiles(pData.profiles)
        cachedAxisLabels = pData.axisLabels
      }
      cachedQuestionsByGen[gen] = qData.questions
      setQuestions(qData.questions)
      setProfiles(cachedProfilesByGen[gen] ?? {})
      setAxisLabels(cachedAxisLabels ?? {})
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to load diagnosis data:', err)
      setLoading(false)
    })
  }, [gen])

  return { questions, profiles, axisLabels, loading }
}

/** コサイン類似度を計算（-1〜1。全正ベクトルなら 0〜1） */
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

/* ── バイアス補正ユーティリティ ── */

/** 各軸で「質問ごとの最大加点」を合計したプレイヤー理論最大値 */
export function computeAxisMax(questions: DiagnosisQuestion[]): Record<string, number> {
  const max: Record<string, number> = {}
  for (const axis of PERSONALITY_AXES) max[axis] = 0
  for (const q of questions) {
    const perQ: Record<string, number> = {}
    for (const axis of PERSONALITY_AXES) perQ[axis] = 0
    for (const c of q.choices) {
      for (const axis of PERSONALITY_AXES) {
        const v = c.scores[axis] ?? 0
        if (v > perQ[axis]) perQ[axis] = v
      }
    }
    for (const axis of PERSONALITY_AXES) max[axis] += perQ[axis]
  }
  for (const axis of PERSONALITY_AXES) {
    if (max[axis] === 0) max[axis] = 1
  }
  return max
}

/** ベクトルを自身の平均で中心化（Pearson 相関の前段） */
function centerByOwnMean(v: number[]): number[] {
  const mean = v.reduce((s, x) => s + x, 0) / v.length
  return v.map((x) => x - mean)
}

/** タレントベクトルを自身の軸平均で中心化 */
export function standardizeTalentVector(profile: PersonalityProfile): number[] {
  return centerByOwnMean(profileToVector(profile))
}

/**
 * プレイヤーベクトルを軸ごとの理論最大で 0..9 にリスケール → 自身の軸平均で中心化。
 * 軸ごとの最大到達スコアの不均衡を吸収した上で Pearson 相関用の中心化を行う。
 */
export function standardizePlayerVector(
  rawScores: Record<string, number>,
  playerMax: Record<string, number>,
): number[] {
  const rescaled = PERSONALITY_AXES.map((axis) => ((rawScores[axis] ?? 0) / playerMax[axis]) * 9)
  return centerByOwnMean(rescaled)
}

/* ── Top3 算出（メモ化つき） ── */

let cachedPlayerMaxRef: DiagnosisQuestion[] | null = null
let cachedPlayerMaxValue: Record<string, number> | null = null

function getPlayerMax(questions: DiagnosisQuestion[]): Record<string, number> {
  if (cachedPlayerMaxRef === questions && cachedPlayerMaxValue) return cachedPlayerMaxValue
  cachedPlayerMaxRef = questions
  cachedPlayerMaxValue = computeAxisMax(questions)
  return cachedPlayerMaxValue
}

export interface ComputeTopOptions {
  algorithm?: 'legacy' | 'pearson'
  topN?: number
}

export function computeTop3(
  rawScores: Record<string, number>,
  profiles: Record<string, PersonalityProfile>,
  questions: DiagnosisQuestion[],
  opts: ComputeTopOptions = {},
): { talentId: string; similarity: number }[] {
  const algorithm = opts.algorithm ?? 'pearson'
  const topN = opts.topN ?? 3

  if (algorithm === 'legacy') {
    const playerVec = PERSONALITY_AXES.map((a) => rawScores[a] ?? 0)
    const results = Object.entries(profiles).map(([talentId, profile]) => ({
      talentId,
      rawSim: cosineSimilarity(playerVec, profileToVector(profile)),
    }))
    results.sort((a, b) => b.rawSim - a.rawSim)
    const simMin = results[results.length - 1].rawSim
    const simRange = 1.0 - simMin || 1
    return results.slice(0, topN).map((r) => ({
      talentId: r.talentId,
      similarity: (r.rawSim - simMin) / simRange,
    }))
  }

  // pearson: 軸ごとのスケール差を吸収した上で Pearson 相関（= 自己中心化 cosine）
  const playerMax = getPlayerMax(questions)
  const playerVec = standardizePlayerVector(rawScores, playerMax)
  const results = Object.entries(profiles).map(([talentId, profile]) => ({
    talentId,
    rawSim: cosineSimilarity(playerVec, standardizeTalentVector(profile)),
  }))
  results.sort((a, b) => b.rawSim - a.rawSim)
  return results.slice(0, topN).map((r) => ({
    talentId: r.talentId,
    similarity: (r.rawSim + 1) / 2,
  }))
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
