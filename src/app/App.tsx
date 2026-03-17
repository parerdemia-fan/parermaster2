import { useState } from 'react'
import { GameContainer } from '../shared/components/GameContainer.tsx'
import { TitleScreen } from './routes/TitleScreen.tsx'
import { SettingScreen } from './routes/SettingScreen.tsx'

type Screen = 'title' | 'setting'
type Generation = 'gen1' | 'gen2'

export function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [generation, setGeneration] = useState<Generation>('gen2')

  const handleSelectGeneration = (gen: Generation) => {
    setGeneration(gen)
    setScreen('setting')
  }

  const handleBack = () => {
    setScreen('title')
  }

  return (
    <GameContainer>
      {screen === 'title' && (
        <TitleScreen onSelectGeneration={handleSelectGeneration} />
      )}
      {screen === 'setting' && (
        <SettingScreen generation={generation} onBack={handleBack} />
      )}
    </GameContainer>
  )
}
