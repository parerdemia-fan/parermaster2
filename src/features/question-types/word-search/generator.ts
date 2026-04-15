import type { Difficulty } from '../../../stores/settingsStore.ts'
import type { Talent } from '../../../shared/types/talent.ts'
import { shuffleArray } from '../../../shared/utils/array.ts'
import type { WordSearchQuestion } from './types.ts'

const COLS = 30
const ROWS = 15

/**
 * 名前はどこ？問題を生成する
 * 文字グリッドの中から指定タレントの名前を見つけてクリック
 */
export function generateWordSearchQuestions(
  targetTalents: Talent[],
  pool: Talent[],
  _difficulty: Difficulty,
): WordSearchQuestion[] {
  const shuffledTargets = shuffleArray(targetTalents)

  // フィラー用の文字プール（タレント名の文字を集める）
  const fillerChars = collectFillerChars(pool)

  return shuffledTargets.map((talent) => {
    const name = talent.name
    const grid = createEmptyGrid()
    const answerCells = placeName(grid, name)

    // 他のタレント名もいくつか配置（紛らわしくする）
    const distractors = shuffleArray(pool.filter((t) => t.id !== talent.id)).slice(0, 8)
    for (const d of distractors) {
      tryPlaceName(grid, d.name)
    }

    // 残りのセルをフィラー文字で埋める
    fillEmpty(grid, fillerChars)

    return {
      typeId: 'word-search',
      difficulty: 3,
      talentId: talent.id,
      talentName: talent.name,
      grid,
      answerCells,
    }
  })
}

/** 空グリッドを作成 */
function createEmptyGrid(): string[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ''))
}

/** タレント名の文字を集めてフィラー用プールを作る */
function collectFillerChars(pool: Talent[]): string[] {
  const chars = new Set<string>()
  for (const t of pool) {
    for (const c of t.name) chars.add(c)
    for (const c of t.familyName) chars.add(c)
    for (const c of t.givenName) chars.add(c)
  }
  return [...chars]
}

/** 名前をグリッドに配置し、配置したセル座標を返す（必ず成功） */
function placeName(grid: string[][], name: string): { row: number; col: number }[] {
  // 最大100回試行
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = tryPlaceName(grid, name)
    if (result) return result
  }
  // フォールバック: 左上に強制配置
  const cells: { row: number; col: number }[] = []
  for (let i = 0; i < name.length; i++) {
    grid[0][i] = name[i]
    cells.push({ row: 0, col: i })
  }
  return cells
}

/** 長音記号を含むか（縦書き不向き） */
function containsLongVowel(name: string): boolean {
  return name.includes('ー')
}

/** 名前をグリッドのランダム位置に配置を試みる。成功時はセル座標配列、失敗時はnull */
function tryPlaceName(grid: string[][], name: string): { row: number; col: number }[] | null {
  const horizontal = containsLongVowel(name) ? true : Math.random() < 0.5
  const len = name.length

  if (horizontal) {
    if (len > COLS) return null
    const row = Math.floor(Math.random() * ROWS)
    const col = Math.floor(Math.random() * (COLS - len + 1))
    // 配置可能か確認（空またはすでに同じ文字）
    for (let i = 0; i < len; i++) {
      const existing = grid[row][col + i]
      if (existing !== '' && existing !== name[i]) return null
    }
    const cells: { row: number; col: number }[] = []
    for (let i = 0; i < len; i++) {
      grid[row][col + i] = name[i]
      cells.push({ row, col: col + i })
    }
    return cells
  } else {
    if (len > ROWS) return null
    const row = Math.floor(Math.random() * (ROWS - len + 1))
    const col = Math.floor(Math.random() * COLS)
    for (let i = 0; i < len; i++) {
      const existing = grid[row + i][col]
      if (existing !== '' && existing !== name[i]) return null
    }
    const cells: { row: number; col: number }[] = []
    for (let i = 0; i < len; i++) {
      grid[row + i][col] = name[i]
      cells.push({ row: row + i, col })
    }
    return cells
  }
}

/** 空セルをフィラー文字で埋める */
function fillEmpty(grid: string[][], fillerChars: string[]): void {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = fillerChars[Math.floor(Math.random() * fillerChars.length)]
      }
    }
  }
}
