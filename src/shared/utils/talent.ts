import type { Talent } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL

/** live2d画像（バストアップ）で表示するタレントか（KV未提供の冬星れんこんのみ。KV公開後に削除予定） */
export function usesLive2dImages(talent: Talent): boolean {
  return talent.id === '26WA003'
}

/** 正方形サムネイル画像パス（KVから切り出したsq。KV未提供タレントのみlive2d/sq） */
export function getTalentImagePath(talent: Talent): string {
  if (usesLive2dImages(talent)) {
    return `${BASE}data/images/live2d/sq/${talent.id}.png`
  }
  return `${BASE}data/images/kv/sq/${talent.id}.png`
}

/** 立ち絵（原寸）画像パス（1期生: kv/orig/*.png、2期生: kv/orig/*.webp、KV未提供タレントのみlive2d/orig/*.webp） */
export function getTalentStandingPath(talent: Talent): string {
  if (usesLive2dImages(talent)) {
    return `${BASE}data/images/live2d/orig/${talent.id}.webp`
  }
  const ext = talent.generation === 2 ? 'webp' : 'png'
  return `${BASE}data/images/kv/orig/${talent.id}.${ext}`
}

/** タレントの表示名を返す（ニックネームがあればランダムに1つ、なければフルネーム） */
export function pickTalentDisplayName(talent: Talent): string {
  const { nicknames } = talent
  if (nicknames.length === 0) return talent.name
  return nicknames[Math.floor(Math.random() * nicknames.length)]
}
