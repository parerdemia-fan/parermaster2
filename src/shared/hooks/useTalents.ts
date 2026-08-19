import { useEffect, useMemo, useState } from 'react'
import type { Talent, TalentsJson } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL

let cachedTalents: Talent[] | null = null

/**
 * hidden なタレントを除外する
 * hidden 列が未同期の talents.json では値が undefined になるため、未定義は「表示する」として扱う
 */
export function excludeHiddenTalents(talents: Talent[], includeHidden: boolean): Talent[] {
  return includeHidden ? talents : talents.filter((t) => !t.hidden)
}

/**
 * タレントデータを取得する
 * @param includeHidden hidden なタレントも含めるか。スケルトンパズルのようにパズルデータ側が
 *   参照していて除外すると成立しない画面でのみ true にする（→ docs/data-design.md 非表示タレント）
 */
export function useTalents(includeHidden = false) {
  const [allTalents, setAllTalents] = useState<Talent[]>(cachedTalents ?? [])
  const [loading, setLoading] = useState(cachedTalents === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cachedTalents) return

    fetch(`${BASE}data/talents.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<TalentsJson>
      })
      .then((data) => {
        cachedTalents = data.talents
        setAllTalents(data.talents)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const talents = useMemo(
    () => excludeHiddenTalents(allTalents, includeHidden),
    [allTalents, includeHidden],
  )

  return { talents, loading, error }
}
