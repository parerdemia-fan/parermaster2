import type { PuzzleData, PuzzleWord, Placements, CellPosition } from './types.ts'

export { kanaToHiragana } from '../../shared/utils/kana.ts'

/**
 * ワードがグリッド上で占めるセル座標一覧を返す
 */
export function getWordCells(word: PuzzleWord): CellPosition[] {
  const cells: CellPosition[] = []
  for (let i = 0; i < word.length; i++) {
    cells.push({
      row: word.startRow + (word.direction === 'down' ? i : 0),
      col: word.startCol + (word.direction === 'across' ? i : 0),
    })
  }
  return cells
}

/**
 * 現在のプレイヤー入力に基づくグリッドを構築する
 * 配置されたワードの文字をグリッドに書き込む
 */
export function buildUserGrid(
  puzzle: PuzzleData,
  placements: Placements,
): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: puzzle.rows }, () =>
    Array(puzzle.cols).fill(null),
  )

  for (const word of puzzle.words) {
    const placedTalentId = placements[word.wordId]
    // 初期開示ワード or プレイヤーが配置済み
    const isRevealed = puzzle.initialRevealedWordIds.includes(word.wordId)
    if (!isRevealed && !placedTalentId) continue

    // 配置されたタレントのひらがな名を使う（初期開示は正解データを使う）
    const hiragana = isRevealed ? word.hiragana : findHiraganaByPlacement(puzzle, placedTalentId)
    if (!hiragana) continue

    const cells = getWordCells(word)
    for (let i = 0; i < cells.length && i < hiragana.length; i++) {
      const { row, col } = cells[i]
      if (row >= 0 && row < puzzle.rows && col >= 0 && col < puzzle.cols) {
        grid[row][col] = hiragana[i]
      }
    }
  }

  return grid
}

/**
 * 配置されたタレントIDからひらがな名を検索する
 * プレイヤーが間違ったタレントを配置した場合でも、そのタレントの名前を返す
 */
function findHiraganaByPlacement(
  puzzle: PuzzleData,
  talentId: string,
): string | null {
  const matchingWord = puzzle.words.find((w) => w.talentId === talentId)
  return matchingWord?.hiragana ?? null
}

/**
 * 交差点（2つのワードが同じセルを共有する箇所）で文字が矛盾しているセルを検出する
 */
export function findConflicts(
  puzzle: PuzzleData,
  placements: Placements,
): Set<string> {
  const conflicts = new Set<string>()
  // セルごとに書き込まれた文字を収集
  const cellChars = new Map<string, string[]>()

  for (const word of puzzle.words) {
    const placedTalentId = placements[word.wordId]
    const isRevealed = puzzle.initialRevealedWordIds.includes(word.wordId)
    if (!isRevealed && !placedTalentId) continue

    const hiragana = isRevealed
      ? word.hiragana
      : findHiraganaByPlacement(puzzle, placedTalentId)
    if (!hiragana) continue

    const cells = getWordCells(word)
    for (let i = 0; i < cells.length && i < hiragana.length; i++) {
      const key = `${cells[i].row},${cells[i].col}`
      const existing = cellChars.get(key)
      if (existing) {
        existing.push(hiragana[i])
      } else {
        cellChars.set(key, [hiragana[i]])
      }
    }
  }

  for (const [key, chars] of cellChars) {
    if (chars.length > 1 && new Set(chars).size > 1) {
      conflicts.add(key)
    }
  }

  return conflicts
}

/**
 * 隠しメッセージの現在の進捗を返す
 */
export function getMessageProgress(
  puzzle: PuzzleData,
  placements: Placements,
): { chars: (string | null)[]; complete: boolean } {
  // フルグリッドを構築せず、番号付きセルだけを直接検索する
  const cellToChar = new Map<string, string>()
  for (const word of puzzle.words) {
    const placedTalentId = placements[word.wordId]
    const isRevealed = puzzle.initialRevealedWordIds.includes(word.wordId)
    if (!isRevealed && !placedTalentId) continue
    const hiragana = isRevealed ? word.hiragana : findHiraganaByPlacement(puzzle, placedTalentId)
    if (!hiragana) continue
    const cells = getWordCells(word)
    for (let i = 0; i < cells.length && i < hiragana.length; i++) {
      cellToChar.set(`${cells[i].row},${cells[i].col}`, hiragana[i])
    }
  }

  const chars = [...puzzle.numberedCells]
    .sort((a, b) => a.order - b.order)
    .map((cell) => cellToChar.get(`${cell.row},${cell.col}`) ?? null)

  const actualMessage = chars.filter((c) => c !== null).join('')
  const complete = actualMessage === puzzle.hiddenMessage

  return { chars, complete }
}

/**
 * 全ワードが正しく配置されているか判定する
 */
export function isPuzzleComplete(
  puzzle: PuzzleData,
  placements: Placements,
): boolean {
  for (const word of puzzle.words) {
    if (puzzle.initialRevealedWordIds.includes(word.wordId)) continue
    const placedTalentId = placements[word.wordId]
    if (!placedTalentId) return false
    if (placedTalentId !== word.talentId) return false
  }
  return true
}

/**
 * ワードの文字数からフィルタされたタレントIDリストを返す
 * (puzzleData.wordsから同じ文字数のタレントIDを抽出)
 */
export function getMatchingTalentIds(
  puzzle: PuzzleData,
  targetLength: number,
): string[] {
  return puzzle.words
    .filter((w) => w.talentId !== null && w.length === targetLength)
    .map((w) => w.talentId as string)
}
