import { describe, it, expect, beforeEach, vi } from 'vitest'
import { deriveAchievements, migrateAchievements } from '../badgeStore.ts'

const MIGRATION_KEY = 'parermaster2_achievements_migrated'

function makeLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
  }
}

describe('deriveAchievements（achieved-once 称号フラグ）', () => {
  it('全スロット最大なら gen2Master が立つ', () => {
    const result = deriveAchievements({ gen2_all: 'gold', gen2_knowledge: 'gold' }, {})
    expect(result.gen2Master).toBe(true)
  })

  it('知識がシルバー（最大未満）なら現在のバッジだけでは gen2Master は立たない', () => {
    const result = deriveAchievements({ gen2_all: 'gold', gen2_knowledge: 'silver' }, {})
    expect(result.gen2Master).toBe(false)
  })

  it('一度成立した称号はバッジが最大未満でも維持される（剥奪防止）', () => {
    const result = deriveAchievements({ gen2_all: 'gold', gen2_knowledge: 'silver' }, { gen2Master: true })
    expect(result.gen2Master).toBe(true)
  })
})

describe('migrateAchievements（むずかしい解放に伴う既存到達者の救済）', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
  })

  it('旧2期生マスター（全員ゴールド＋知識シルバー）の称号フラグを立てる', () => {
    const result = migrateAchievements({ gen2_all: 'gold', gen2_knowledge: 'silver' }, {})
    expect(result.gen2Master).toBe(true)
    expect(localStorage.getItem(MIGRATION_KEY)).toBe('1')
  })

  it('バッジ値は一切書き換えない（シルバーのまま）', () => {
    const badges = { gen2_all: 'gold', gen2_knowledge: 'silver' } as const
    migrateAchievements(badges, {})
    expect(badges.gen2_knowledge).toBe('silver')
  })

  it('全員ゴールド未達なら gen2Master は立たない', () => {
    const result = migrateAchievements({ gen2_all: 'silver', gen2_knowledge: 'silver' }, {})
    expect(result.gen2Master).toBeFalsy()
  })

  it('既にマイグレーション済みなら何もしない（新規プレイヤーに影響しない）', () => {
    localStorage.setItem(MIGRATION_KEY, '1')
    const result = migrateAchievements({ gen2_all: 'gold', gen2_knowledge: 'silver' }, {})
    expect(result.gen2Master).toBeUndefined()
  })
})
