import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { SEASON_THEMES } from '../season.ts'

const PUBLIC_DIR = resolve(__dirname, '../../../../public')

/** BASE_URL 付きのアセットパスを public/ 配下のファイルパスに変換する */
function toPublicPath(url: string): string {
  return resolve(PUBLIC_DIR, url.slice(import.meta.env.BASE_URL.length))
}

describe('SEASON_THEMES', () => {
  for (const [season, theme] of Object.entries(SEASON_THEMES)) {
    it(`${season}: 背景・ロゴの画像が存在する`, () => {
      expect(existsSync(toPublicPath(theme.titleBg))).toBe(true)
      expect(existsSync(toPublicPath(theme.titleLogo))).toBe(true)
    })
  }
})
