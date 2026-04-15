import { useState, useEffect } from 'react'

export type ScreenMode = 'landscape' | 'portrait-center' | 'portrait-room'

/** 画面比率に応じた3モードを返す */
function getMode(): ScreenMode {
  const ratio = window.innerWidth / window.innerHeight
  if (ratio >= 4 / 3) return 'landscape'
  if (ratio >= 2 / 3) return 'portrait-center'
  return 'portrait-room'
}

export function useScreenMode(): ScreenMode {
  const [mode, setMode] = useState(getMode)

  useEffect(() => {
    const handler = () => setMode(getMode())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return mode
}
