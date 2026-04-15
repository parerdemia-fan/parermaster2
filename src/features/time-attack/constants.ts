import type { Difficulty } from '../../stores/settingsStore.ts'

export interface TimeAttackSection {
  typeId: string
  /** 顔名前系の設定難易度（1/2/3）。text-quiz では使わない */
  difficulty: Difficulty
  /** text-quiz の difficulty レベル（questions.json の difficulty 値） */
  level?: number
  count: number
  displayStars: number
}

/** タイムアタック 全100問の出題構成（18セクション） */
export const TIME_ATTACK_SECTIONS: readonly TimeAttackSection[] = [
  { typeId: 'face-guess',  difficulty: 1, count: 6, displayStars: 1 },
  { typeId: 'name-guess',  difficulty: 1, count: 6, displayStars: 1.5 },
  { typeId: 'text-quiz',   difficulty: 1, level: 2, count: 5, displayStars: 2 },
  { typeId: 'name-build',  difficulty: 1, count: 6, displayStars: 2 },
  { typeId: 'blur',        difficulty: 3, count: 6, displayStars: 2.5 },
  { typeId: 'text-quiz',   difficulty: 1, level: 3, count: 5, displayStars: 3 },
  { typeId: 'face-guess',  difficulty: 2, count: 6, displayStars: 3 },
  { typeId: 'name-guess',  difficulty: 2, count: 6, displayStars: 3.5 },
  { typeId: 'text-quiz',   difficulty: 2, level: 4, count: 5, displayStars: 4 },
  { typeId: 'name-build',  difficulty: 2, count: 6, displayStars: 4 },
  { typeId: 'spotlight',   difficulty: 3, count: 6, displayStars: 4.5 },
  { typeId: 'text-quiz',   difficulty: 2, level: 5, count: 5, displayStars: 5 },
  { typeId: 'face-guess',  difficulty: 3, count: 6, displayStars: 5 },
  { typeId: 'name-guess',  difficulty: 3, count: 6, displayStars: 5.5 },
  { typeId: 'text-quiz',   difficulty: 3, level: 6, count: 5, displayStars: 6 },
  { typeId: 'name-build',  difficulty: 3, count: 6, displayStars: 6 },
  { typeId: 'word-search', difficulty: 3, count: 4, displayStars: 6.5 },
  { typeId: 'text-quiz',   difficulty: 3, level: 7, count: 5, displayStars: 7 },
]

/** タイムに応じたX共有メッセージ */
export function getTimeMessage(elapsedMs: number): string {
  const minutes = elapsedMs / 60000
  if (minutes < 5) return '驚異的なタイム！パレ学の神！'
  if (minutes < 7) return 'すごい！パレ学マスターの実力！'
  if (minutes < 9) return '素晴らしい！かなりの腕前！'
  if (minutes < 11) return 'いい感じ！まだまだ伸びしろあり！'
  if (minutes < 13) return 'クリアおめでとう！'
  return '完走おめでとう！次はもっと速く！'
}

/** ミリ秒を MM:SS.s 形式にフォーマット */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 100) / 10
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`
}
