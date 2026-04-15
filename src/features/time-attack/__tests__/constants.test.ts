import { describe, it, expect } from 'vitest'
import { formatTime, getTimeMessage, TIME_ATTACK_SECTIONS } from '../constants.ts'

describe('formatTime', () => {
  it('0msを00:00.0にフォーマットする', () => {
    expect(formatTime(0)).toBe('00:00.0')
  })

  it('1分30.5秒をフォーマットする', () => {
    expect(formatTime(90500)).toBe('01:30.5')
  })

  it('10分0秒をフォーマットする', () => {
    expect(formatTime(600000)).toBe('10:00.0')
  })

  it('59分59.9秒をフォーマットする', () => {
    expect(formatTime(3599900)).toBe('59:59.9')
  })
})

describe('getTimeMessage', () => {
  it('5分未満で最高メッセージ', () => {
    expect(getTimeMessage(4 * 60000)).toContain('神')
  })

  it('5〜7分', () => {
    expect(getTimeMessage(6 * 60000)).toContain('マスター')
  })

  it('7〜9分', () => {
    expect(getTimeMessage(8 * 60000)).toContain('腕前')
  })

  it('9〜11分', () => {
    expect(getTimeMessage(10 * 60000)).toContain('伸びしろ')
  })

  it('11〜13分', () => {
    expect(getTimeMessage(12 * 60000)).toContain('おめでとう')
  })

  it('13分以上', () => {
    expect(getTimeMessage(15 * 60000)).toContain('完走')
  })
})

describe('TIME_ATTACK_SECTIONS', () => {
  it('合計100問', () => {
    const total = TIME_ATTACK_SECTIONS.reduce((sum, s) => sum + s.count, 0)
    expect(total).toBe(100)
  })

  it('18セクション', () => {
    expect(TIME_ATTACK_SECTIONS).toHaveLength(18)
  })

  it('displayStarsが昇順', () => {
    for (let i = 1; i < TIME_ATTACK_SECTIONS.length; i++) {
      expect(TIME_ATTACK_SECTIONS[i].displayStars).toBeGreaterThanOrEqual(
        TIME_ATTACK_SECTIONS[i - 1].displayStars,
      )
    }
  })
})
