import type { BadgeRank } from './types.ts'

const BASE = import.meta.env.BASE_URL

/** バッジカテゴリ × ランク → 画像パス */
export const BADGE_IMAGES: Record<string, Record<BadgeRank, string>> = {
  clear: {
    bronze: `${BASE}data/images/ui/clear1.png`,
    silver: `${BASE}data/images/ui/clear2.png`,
    gold: `${BASE}data/images/ui/clear3.png`,
  },
  knowledge: {
    bronze: `${BASE}data/images/ui/chishiki1.png`,
    silver: `${BASE}data/images/ui/chishiki2.png`,
    gold: `${BASE}data/images/ui/chishiki3.png`,
  },
}

/** 称号 → トロフィー画像パス */
export const TROPHY_IMAGES = {
  gen2: `${BASE}data/images/ui/trophy_2nd.png`,
  gen1: `${BASE}data/images/ui/trophy_1st.png`,
  master: `${BASE}data/images/ui/trophy_master.png`,
  grandmaster: `${BASE}data/images/ui/trophy_grandmaster.png`,
}
