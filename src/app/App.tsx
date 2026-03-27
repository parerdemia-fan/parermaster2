import { useEffect } from 'react'
import { GameContainer } from '../shared/components/GameContainer.tsx'
import { useSettingsStore } from '../stores/settingsStore.ts'
import type { ModeCategory, Scope } from '../stores/settingsStore.ts'
import { TitleScreen } from './routes/TitleScreen.tsx'
import { SettingScreen } from './routes/SettingScreen.tsx'
import { QuizScreen } from './routes/QuizScreen.tsx'
import { ResultScreen } from './routes/ResultScreen.tsx'
import { DiaryScreen } from './routes/DiaryScreen.tsx'
import { TalentListScreen } from './routes/TalentListScreen.tsx'
import { AchievementScreen } from './routes/AchievementScreen.tsx'
import { AboutScreen } from './routes/AboutScreen.tsx'
import { DebugScreen } from './routes/DebugScreen.tsx'

const BASE = import.meta.env.BASE_URL

const DORM_BG: Record<Scope, string> = {
  wa: `${BASE}data/images/ui/bg_wa.png`,
  me: `${BASE}data/images/ui/bg_me.png`,
  co: `${BASE}data/images/ui/bg_co.png`,
  wh: `${BASE}data/images/ui/bg_wh.png`,
  all: `${BASE}data/images/ui/bg_stage.png`,
}
const DEFAULT_BG = `${BASE}data/images/ui/bg_title.png`

/** クイズ画面の背景ぼかし強度（px） */
const QUIZ_BG_BLUR = 3

function getBackground(screen: string, modeCategory: ModeCategory, scope: Scope): { url: string; blur: number } {
  if (screen === 'quiz' || screen === 'result') {
    if (modeCategory === 'dorm') {
      return { url: DORM_BG[scope] ?? DEFAULT_BG, blur: QUIZ_BG_BLUR }
    }
    // 世代別: scope は 'all' 固定 → bg_stage を使用
    return { url: DORM_BG.all, blur: QUIZ_BG_BLUR }
  }
  return { url: DEFAULT_BG, blur: 0 }
}

export function App() {
  const screen = useSettingsStore((s) => s.screen)
  const modeCategory = useSettingsStore((s) => s.modeCategory)
  const scope = useSettingsStore((s) => s.scope)

  useEffect(() => {
    const { url, blur } = getBackground(screen, modeCategory, scope)
    const s = document.body.style
    s.setProperty('--bg-image', `url('${url}')`)
    s.setProperty('--bg-blur', `${blur}px`)
    // ぼかし時に端が透けるのを防ぐため、ぼかし量に応じて拡大
    s.setProperty('--bg-blur-scale', blur > 0 ? '0.03' : '0')
  }, [screen, modeCategory, scope])

  return (
    <GameContainer>
      {screen === 'title' && <TitleScreen />}
      {screen === 'setting' && <SettingScreen />}
      {screen === 'quiz' && <QuizScreen />}
      {screen === 'result' && <ResultScreen />}
      {screen === 'diary' && <DiaryScreen />}
      {screen === 'talents' && <TalentListScreen />}
      {screen === 'achievements' && <AchievementScreen />}
      {screen === 'about' && <AboutScreen />}
      {import.meta.env.DEV && screen === 'debug' && <DebugScreen />}
    </GameContainer>
  )
}
