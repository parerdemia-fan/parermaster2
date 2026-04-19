import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PERSONALITY_AXES,
  computeAxisMax,
  standardizeTalentVector,
  standardizePlayerVector,
  computeTop3,
  cosineSimilarity,
  profileToVector,
  type PersonalityProfile,
  type DiagnosisQuestion,
} from '../useDiagnosis.ts'

const PERSONALITY_PATH = resolve(__dirname, '../../../../public/data/personality.json')
const QUESTIONS_GEN1_PATH = resolve(__dirname, '../../../../public/data/diagnosis-questions-gen1.json')

const personalityJson = JSON.parse(readFileSync(PERSONALITY_PATH, 'utf-8')) as {
  profiles: Record<string, PersonalityProfile>
}
const questionsJson = JSON.parse(readFileSync(QUESTIONS_GEN1_PATH, 'utf-8')) as {
  questions: DiagnosisQuestion[]
}

// 1期生プロファイルのみで Monte Carlo 比較（gen1 がレガシー互換の基準）
const profiles = Object.fromEntries(
  Object.entries(personalityJson.profiles).filter(([id]) => id.startsWith('25')),
)
const questions = questionsJson.questions

/* ── 再現性のあるシード付き乱数 (mulberry32) ── */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('cosineSimilarity', () => {
  it('同一ベクトルの類似度は 1', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })
  it('直交ベクトルの類似度は 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
  })
  it('ゼロベクトルを含む場合は 0', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0)
  })
  it('反対方向のベクトルは -1', () => {
    expect(cosineSimilarity([1, 2], [-1, -2])).toBeCloseTo(-1)
  })
})

describe('profileToVector', () => {
  it('軸順に [tension, interest, thinking, stance, expression] を返す', () => {
    const p: PersonalityProfile = { tension: 1, interest: 2, thinking: 3, stance: 4, expression: 5 }
    expect(profileToVector(p)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('computeAxisMax', () => {
  const max = computeAxisMax(questions)

  it('全軸で 0 より大きい（ゼロ除算ガード）', () => {
    for (const axis of PERSONALITY_AXES) {
      expect(max[axis]).toBeGreaterThan(0)
    }
  })

  it('質問データの軸別最大合計と一致する', () => {
    expect(max.tension).toBe(23)
    expect(max.interest).toBe(19)
    expect(max.thinking).toBe(23)
    expect(max.stance).toBe(26)
    expect(max.expression).toBe(26)
  })
})

describe('standardizeTalentVector', () => {
  it('中心化後の合計は 0', () => {
    const p: PersonalityProfile = { tension: 7, interest: 4, thinking: 5, stance: 9, expression: 8 }
    const v = standardizeTalentVector(p)
    expect(v.reduce((s, x) => s + x, 0)).toBeCloseTo(0)
  })

  it('全軸同値なら零ベクトル（特徴なし）', () => {
    const p: PersonalityProfile = { tension: 5, interest: 5, thinking: 5, stance: 5, expression: 5 }
    const v = standardizeTalentVector(p)
    for (const x of v) expect(x).toBeCloseTo(0)
  })
})

describe('standardizePlayerVector', () => {
  const playerMax = computeAxisMax(questions)

  it('プレイヤーが各軸の理論最大を取った場合は零ベクトル（全軸均等最大）', () => {
    const all9: Record<string, number> = Object.fromEntries(
      PERSONALITY_AXES.map((a) => [a, playerMax[a]]),
    )
    const v = standardizePlayerVector(all9, playerMax)
    for (const x of v) expect(x).toBeCloseTo(0)
  })

  it('中心化後の合計は 0', () => {
    const scores: Record<string, number> = { tension: 10, interest: 5, thinking: 8, stance: 12, expression: 15 }
    const v = standardizePlayerVector(scores, playerMax)
    expect(v.reduce((s, x) => s + x, 0)).toBeCloseTo(0)
  })
})

/* ── Monte Carlo: バイアス比較 ── */

interface BiasStats {
  max: number
  min: number
  mean: number
  std: number
  zeroCount: number
  maxMinRatio: number
}

function summarize(counts: Map<string, number>): BiasStats {
  const values = [...counts.values()]
  const max = Math.max(...values)
  const min = Math.min(...values)
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const std = Math.sqrt(variance)
  const zeroCount = values.filter((v) => v === 0).length
  const maxMinRatio = min === 0 ? Infinity : max / min
  return { max, min, mean, std, zeroCount, maxMinRatio }
}

describe('Monte Carlo バイアス比較', () => {
  const N = 10000

  const initCounts = () => {
    const m = new Map<string, number>()
    for (const id of Object.keys(profiles)) m.set(id, 0)
    return m
  }

  it(`N=${N} のランダムプレイヤーで legacy vs pearson の偏りを比較`, () => {
    const rng = mulberry32(20260419)

    const top3Legacy = initCounts()
    const top3P = initCounts()
    const firstLegacy = initCounts()
    const firstP = initCounts()

    for (let i = 0; i < N; i++) {
      const scores: Record<string, number> = Object.fromEntries(PERSONALITY_AXES.map((a) => [a, 0]))
      for (const q of questions) {
        const idx = Math.floor(rng() * q.choices.length)
        const choice = q.choices[idx]
        for (const [axis, val] of Object.entries(choice.scores)) {
          scores[axis] = (scores[axis] ?? 0) + val
        }
      }
      const tL = computeTop3(scores, profiles, questions, { algorithm: 'legacy' })
      const tP = computeTop3(scores, profiles, questions, { algorithm: 'pearson' })

      for (const r of tL) top3Legacy.set(r.talentId, (top3Legacy.get(r.talentId) ?? 0) + 1)
      for (const r of tP) top3P.set(r.talentId, (top3P.get(r.talentId) ?? 0) + 1)
      firstLegacy.set(tL[0].talentId, (firstLegacy.get(tL[0].talentId) ?? 0) + 1)
      firstP.set(tP[0].talentId, (firstP.get(tP[0].talentId) ?? 0) + 1)
    }

    const t3L = summarize(top3Legacy)
    const t3P = summarize(top3P)
    const f1L = summarize(firstLegacy)
    const f1P = summarize(firstP)

    const fmt = (s: BiasStats) => ({
      max: s.max,
      min: s.min,
      mean: Math.round(s.mean * 10) / 10,
      std: Math.round(s.std * 10) / 10,
      zeroCount: s.zeroCount,
      'max/min比': s.maxMinRatio === Infinity ? '∞' : s.maxMinRatio.toFixed(2),
    })

    console.log(`\n── Top3 登場回数（N=${N}, タレント=${Object.keys(profiles).length}）──`)
    console.table({ legacy: fmt(t3L), pearson: fmt(t3P) })

    console.log('\n── 1位 登場回数 ──')
    console.table({ legacy: fmt(f1L), pearson: fmt(f1P) })

    const sortedL = [...top3Legacy.entries()].sort((a, b) => b[1] - a[1])
    const sortedP = [...top3P.entries()].sort((a, b) => b[1] - a[1])
    console.log('\n── Top3 登場 上位5 ──')
    console.table({
      legacy: sortedL.slice(0, 5).map(([id, c]) => `${id}:${c}`),
      pearson: sortedP.slice(0, 5).map(([id, c]) => `${id}:${c}`),
    })
    console.log('\n── Top3 登場 下位5 ──')
    console.table({
      legacy: sortedL.slice(-5).map(([id, c]) => `${id}:${c}`),
      pearson: sortedP.slice(-5).map(([id, c]) => `${id}:${c}`),
    })

    // アサーションはしない（プロデューサー確認用の情報提示）
    expect(t3L.zeroCount).toBe(0)
    expect(t3P.zeroCount).toBe(0)
  }, 30000)
})
