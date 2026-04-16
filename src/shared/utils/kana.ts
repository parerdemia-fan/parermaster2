/** 名前が全てカタカナ・中黒・スペースのみ、または全てひらがなのみなら読み仮名不要 */
export function needsReading(name: string): boolean {
  if (/^[ァ-ヴー・\s]+$/.test(name)) return false
  if (/^[ぁ-ゔー\s]+$/.test(name)) return false
  return true
}

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
