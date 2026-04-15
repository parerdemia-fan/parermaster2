/**
 * public/sw.js からバージョン情報を抽出
 */
export async function getVersion(): Promise<string> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}sw.js`)
    if (!response.ok) return 'dev'
    const content = await response.text()
    const match = content.match(/CACHE_NAME\s*=\s*['"](v[\d]+)['"]/)
    if (match?.[1]) return match[1]
  } catch {
    // sw.js が存在しない場合
  }
  return 'dev'
}
