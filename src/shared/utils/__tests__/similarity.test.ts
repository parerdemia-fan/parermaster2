import { describe, it, expect } from 'vitest'
import { selectSimilarDistractors } from '../similarity.ts'
import type { Talent } from '../../types/talent.ts'

function makeTalent(id: string, hairColor: string, hairStyle: string): Talent {
  return {
    id,
    generation: 2,
    dormitory: 'co',
    name: `タレント${id}`,
    kana: '',
    familyName: '',
    givenName: '',
    familyKana: '',
    givenKana: '',
    nickname: '',
    firstPerson: '',
    intro: '',
    dream: '',
    birthday: '',
    height: 160,
    bloodType: '',
    hairColor,
    hairStyle,
    eyeColorLeft: '',
    eyeColorRight: '',
    mbti: '',
    fanName: '',
    fanMark: '',
    hashtags: [],
    hobbies: [],
    skills: [],
    favorites: [],
    links: [],
  }
}

describe('selectSimilarDistractors', () => {
  const target = makeTalent('T0', 'pink', 'ロング')
  const pool = [
    target,
    makeTalent('T1', 'pink', 'ショート'),      // 同じ髪色
    makeTalent('T2', 'red', 'ポニーテール'),     // 似た髪色(pink→red)
    makeTalent('T3', 'darkpink', 'ショート'),    // 似た髪色(pink→darkpink)
    makeTalent('T4', 'blue', 'ロング'),          // 同じ髪型
    makeTalent('T5', 'green', 'ロングツインテール'), // 似た髪型(ロング→ロングツインテール)
    makeTalent('T6', 'black', 'ショート'),       // その他
  ]

  it('髪色優先モードで同じ髪色のタレントを最優先で選出する', () => {
    const result = selectSimilarDistractors(target, pool, 3, 'color')
    expect(result).toHaveLength(3)
    // T1(同じ髪色)が必ず含まれる
    expect(result.some((t) => t.id === 'T1')).toBe(true)
    // 正解(T0)は含まれない
    expect(result.some((t) => t.id === 'T0')).toBe(false)
  })

  it('髪型優先モードで同じ髪型のタレントを最優先で選出する', () => {
    const result = selectSimilarDistractors(target, pool, 3, 'style')
    expect(result).toHaveLength(3)
    // T4(同じ髪型)が必ず含まれる
    expect(result.some((t) => t.id === 'T4')).toBe(true)
  })

  it('正解タレントは選出されない', () => {
    const result = selectSimilarDistractors(target, pool, 3)
    expect(result.every((t) => t.id !== target.id)).toBe(true)
  })

  it('重複なく選出される', () => {
    const result = selectSimilarDistractors(target, pool, 3)
    const ids = result.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('プールが少ない場合は可能な数だけ返す', () => {
    const smallPool = [target, makeTalent('T1', 'pink', 'ショート')]
    const result = selectSimilarDistractors(target, smallPool, 3)
    expect(result).toHaveLength(1)
  })

  it('類似グループに定義されていない髪色でもフォールバックする', () => {
    const unknownTarget = makeTalent('U0', 'rainbow', 'ボブ')
    const result = selectSimilarDistractors(unknownTarget, pool, 3)
    expect(result).toHaveLength(3)
  })
})
