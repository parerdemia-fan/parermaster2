import { describe, it, expect } from 'vitest'
import { judgeBadge, type JudgeInput } from '../judge.ts'

const ALL_TYPES = ['face-guess', 'name-guess', 'name-build']

function makeInput(overrides: Partial<JudgeInput> = {}): JudgeInput {
  return {
    gameMode: 'face-name',
    generation: 'gen2',
    scope: 'all',
    difficulty: 1,
    correctCount: 10,
    totalCount: 10,
    enabledTypes: ALL_TYPES,
    ...overrides,
  }
}

describe('judgeBadge', () => {
  describe('顔名前当て', () => {
    it('全問正解 + 全タイプON → バッジ獲得', () => {
      const result = judgeBadge(makeInput())
      expect(result.eligible).toBe(true)
      expect(result.slotId).toBe('gen2_all')
      expect(result.rank).toBe('bronze')
    })

    it('全問正解でない → 対象外', () => {
      const result = judgeBadge(makeInput({ correctCount: 9 }))
      expect(result.eligible).toBe(false)
      expect(result.slotId).toBeNull()
    })

    it('0問出題 → 対象外', () => {
      const result = judgeBadge(makeInput({ correctCount: 0, totalCount: 0 }))
      expect(result.eligible).toBe(false)
    })

    it('全タイプONでない → 対象外', () => {
      const result = judgeBadge(makeInput({ enabledTypes: ['face-guess', 'name-guess'] }))
      expect(result.eligible).toBe(false)
      expect(result.reason).toContain('全問題タイプ')
    })

    it('難易度2 → シルバー', () => {
      const result = judgeBadge(makeInput({ difficulty: 2 }))
      expect(result.rank).toBe('silver')
    })

    it('難易度3 → ゴールド', () => {
      const result = judgeBadge(makeInput({ difficulty: 3 }))
      expect(result.rank).toBe('gold')
    })

    it('1期生・バゥ寮 → gen1_wa', () => {
      const result = judgeBadge(makeInput({ generation: 'gen1', scope: 'wa' }))
      expect(result.slotId).toBe('gen1_wa')
    })

    it('2期生・ミュゥ寮 → gen2_me', () => {
      const result = judgeBadge(makeInput({ scope: 'me' }))
      expect(result.slotId).toBe('gen2_me')
    })
  })

  describe('知識クイズ', () => {
    it('1期生・全問正解 → gen1_knowledge + 難易度ランク', () => {
      const result = judgeBadge(
        makeInput({
          gameMode: 'knowledge',
          generation: 'gen1',
          difficulty: 2,
          correctCount: 30,
          totalCount: 30,
        }),
      )
      expect(result.eligible).toBe(true)
      expect(result.slotId).toBe('gen1_knowledge')
      expect(result.rank).toBe('silver')
    })

    it('2期生知識クイズ → 常にブロンズ', () => {
      const result = judgeBadge(
        makeInput({
          gameMode: 'knowledge',
          generation: 'gen2',
          difficulty: 1,
          correctCount: 15,
          totalCount: 15,
        }),
      )
      expect(result.eligible).toBe(true)
      expect(result.slotId).toBe('gen2_knowledge')
      expect(result.rank).toBe('bronze')
    })

    it('知識クイズ → enabledTypes は判定に影響しない', () => {
      const result = judgeBadge(
        makeInput({
          gameMode: 'knowledge',
          generation: 'gen1',
          correctCount: 30,
          totalCount: 30,
          enabledTypes: [],
        }),
      )
      expect(result.eligible).toBe(true)
    })

    it('知識クイズ・不正解あり → 対象外', () => {
      const result = judgeBadge(
        makeInput({
          gameMode: 'knowledge',
          generation: 'gen1',
          correctCount: 29,
          totalCount: 30,
        }),
      )
      expect(result.eligible).toBe(false)
    })
  })
})
