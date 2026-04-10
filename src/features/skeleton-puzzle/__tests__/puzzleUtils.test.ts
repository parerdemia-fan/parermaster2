import { describe, it, expect } from 'vitest'
import {
  kanaToHiragana,
  getWordCells,
  findConflicts,
  getMessageProgress,
  isPuzzleComplete,
  getMatchingTalentIds,
} from '../puzzleUtils.ts'
import type { PuzzleData, PuzzleWord } from '../types.ts'

describe('kanaToHiragana', () => {
  it('カタカナをひらがなに変換する', () => {
    expect(kanaToHiragana('シグマ')).toBe('しぐま')
  })

  it('点(・)を除去する', () => {
    expect(kanaToHiragana('シグマ・イングラム')).toBe('しぐまいんぐらむ')
  })

  it('＝を除去する', () => {
    expect(kanaToHiragana('ローズ＝ダマスク')).toBe('ろーずだますく')
  })

  it('ひらがなはそのまま', () => {
    expect(kanaToHiragana('はたすいか')).toBe('はたすいか')
  })

  it('混在（カタカナ+ひらがな）を処理する', () => {
    expect(kanaToHiragana('セナりるか')).toBe('せなりるか')
  })

  it('長音符はそのまま保持する', () => {
    expect(kanaToHiragana('フローレ')).toBe('ふろーれ')
  })
})

describe('getWordCells', () => {
  it('横方向のセル座標を返す', () => {
    const word: PuzzleWord = {
      wordId: 0,
      talentId: 'T001',
      hiragana: 'あいう',
      startRow: 2,
      startCol: 3,
      direction: 'across',
      length: 3,
    }
    expect(getWordCells(word)).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ])
  })

  it('縦方向のセル座標を返す', () => {
    const word: PuzzleWord = {
      wordId: 0,
      talentId: 'T001',
      hiragana: 'あい',
      startRow: 1,
      startCol: 5,
      direction: 'down',
      length: 2,
    }
    expect(getWordCells(word)).toEqual([
      { row: 1, col: 5 },
      { row: 2, col: 5 },
    ])
  })
})

// テスト用の小さなパズルを作成
function makeTestPuzzle(): PuzzleData {
  // 5x5 グリッド
  // 横: "あいう" (0,0)-(0,2) wordId=0 talentId="T001"
  // 縦: "いえお" (0,1)-(2,1) wordId=1 talentId="T002"
  // 横: "かき" (2,0)-(2,1) wordId=2 talentId=null (初期開示)
  // 交差点: (0,1)="い", (2,1)="お"/"き"
  return {
    variant: 'gen2',
    rows: 3,
    cols: 3,
    grid: [
      ['あ', 'い', 'う'],
      [null, 'え', null],
      ['か', 'お', null],
    ],
    words: [
      { wordId: 0, talentId: 'T001', hiragana: 'あいう', startRow: 0, startCol: 0, direction: 'across', length: 3 },
      { wordId: 1, talentId: 'T002', hiragana: 'いえお', startRow: 0, startCol: 1, direction: 'down', length: 3 },
      { wordId: 2, talentId: null, hiragana: 'かお', startRow: 2, startCol: 0, direction: 'across', length: 2 },
    ],
    numberedCells: [
      { order: 1, row: 0, col: 0 },
      { order: 2, row: 1, col: 1 },
    ],
    hiddenMessage: 'あえ',
    initialRevealedWordIds: [2],
  }
}

describe('findConflicts', () => {
  it('矛盾がない場合は空セットを返す', () => {
    const puzzle = makeTestPuzzle()
    // 正解通りに配置
    const placements = { 0: 'T001', 1: 'T002' }
    const conflicts = findConflicts(puzzle, placements)
    expect(conflicts.size).toBe(0)
  })

  it('交差点の矛盾を検出する', () => {
    const puzzle = makeTestPuzzle()
    // wordId=1に間違ったタレントを配置（T001の"あいう"を配置）
    // (0,1)にはwordId=0の"い"とwordId=1で配置されたT001の"い"が来るが...
    // T001のhiraganaは"あいう"(3文字)なのでwordId=1(length=3)に配置すると"あいう"が入る
    // (0,1): wordId=0="い", wordId=1="あ" → 矛盾！
    const placements = { 0: 'T001', 1: 'T001' }
    const conflicts = findConflicts(puzzle, placements)
    expect(conflicts.has('0,1')).toBe(true)
  })
})

describe('getMessageProgress', () => {
  it('一部配置で部分的な進捗を返す', () => {
    const puzzle = makeTestPuzzle()
    const placements = { 0: 'T001' } // wordId=0だけ配置
    const progress = getMessageProgress(puzzle, placements)
    expect(progress.chars[0]).toBe('あ') // (0,0) = "あ"
    expect(progress.chars[1]).toBe(null) // (1,1) = まだ未配置
    expect(progress.complete).toBe(false)
  })

  it('正しく全配置でメッセージ完成', () => {
    const puzzle = makeTestPuzzle()
    const placements = { 0: 'T001', 1: 'T002' }
    const progress = getMessageProgress(puzzle, placements)
    expect(progress.chars).toEqual(['あ', 'え'])
    expect(progress.complete).toBe(true)
  })
})

describe('isPuzzleComplete', () => {
  it('全ワード正解で完全クリア', () => {
    const puzzle = makeTestPuzzle()
    const placements = { 0: 'T001', 1: 'T002' }
    expect(isPuzzleComplete(puzzle, placements)).toBe(true)
  })

  it('未配置ワードがあれば未完了', () => {
    const puzzle = makeTestPuzzle()
    const placements = { 0: 'T001' }
    expect(isPuzzleComplete(puzzle, placements)).toBe(false)
  })

  it('間違った配置があれば未完了', () => {
    const puzzle = makeTestPuzzle()
    const placements = { 0: 'T002', 1: 'T001' }
    expect(isPuzzleComplete(puzzle, placements)).toBe(false)
  })

  it('初期開示ワードはチェック対象外', () => {
    const puzzle = makeTestPuzzle()
    // wordId=2は初期開示なので、0と1だけ正解すればOK
    const placements = { 0: 'T001', 1: 'T002' }
    expect(isPuzzleComplete(puzzle, placements)).toBe(true)
  })
})

describe('getMatchingTalentIds', () => {
  it('指定文字数のタレントIDを返す', () => {
    const puzzle = makeTestPuzzle()
    expect(getMatchingTalentIds(puzzle, 3)).toEqual(['T001', 'T002'])
  })

  it('特殊ワード(talentId=null)は除外する', () => {
    const puzzle = makeTestPuzzle()
    expect(getMatchingTalentIds(puzzle, 2)).toEqual([])
  })
})
