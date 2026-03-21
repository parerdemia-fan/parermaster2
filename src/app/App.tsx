import { useEffect } from 'react'
import { GameContainer } from '../shared/components/GameContainer.tsx'
import { useSettingsStore } from '../stores/settingsStore.ts'
import type { Scope } from '../stores/settingsStore.ts'
import { TitleScreen } from './routes/TitleScreen.tsx'
import { SettingScreen } from './routes/SettingScreen.tsx'
import { QuizScreen } from './routes/QuizScreen.tsx'
import { ResultScreen } from './routes/ResultScreen.tsx'
import { DiaryScreen } from './routes/DiaryScreen.tsx'
import { TalentListScreen } from './routes/TalentListScreen.tsx'
import { AchievementScreen } from './routes/AchievementScreen.tsx'
import { AboutScreen } from './routes/AboutScreen.tsx'

const BASE = import.meta.env.BASE_URL

const DORM_BG: Partial<Record<Scope, string>> = {
  wa: `${BASE}data/images/ui/bg_wa.png`,
}
const DEFAULT_BG = `${BASE}data/images/ui/bg_title.png`

function getBackgroundUrl(screen: string, scope: Scope): string {
  if (screen === 'quiz' || screen === 'result') {
    return DORM_BG[scope] ?? DEFAULT_BG
  }
  return DEFAULT_BG
}

export function App() {
  const screen = useSettingsStore((s) => s.screen)
  const scope = useSettingsStore((s) => s.scope)

  useEffect(() => {
    document.body.style.backgroundImage = `url('${getBackgroundUrl(screen, scope)}')`
  }, [screen, scope])

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
    </GameContainer>
  )
}
