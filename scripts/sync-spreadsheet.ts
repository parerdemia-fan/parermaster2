#!/usr/bin/env tsx

/**
 * Google スプレッドシートから talents.json / questions.json / awards.json を生成するスクリプト
 *
 * 使い方:
 *   1. scripts/sync-config.example.json をコピーして scripts/sync-config.json を作成
 *   2. Google Cloud でサービスアカウントを作成し、鍵JSONを secrets/ に配置
 *   3. スプレッドシートをサービスアカウントのメールアドレスに共有
 *   4. pnpm sync を実行
 */

import { google } from 'googleapis'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'data')

// =============================================================================
// 設定読み込み
// =============================================================================

interface SyncConfig {
  spreadsheetId: string
  credentialsPath: string
  sheets: {
    /** シート名 → 世代番号 のマッピング（例: { "1期生": 1, "2期生": 2 }） */
    talents: Record<string, number>
    awards: string
    questions: string
    answerSets: string
  }
}

const configPath = resolve(__dirname, 'sync-config.json')

function loadConfig(): SyncConfig {
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'))
  } catch {
    console.error(`エラー: ${configPath} が見つかりません`)
    console.error('  cp scripts/sync-config.example.json scripts/sync-config.json')
    console.error('  を実行して設定ファイルを作成してください。')
    process.exit(1)
  }
}

const config = loadConfig()

// =============================================================================
// Google Sheets API
// =============================================================================

const auth = new google.auth.GoogleAuth({
  keyFile: resolve(__dirname, '..', config.credentialsPath),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})

const sheetsApi = google.sheets({ version: 'v4', auth })

type RawRow = Record<string, string>

async function fetchSheet(sheetName: string): Promise<RawRow[]> {
  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `'${sheetName}'!A:ZZ`,
  })

  const rows = response.data.values
  if (!rows || rows.length < 2) return []

  const headers = rows[0] as string[]
  return rows.slice(1)
    .filter(row => row.some(cell => cell?.trim()))
    .map(row => {
      const obj: RawRow = {}
      headers.forEach((header, i) => {
        obj[header.trim()] = (row[i] || '').trim()
      })
      return obj
    })
}

// =============================================================================
// ヘルパー
// =============================================================================

/** 寮名 → 寮コード変換 */
const DORM_TO_CODE: Record<string, string> = {
  'バゥ寮': 'wa', 'ミュゥ寮': 'me', 'クゥ寮': 'co', 'ウィニー寮': 'wh',
  // コードがそのまま入っている場合
  'wa': 'wa', 'me': 'me', 'co': 'co', 'wh': 'wh',
}

function toDormCode(value: string): string {
  const code = DORM_TO_CODE[value]
  if (code) return code
  console.warn(`  ⚠ 不明な寮名: "${value}"`)
  return value.toLowerCase()
}

/** カンマ区切りまたは改行区切りを配列に変換 */
function toArray(value: string): string[] {
  if (!value) return []
  const items = value.includes('\n') ? value.split('\n') : value.split(',')
  return items.map(s => s.trim()).filter(Boolean)
}

/** 姓名分割（スペース区切り） */
function splitName(separated: string): [string, string] {
  const parts = separated.trim().split(/\s+/)
  return [parts[0] || '', parts.slice(1).join(' ') || '']
}

/** 真偽値パース */
function toBool(value: string): boolean {
  const v = value.toLowerCase().trim()
  return v === 'true' || v === '○' || v === '1' || v === 'yes'
}

/** 数値パース */
function toNum(value: string): number {
  const n = Number(value)
  return isNaN(n) ? 0 : n
}

/** テキスト中の [image:filename] を抽出し、テキストと画像ファイル名に分離する */
function extractImage(text: string): { text: string; image: string | null } {
  const match = text.match(/\[image:([^\]]+)\]/)
  if (!match) return { text, image: null }
  return {
    text: text.replace(/\[image:[^\]]+\]/, '').trim(),
    image: match[1],
  }
}

/**
 * ハッシュタグのパース
 *
 * 以下の両形式に対応:
 *   ラベルなし: "#ゆらぐっどたいむ\n#ゆらぐあ〜〜と\n#ゆらみて"
 *   ラベル付き: "総合:#ゆらぐっどたいむ\nFA:#ゆらぐあ〜〜と\nエゴサ:#ゆらみて"
 */
function parseHashtags(value: string): { tag: string; usage: string }[] {
  if (!value) return []
  return value.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      // "用途:#タグ" の形式かチェック（#の前にコロンがある場合）
      const match = line.match(/^([^#]+):(#.+)$/)
      if (match) {
        return { tag: match[2].trim(), usage: match[1].trim() }
      }
      return { tag: line, usage: '' }
    })
}

/** IDの零埋め生成 */
function makeId(prefix: string, index: number, digits = 3): string {
  return `${prefix}${String(index + 1).padStart(digits, '0')}`
}

// =============================================================================
// 変換: タレント
// =============================================================================

function transformTalent(row: RawRow, generation: number) {
  const [familyName, givenName] = splitName(row['name_separated'] || row['name'] || '')
  const [familyKana, givenKana] = splitName(row['kana_separated'] || row['kana'] || '')

  const links: { type: string; url: string }[] = []
  const linkFields: [string, string][] = [
    ['url', 'official'],
    ['youtube_url', 'youtube'],
    ['x_url', 'x'],
    ['tiktok_url', 'tiktok'],
    ['marshmallow_url', 'marshmallow'],
  ]
  for (const [field, type] of linkFields) {
    if (row[field]) links.push({ type, url: row[field] })
  }

  const hashtags = parseHashtags(row['hashtags'])

  return {
    id: row['student_id'] || '',
    generation,
    dormitory: toDormCode(row['dormitory'] || ''),
    name: row['name'] || '',
    kana: row['kana'] || '',
    familyName,
    givenName,
    familyKana,
    givenKana,
    nickname: row['nickname'] || '',
    firstPerson: row['first_person'] || '',
    intro: row['intro'] || '',
    dream: row['dream'] || '',
    birthday: row['birthday'] || '',
    height: toNum(row['height']),
    bloodType: row['blood_type'] || '',
    hairColor: row['hair_color'] || '',
    hairStyle: row['hair_style'] || '',
    eyeColorLeft: row['eye_color_left'] || '',
    eyeColorRight: row['eye_color_right'] || '',
    mbti: row['mbti'] || '',
    fanName: row['fan_name'] || '',
    fanMark: row['fan_mark'] || '',
    hashtags,
    hobbies: toArray(row['hobbies']),
    skills: toArray(row['skills']),
    favorites: toArray(row['favorites']),
    links,
  }
}

// =============================================================================
// 変換: 受賞歴
// =============================================================================

function transformAward(row: RawRow, index: number, nameToId: Map<string, string>) {
  const talentName = row['タレント名'] || ''
  const talentId = nameToId.get(talentName) || ''
  let result = row['順位'] || ''
  if (/^\d+$/.test(result)) {
    result += '位'
  }
  return {
    id: makeId('a', index),
    eventDate: row['時期'] || '',
    eventName: row['イベント'] || '',
    result,
    talentId,
  }
}

// =============================================================================
// 変換: 知識問題
// =============================================================================

function transformQuestion(
  row: RawRow,
  index: number,
  nameToGeneration: Map<string, number>,
) {
  const talentName = row['タレント'] || ''
  const generation = talentName ? (nameToGeneration.get(talentName) ?? 0) : 0

  const { text: question, image: questionImage } = extractImage(row['問題文'] || '')
  const { text: comment, image: commentImage } = extractImage(row['回答後コメント'] || '')

  return {
    id: makeId('q', index),
    generation,
    question,
    answers: [
      row['選択肢1(正解)'] || '',
      row['選択肢2'] || '',
      row['選択肢3'] || '',
      row['選択肢4'] || '',
    ],
    difficulty: toNum(row['難易度']),
    genre: row['ジャンル'] || '',
    sortAnswers: toBool(row['選択肢ソート'] || ''),
    hideIcon: toBool(row['アイコンを隠す'] || ''),
    questionImage,
    commentImage,
    answerPool: row['選択肢補完元'] || '',
    comment,
    sourceUrl: row['情報源URL'] || '',
  }
}

// =============================================================================
// メイン
// =============================================================================

async function main() {
  console.log('スプレッドシートからデータを同期中...\n')

  // --- タレント ---
  const allTalents: ReturnType<typeof transformTalent>[] = []
  const nameToId = new Map<string, string>()
  const nameToGeneration = new Map<string, number>()

  for (const [sheetName, generation] of Object.entries(config.sheets.talents)) {
    console.log(`[${sheetName}] シートを取得中...`)
    const rows = await fetchSheet(sheetName)

    let skipped = 0
    for (const row of rows) {
      if (row['dropout']) {
        skipped++
        continue
      }
      const talent = transformTalent(row, generation)
      allTalents.push(talent)
      nameToId.set(row['name'], talent.id)
      nameToGeneration.set(row['name'], generation)
    }

    const count = rows.length - skipped
    console.log(`  ${count}名を変換${skipped > 0 ? `（${skipped}名を除外）` : ''}`)
  }

  writeFileSync(
    resolve(OUTPUT_DIR, 'talents.json'),
    JSON.stringify({ version: 2, talents: allTalents }, null, 2) + '\n',
  )
  console.log(`  → talents.json に書き出し（計${allTalents.length}名）\n`)

  // --- 受賞歴 ---
  console.log(`[${config.sheets.awards}] シートを取得中...`)
  const awardRows = await fetchSheet(config.sheets.awards)
  const allAwards = awardRows.map((row, i) => transformAward(row, i, nameToId))
  // タレントが見つからない（退学者）の受賞歴は除外
  const awards = allAwards.filter(a => a.talentId)
  const awardSkipped = allAwards.length - awards.length

  writeFileSync(
    resolve(OUTPUT_DIR, 'awards.json'),
    JSON.stringify({ version: 1, awards }, null, 2) + '\n',
  )
  console.log(`  → awards.json に書き出し（${awards.length}件${awardSkipped > 0 ? `、${awardSkipped}件を除外` : ''}）\n`)

  // --- 選択肢セット ---
  // ヘッダーが「セット名, 選択肢→, 選択肢→, ...」のように同名カラムが横に並ぶため
  // fetchSheet（ヘッダーをキーにする）では最後の1つしか取れない。生データから直接処理する。
  console.log(`[${config.sheets.answerSets}] シートを取得中...`)
  const answerSetsRaw = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `'${config.sheets.answerSets}'!A:ZZ`,
  })
  const answerSets: Record<string, string[]> = {}

  const asRows = answerSetsRaw.data.values
  if (asRows && asRows.length >= 2) {
    for (const row of asRows.slice(1)) {
      const setName = (row[0] || '').trim()
      if (!setName) continue
      // 2列目以降の空でないセルをすべて選択肢として収集
      const members = row.slice(1)
        .map((cell: string) => (cell || '').trim())
        .filter(Boolean)
      if (members.length > 0) {
        answerSets[setName] = members
      }
    }
  }

  const setCount = Object.keys(answerSets).length
  console.log(`  ${setCount}セットを変換\n`)

  // --- 知識問題 ---
  console.log(`[${config.sheets.questions}] シートを取得中...`)
  const questionRows = await fetchSheet(config.sheets.questions)
  const questions = questionRows.map((row, i) =>
    transformQuestion(row, i, nameToGeneration),
  )

  writeFileSync(
    resolve(OUTPUT_DIR, 'questions.json'),
    JSON.stringify({ version: 2, questions, answerSets }, null, 2) + '\n',
  )
  console.log(`  → questions.json に書き出し（${questions.length}問、${setCount}セット）\n`)

  console.log('同期完了!')
}

main().catch(err => {
  console.error('エラー:', err.message)
  process.exit(1)
})
