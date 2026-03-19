import { useEffect, useState } from 'react'
import type { Award, AwardsJson } from '../types/award.ts'

const BASE = import.meta.env.BASE_URL

let cachedAwards: Award[] | null = null

export function useAwards() {
  const [awards, setAwards] = useState<Award[]>(cachedAwards ?? [])
  const [loading, setLoading] = useState(cachedAwards === null)

  useEffect(() => {
    if (cachedAwards) return

    fetch(`${BASE}data/awards.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<AwardsJson>
      })
      .then((data) => {
        cachedAwards = data.awards
        setAwards(data.awards)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return { awards, loading }
}
