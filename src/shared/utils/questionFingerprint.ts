/**
 * 問題文＋正解からstableなキーを生成する。
 * questions.json の id はスプレッドシート行番号由来で不安定なため、
 * 内容ベースのフィンガープリントで正解履歴を追跡する。
 */
export function questionFingerprint(
  question: string,
  correctAnswer: string,
): string {
  const input = `${question}\0${correctAnswer}`
  // FNV-1a 32-bit hash
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
