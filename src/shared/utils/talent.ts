import type { Talent } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL

/** 正方形サムネイル画像パス（1期生: kv/sq、2期生: live2d/sq） */
export function getTalentImagePath(talent: Talent): string {
  if (talent.generation === 2) {
    return `${BASE}data/images/live2d/sq/${talent.id}.png`
  }
  return `${BASE}data/images/kv/sq/${talent.id}.png`
}

/** 立ち絵（原寸）画像パス（1期生: kv/orig、2期生: live2d/orig） */
export function getTalentStandingPath(talent: Talent): string {
  if (talent.generation === 2) {
    return `${BASE}data/images/live2d/orig/${talent.id}.png`
  }
  return `${BASE}data/images/kv/orig/${talent.id}.png`
}
