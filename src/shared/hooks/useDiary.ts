import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

export interface DiaryEntry {
  date: string
  title: string
  body: string
}

let cachedEntries: DiaryEntry[] | null = null

export function useDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>(cachedEntries ?? [])
  const [loading, setLoading] = useState(cachedEntries === null)

  useEffect(() => {
    if (cachedEntries) return

    fetch(`${BASE}data/diary.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<DiaryEntry[]>
      })
      .then((data) => {
        cachedEntries = data
        setEntries(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return { entries, loading }
}
