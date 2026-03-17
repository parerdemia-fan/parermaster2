import { GameContainer } from '../shared/components/GameContainer.tsx'
import { useSettingsStore } from '../stores/settingsStore.ts'
import { TitleScreen } from './routes/TitleScreen.tsx'
import { SettingScreen } from './routes/SettingScreen.tsx'

export function App() {
  const screen = useSettingsStore((s) => s.screen)

  return (
    <GameContainer>
      {screen === 'title' && <TitleScreen />}
      {screen === 'setting' && <SettingScreen />}
    </GameContainer>
  )
}
