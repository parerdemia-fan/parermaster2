export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 重み付きシャッフル。重みが大きい要素ほど前方に来やすい。
 * アルゴリズム: 各要素に weight * random() のスコアを付けて降順ソート。
 */
export function weightedShuffle<T>(
  arr: T[],
  getWeight: (item: T) => number,
): T[] {
  return [...arr]
    .map((item) => ({ item, score: getWeight(item) * Math.random() }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}
