import { GameContainer } from '../shared/components/GameContainer.tsx'
import { TitleScreen } from './routes/TitleScreen.tsx'

export function App() {
  return (
    <GameContainer>
      <TitleScreen />
    </GameContainer>
  )
}
