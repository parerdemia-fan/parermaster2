import type { Talent } from '../types/talent.ts'
import { shuffleArray } from './array.ts'

/**
 * 髪色の類似グループ（前作踏襲）
 */
const SIMILAR_HAIR_COLOR_GROUPS: Record<string, string[]> = {
  silver: ['lightblue', 'skyblue'],
  lightblue: ['silver', 'blue', 'skyblue'],
  skyblue: ['lightblue', 'blue', 'silver'],
  blue: ['lightblue', 'darkblue', 'skyblue'],
  green: [],
  darkblue: ['blue', 'purple'],
  purple: ['darkblue', 'lightpurple'],
  lightpurple: ['purple', 'pink'],
  darkpink: ['pink', 'red'],
  pink: ['red', 'darkpink', 'lightpurple'],
  gold: ['yellow', 'orange'],
  yellow: ['gold', 'orange'],
  orange: ['red', 'gold', 'yellow'],
  black: ['darkblue'],
  red: ['darkpink', 'pink', 'orange'],
}

/**
 * 髪型の類似グループ（前作踏襲）
 */
const SIMILAR_HAIR_STYLE_GROUPS: Record<string, string[]> = {
  'ロング': ['ミドル', 'お団子ロング', 'ロングツインテール', '三つ編み'],
  'ミドル': ['ロング', 'ショート', 'ポニーテール'],
  'ショート': ['ミドル', 'お団子ショート', 'ショートツインテール'],
  'お団子ロング': ['お団子ショート', 'ロング', 'ロングツインテール'],
  'お団子ショート': ['お団子ロング', 'ショート', 'ショートツインテール'],
  'ロングツインテール': ['ロング', 'お団子ロング', '三つ編み'],
  'ショートツインテール': ['ショート', 'お団子ショート'],
  '三つ編み': ['ロング', 'お団子ロング', 'ロングツインテール'],
  'ポニーテール': ['ミドル', 'ロングツインテール', 'お団子ロング', 'ショート'],
}

function getSimilarHairColors(hairColor: string): string[] {
  return SIMILAR_HAIR_COLOR_GROUPS[hairColor] ?? []
}

function getSimilarHairStyles(hairStyle: string): string[] {
  return SIMILAR_HAIR_STYLE_GROUPS[hairStyle] ?? []
}

/**
 * 類似したタレントを優先して3人のディストラクター（不正解選択肢）を選出する。
 *
 * ★★☆: 髪色優先（同じ髪色 > 似た髪色 > 同じ髪型 > 似た髪型 > その他）
 * ★★★: 髪型優先（同じ髪型 > 似た髪型 > 同じ髪色 > 似た髪色 > その他）
 */
export function selectSimilarDistractors(
  target: Talent,
  pool: Talent[],
  count: number,
  priority: 'color' | 'style' = 'color',
): Talent[] {
  const others = pool.filter((t) => t.id !== target.id)

  const similarColors = getSimilarHairColors(target.hairColor)
  const similarStyles = getSimilarHairStyles(target.hairStyle)

  const sameColor = shuffleArray(others.filter((t) => t.hairColor === target.hairColor))
  const simColor = shuffleArray(others.filter((t) => similarColors.includes(t.hairColor)))
  const sameStyle = shuffleArray(others.filter((t) => t.hairStyle === target.hairStyle))
  const simStyle = shuffleArray(others.filter((t) => similarStyles.includes(t.hairStyle)))
  const remaining = shuffleArray(
    others.filter(
      (t) =>
        t.hairColor !== target.hairColor &&
        !similarColors.includes(t.hairColor) &&
        t.hairStyle !== target.hairStyle &&
        !similarStyles.includes(t.hairStyle),
    ),
  )

  // 優先順位に従って候補を連結
  const candidates = priority === 'style'
    ? [...sameStyle, ...simStyle, ...sameColor, ...simColor, ...remaining]
    : [...sameColor, ...simColor, ...sameStyle, ...simStyle, ...remaining]

  // 重複を排除しながら必要数を選出
  const selected: Talent[] = []
  for (const candidate of candidates) {
    if (selected.length >= count) break
    if (!selected.some((t) => t.id === candidate.id)) {
      selected.push(candidate)
    }
  }

  return selected
}
