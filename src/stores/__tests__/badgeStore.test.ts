import { describe, it, expect } from 'vitest'
import { isAreaComplete } from '../badgeStore.ts'
import { GEN1_SLOT_IDS, GEN2_SLOT_IDS } from '../../features/achievement/constants.ts'

describe('isAreaComplete（称号・解放判定: 全スロット最大レベル=ゴールド）', () => {
  it('2期生エリアが全てゴールドなら成立', () => {
    expect(isAreaComplete({ gen2_all: 'gold', gen2_knowledge: 'gold' }, GEN2_SLOT_IDS)).toBe(true)
  })

  it('2期生知識がシルバー止まりなら成立しない（救済なし: むずかしいで取り直す）', () => {
    expect(isAreaComplete({ gen2_all: 'gold', gen2_knowledge: 'silver' }, GEN2_SLOT_IDS)).toBe(false)
  })

  it('1期生エリアが全てゴールドなら成立', () => {
    expect(isAreaComplete({ gen1_all: 'gold', gen1_knowledge: 'gold' }, GEN1_SLOT_IDS)).toBe(true)
  })

  it('スロット未獲得が残っていれば成立しない', () => {
    expect(isAreaComplete({ gen2_all: 'gold' }, GEN2_SLOT_IDS)).toBe(false)
  })
})
