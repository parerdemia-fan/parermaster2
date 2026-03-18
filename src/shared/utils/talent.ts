import type { Talent } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL

export function getTalentImagePath(talent: Talent): string {
  if (talent.generation === 2) {
    return `${BASE}data/images/face/${talent.id}.png`
  }
  return `${BASE}data/images/kv/sq/${talent.id}.png`
}
