import { describe, it, expect } from 'vitest'
import { excludeHiddenTalents } from '../useTalents.ts'
import type { Talent } from '../../types/talent.ts'

function makeTalent(id: string, hidden: boolean): Talent {
  return { id, hidden, generation: 1, dormitory: 'wh', name: id } as Talent
}

describe('excludeHiddenTalents', () => {
  const talents = [makeTalent('visible', false), makeTalent('hidden', true)]

  it('既定では hidden なタレントを除外する', () => {
    expect(excludeHiddenTalents(talents, false).map((t) => t.id)).toEqual(['visible'])
  })

  it('includeHidden=true なら hidden なタレントも含める', () => {
    expect(excludeHiddenTalents(talents, true).map((t) => t.id)).toEqual(['visible', 'hidden'])
  })

  it('hidden 列が未同期で値が無いタレントは表示する', () => {
    const legacy = [{ id: 'legacy', generation: 1, dormitory: 'wh', name: 'legacy' } as Talent]
    expect(excludeHiddenTalents(legacy, false).map((t) => t.id)).toEqual(['legacy'])
  })
})
