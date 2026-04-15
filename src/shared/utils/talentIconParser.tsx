/**
 * テキスト中のタレント名を検出し、名前の後ろにインラインアイコンを挿入する
 */

import type { Talent } from '../types/talent.ts'
import { getTalentImagePath } from './talent.ts'

// talents 参照が変わらない限りキャッシュを再利用する
let cachedTalentsRef: Talent[] | null = null
let cachedPattern: RegExp | null = null
let cachedNameToTalent: Map<string, Talent> | null = null

function ensureCache(talents: Talent[]) {
  if (cachedTalentsRef === talents) return
  cachedTalentsRef = talents

  const entries = talents
    .flatMap((t) => {
      const noSpace = t.name.replace(/\s/g, '')
      return noSpace !== t.name
        ? [{ name: t.name, talent: t }, { name: noSpace, talent: t }]
        : [{ name: t.name, talent: t }]
    })
    .sort((a, b) => b.name.length - a.name.length)

  const escapedNames = entries.map((e) =>
    e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  cachedPattern = new RegExp(`(${escapedNames.join('|')})`, 'g')
  cachedNameToTalent = new Map(entries.map((e) => [e.name, e.talent]))
}

/**
 * テキスト中のタレント名にインラインアイコンを付与した React ノード配列を返す
 * @param text 変換対象テキスト
 * @param talents タレントデータ配列
 * @param showIcon true: タレント画像を表示 / false: 👤 プレースホルダー
 */
export function parseTextWithTalentIcons(
  text: string,
  talents: Talent[],
  showIcon: boolean,
): React.ReactNode[] {
  if (talents.length === 0) {
    return [text]
  }

  ensureCache(talents)
  const pattern = cachedPattern!
  const nameToTalent = cachedNameToTalent!

  // RegExp は stateful（lastIndex）なのでリセット
  pattern.lastIndex = 0

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t-${key++}`}>{text.slice(lastIndex, match.index)}</span>)
    }

    const matchedName = match[1]
    const talent = nameToTalent.get(matchedName)

    if (talent) {
      const iconSize = '2.2em'
      parts.push(
        <span key={`i-${key++}`}>
          {matchedName}
          <span
            style={{
              display: 'inline-block',
              width: iconSize,
              height: iconSize,
              marginLeft: '0.1em',
              verticalAlign: '-0.5em',
              textAlign: 'center',
            }}
          >
            {showIcon ? (
              <img
                src={getTalentImagePath(talent)}
                alt={matchedName}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '0.2em',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: iconSize,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
                aria-label="非表示"
              >
                👤
              </span>
            )}
          </span>
        </span>,
      )
    } else {
      parts.push(<span key={`t-${key++}`}>{matchedName}</span>)
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t-${key++}`}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : [text]
}
