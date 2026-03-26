import { describe, it, expect } from 'vitest'
import { judgeBadge, type JudgeInput } from '../judge.ts'

const ALL_TYPES = ['face-guess', 'name-guess', 'name-build']

function makeInput(overrides: Partial<JudgeInput> = {}): JudgeInput {
  return {
    gameMode: 'face-name',
    modeCategory: 'gen2',
    scope: 'all',
    difficulty: 1,
    correctCount: 10,
    totalCount: 10,
    enabledTypes: ALL_TYPES,
    ...overrides,
  }
}

describe('judgeBadge', () => {
  describe('顔名前当て（世代別）', () => {
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

    it('1期生全員 → gen1_all', () => {
      const result = judgeBadge(makeInput({ modeCategory: 'gen1', scope: 'all' }))
      expect(result.slotId).toBe('gen1_all')
    })
  })

  describe('顔名前当て（寮別）', () => {
    it('寮別・バゥ寮 → dorm_wa', () => {
      const result = judgeBadge(makeInput({ modeCategory: 'dorm', scope: 'wa' }))
      expect(result.eligible).toBe(true)
      expect(result.slotId).toBe('dorm_wa')
      expect(result.rank).toBe('bronze')
    })

    it('寮別・ミュゥ寮・難易度3 → dorm_me ゴールド', () => {
      const result = judgeBadge(makeInput({ modeCategory: 'dorm', scope: 'me', difficulty: 3 }))
      expect(result.slotId).toBe('dorm_me')
      expect(result.rank).toBe('gold')
    })
  })

  describe('知識クイズ', () => {
    it('1期生・全問正解 → gen1_knowledge + 難易度ランク', () => {
      const result = judgeBadge(
        makeInput({
          gameMode: 'knowledge',
          modeCategory: 'gen1',
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
          modeCategory: 'gen2',
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
          modeCategory: 'gen1',
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
          modeCategory: 'gen1',
          correctCount: 29,
          totalCount: 30,
        }),
      )
      expect(result.eligible).toBe(false)
    })
  })
})
