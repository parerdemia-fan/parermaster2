import { useEffect, useState } from 'react'
import type { Talent, TalentsJson } from '../types/talent.ts'

const BASE = import.meta.env.BASE_URL

let cachedTalents: Talent[] | null = null

export function useTalents() {
  const [talents, setTalents] = useState<Talent[]>(cachedTalents ?? [])
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
        setTalents(data.talents)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { talents, loading, error }
}
