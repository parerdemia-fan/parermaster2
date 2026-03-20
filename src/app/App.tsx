import { GameContainer } from '../shared/components/GameContainer.tsx'
import { useSettingsStore } from '../stores/settingsStore.ts'
import { TitleScreen } from './routes/TitleScreen.tsx'
import { SettingScreen } from './routes/SettingScreen.tsx'
import { QuizScreen } from './routes/QuizScreen.tsx'
import { ResultScreen } from './routes/ResultScreen.tsx'
import { DiaryScreen } from './routes/DiaryScreen.tsx'
import { TalentListScreen } from './routes/TalentListScreen.tsx'
import { AchievementScreen } from './routes/AchievementScreen.tsx'
import { AboutScreen } from './routes/AboutScreen.tsx'

export function App() {
  const screen = useSettingsStore((s) => s.screen)

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
