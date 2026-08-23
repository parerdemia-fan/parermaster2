/** カラーコード（#rgb / #rrggbb）の書式 */
const COLOR_CODE_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/**
 * 選択肢テキストがカラーコードならその値（小文字に正規化）を返す。
 * カラーコードでなければ null
 */
export function parseColorCode(text: string): string | null {
  const trimmed = text.trim()
  return COLOR_CODE_PATTERN.test(trimmed) ? trimmed.toLowerCase() : null
}
