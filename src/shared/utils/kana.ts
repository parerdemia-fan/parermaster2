/**
 * カタカナをひらがなに変換し、点(・)や記号(＝)を除去する
 */
export function kanaToHiragana(kana: string): string {
  return [...kana]
    .map((c) => {
      const code = c.charCodeAt(0)
      if (code >= 0x30A1 && code <= 0x30F6) return String.fromCharCode(code - 0x60)
      if (code === 0x30F4) return String.fromCharCode(0x3094)
      return c
    })
    .filter((c) => c !== '・' && c !== '＝')
    .join('')
}
