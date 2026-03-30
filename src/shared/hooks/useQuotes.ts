import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

export interface QuotesData {
  groups: Record<string, Record<string, string[]>>
  talents: Record<string, Record<string, string[]>>
}

let cached: QuotesData | null = null

export function useQuotes() {
  const [quotes, setQuotes] = useState<QuotesData | null>(cached)

  useEffect(() => {
    if (cached) return

    fetch(`${BASE}data/quotes.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ version: number } & QuotesData>
      })
      .then((data) => {
        cached = { groups: data.groups, talents: data.talents }
        setQuotes(cached)
      })
      .catch(() => {
        // quotes.json が存在しない場合はフォールバック（ハードコードセリフ）で動作
      })
  }, [])

  return quotes
}
