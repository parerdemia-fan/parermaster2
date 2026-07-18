import type { Talent } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL

/** live2d画像（バストアップ）で表示するタレントか（KV未提供の冬星れんこんのみ。KV公開後に削除予定） */
export function usesLive2dImages(talent: Talent): boolean {
  return talent.id === '26WA003'
}

/**
 * 立ち絵の表示バリアント。画像の寸法・画像内の上余白が異なるため、
 * 談話室等の表示ベース（kvScaleStyle.ts）はこの単位で切り替える。
 * - kv1: 1期生KV（833×1500、上余白 約10%）
 * - kv2: 2期生KV（1200×1586〜1963、上余白 約1%）
 * - live2d: KV未提供タレントの代替（800×1143前後、バストアップ）
 */
export type StandingImageVariant = 'kv1' | 'kv2' | 'live2d'

export function getStandingImageVariant(talent: Talent): StandingImageVariant {
  if (usesLive2dImages(talent)) return 'live2d'
  return talent.generation === 2 ? 'kv2' : 'kv1'
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
