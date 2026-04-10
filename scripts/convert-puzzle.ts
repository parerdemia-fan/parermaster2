#!/usr/bin/env tsx

/**
 * スケルトンパズル変換スクリプト
 *
 * 問題テキストファイルと答えテキストファイルからパズルJSONを生成する。
 *
 * 使い方:
 *   npx tsx scripts/convert-puzzle.ts <variant> <問題.txt> <答え.txt>
 *
 * 例:
 *   npx tsx scripts/convert-puzzle.ts gen2 puzzle-gen2-problem.txt puzzle-gen2-answer.txt
 *
 * テキストファイルの書式:
 *   - ■ = 黒マス
 *   - 　（全角スペース）= 空白セル（プレイヤーが埋める）
 *   - ①②③... = 番号付きセル（隠しメッセージ用、問題テキストのみ）
 *   - ひらがな文字 = 初期開示文字（問題テキスト）/ 正解文字（答えテキスト）
 *
 * 出力: public/data/puzzles/{variant}.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import { kanaToHiragana } from '../src/shared/utils/kana.ts'

// ---------- 型定義 ----------

interface TalentData {
  id: string
  generation: number
  kana: string
  name: string
}

/** 丸数字（①〜⑳）を数値に変換。該当しなければ null */
function circledNumberToInt(ch: string): number | null {
  const code = ch.charCodeAt(0)
  // ① (U+2460) 〜 ⑳ (U+2473)
  if (code >= 0x2460 && code <= 0x2473) return code - 0x2460 + 1
  // ㉑ (U+3251) 〜 ㉟ (U+325F)
  if (code >= 0x3251 && code <= 0x325F) return code - 0x3251 + 21
  // ㊱ (U+32B1) 〜 ㊿ (U+32BF)
  if (code >= 0x32B1 && code <= 0x32BF) return code - 0x32B1 + 36
  return null
}

/** テキストファイルを1文字ずつのグリッドに変換 */
function parseTextGrid(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => [...line])
}

/** セルが黒マスか判定 */
function isBlack(ch: string): boolean {
  return ch === '■'
}

/** セルが空白（プレイヤーが埋める）か判定 */
function isEmpty(ch: string): boolean {
  return ch === '　' || ch === ' '
}

/** セルが番号付きか判定 */
function isNumbered(ch: string): boolean {
  return circledNumberToInt(ch) !== null
}

/** セルがひらがな文字か判定（初期開示 or 正解文字） */
function isHiragana(ch: string): boolean {
  return !isBlack(ch) && !isEmpty(ch) && !isNumbered(ch)
}

// ---------- ワード抽出 ----------

interface ExtractedWord {
  hiragana: string
  startRow: number
  startCol: number
  direction: 'across' | 'down'
  length: number
}

/** 答えグリッドからワード（横・縦の連続文字列）を抽出 */
function extractWords(answerGrid: string[][]): ExtractedWord[] {
  const words: ExtractedWord[] = []
  const rows = answerGrid.length
  const cols = answerGrid[0]?.length ?? 0

  // 横方向
  for (let r = 0; r < rows; r++) {
    let startCol = -1
    let chars = ''
    for (let c = 0; c <= cols; c++) {
      const ch = c < cols ? answerGrid[r][c] : '■'
      if (!isBlack(ch)) {
        if (startCol < 0) startCol = c
        chars += ch
      } else {
        if (chars.length >= 2) {
          words.push({
            hiragana: chars,
            startRow: r,
            startCol,
            direction: 'across',
            length: chars.length,
          })
        }
        startCol = -1
        chars = ''
      }
    }
  }

  // 縦方向
  for (let c = 0; c < cols; c++) {
    let startRow = -1
    let chars = ''
    for (let r = 0; r <= rows; r++) {
      const ch = r < rows ? answerGrid[r][c] : '■'
      if (!isBlack(ch)) {
        if (startRow < 0) startRow = r
        chars += ch
      } else {
        if (chars.length >= 2) {
          words.push({
            hiragana: chars,
            startRow,
            startCol: c,
            direction: 'down',
            length: chars.length,
          })
        }
        startRow = -1
        chars = ''
      }
    }
  }

  return words
}

// ---------- メイン ----------

function main() {
  const [, , variant, problemFile, answerFile] = process.argv
  if (!variant || !problemFile || !answerFile) {
    console.error('Usage: npx tsx scripts/convert-puzzle.ts <variant> <問題.txt> <答え.txt>')
    console.error('  variant: gen1 | gen2 | all')
    process.exit(1)
  }

  if (!['gen1', 'gen2', 'all'].includes(variant)) {
    console.error(`Invalid variant: ${variant}. Must be gen1, gen2, or all.`)
    process.exit(1)
  }

  // ファイル読み込み
  const problemText = fs.readFileSync(problemFile, 'utf-8')
  const answerText = fs.readFileSync(answerFile, 'utf-8')
  const problemGrid = parseTextGrid(problemText)
  const answerGrid = parseTextGrid(answerText)

  const rows = answerGrid.length
  const cols = answerGrid[0]?.length ?? 0
  console.log(`Grid size: ${rows} rows x ${cols} cols`)

  // グリッドサイズの整合性チェック
  if (problemGrid.length !== rows) {
    console.error(`Row count mismatch: problem=${problemGrid.length}, answer=${rows}`)
    process.exit(1)
  }
  for (let r = 0; r < rows; r++) {
    if (problemGrid[r].length !== answerGrid[r].length) {
      console.error(`Col count mismatch at row ${r}: problem=${problemGrid[r].length}, answer=${answerGrid[r].length}`)
      process.exit(1)
    }
  }

  // タレントデータ読み込み
  const talentsJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../public/data/talents.json'), 'utf-8'),
  )
  const allTalents: TalentData[] = talentsJson.talents
  const hiraganaToTalent = new Map<string, TalentData>()
  for (const t of allTalents) {
    hiraganaToTalent.set(kanaToHiragana(t.kana), t)
  }

  // 正解グリッド構築（JSONのgridフィールド）
  const gridData: (string | null)[][] = answerGrid.map((row) =>
    row.map((ch) => (isBlack(ch) ? null : ch)),
  )

  // ワード抽出
  const extractedWords = extractWords(answerGrid)
  console.log(`Extracted ${extractedWords.length} words`)

  // 番号付きセル抽出
  const numberedCells: { order: number; row: number; col: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < problemGrid[r].length; c++) {
      const num = circledNumberToInt(problemGrid[r][c])
      if (num !== null) {
        numberedCells.push({ order: num, row: r, col: c })
      }
    }
  }
  numberedCells.sort((a, b) => a.order - b.order)
  console.log(`Numbered cells: ${numberedCells.length}`)

  // 隠しメッセージ構築
  const hiddenMessage = numberedCells
    .map((cell) => answerGrid[cell.row]?.[cell.col] ?? '')
    .join('')
  console.log(`Hidden message: ${hiddenMessage}`)

  // 問題テキストから初期開示セルを特定（ひらがな文字が入っているセル）
  const revealedCells = new Set<string>()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < problemGrid[r].length; c++) {
      if (isHiragana(problemGrid[r][c])) {
        revealedCells.add(`${r},${c}`)
      }
    }
  }

  // ワードにタレントIDを紐付け & 初期開示判定
  const initialRevealedWordIds: number[] = []
  const puzzleWords = extractedWords.map((w, idx) => {
    const talent = hiraganaToTalent.get(w.hiragana)

    // このワードの全セルが初期開示されているか
    let allRevealed = true
    for (let i = 0; i < w.length; i++) {
      const r = w.startRow + (w.direction === 'down' ? i : 0)
      const c = w.startCol + (w.direction === 'across' ? i : 0)
      if (!revealedCells.has(`${r},${c}`)) {
        allRevealed = false
        break
      }
    }
    if (allRevealed) {
      initialRevealedWordIds.push(idx)
    }

    if (!talent && !allRevealed) {
      console.warn(`  WARNING: No talent match for "${w.hiragana}" (${w.direction} at ${w.startRow},${w.startCol})`)
    }

    return {
      wordId: idx,
      talentId: talent?.id ?? null,
      hiragana: w.hiragana,
      startRow: w.startRow,
      startCol: w.startCol,
      direction: w.direction,
      length: w.length,
    }
  })

  // 統計表示
  const matched = puzzleWords.filter((w) => w.talentId !== null).length
  const special = puzzleWords.filter((w) => w.talentId === null).length
  console.log(`\nWord matching: ${matched} talents matched, ${special} special/unmatched`)
  if (initialRevealedWordIds.length > 0) {
    console.log(`Initial revealed words: ${initialRevealedWordIds.map((id) => puzzleWords[id].hiragana).join(', ')}`)
  }

  // JSON出力
  const outputDir = path.join(__dirname, '../public/data/puzzles')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const output = {
    variant,
    rows,
    cols,
    grid: gridData,
    words: puzzleWords,
    numberedCells,
    hiddenMessage,
    initialRevealedWordIds,
  }

  const outputPath = path.join(outputDir, `${variant}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\nOutput: ${outputPath}`)

  // グリッドプレビュー
  console.log('\nAnswer grid preview:')
  for (let r = 0; r < rows; r++) {
    console.log(`  ${answerGrid[r].join('')}`)
  }

  console.log('\nProblem grid preview:')
  for (let r = 0; r < rows; r++) {
    console.log(`  ${problemGrid[r].join('')}`)
  }
}

main()
