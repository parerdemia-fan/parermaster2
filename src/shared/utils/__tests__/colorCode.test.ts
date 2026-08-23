import { describe, it, expect } from 'vitest'
import { parseColorCode } from '../colorCode.ts'

describe('parseColorCode', () => {
  it('6桁のカラーコードを小文字で返す', () => {
    expect(parseColorCode('#808bf8')).toBe('#808bf8')
    expect(parseColorCode('#B180F8')).toBe('#b180f8')
  })

  it('3桁のカラーコードも受け付ける', () => {
    expect(parseColorCode('#0af')).toBe('#0af')
  })

  it('前後の空白を許容する', () => {
    expect(parseColorCode(' #505ff5 ')).toBe('#505ff5')
  })

  it('カラーコード以外は null', () => {
    expect(parseColorCode('雛菊のん')).toBeNull()
    expect(parseColorCode('')).toBeNull()
    expect(parseColorCode('#12345')).toBeNull()
    expect(parseColorCode('#gggggg')).toBeNull()
    expect(parseColorCode('青 #808bf8')).toBeNull()
    expect(parseColorCode('808bf8')).toBeNull()
  })
})
