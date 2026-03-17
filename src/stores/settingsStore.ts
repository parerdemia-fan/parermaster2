import { create } from 'zustand'

export type Screen = 'title' | 'setting' | 'quiz' | 'result'
export type Generation = 'gen1' | 'gen2'
export type GameMode = 'face-name' | 'knowledge'
export type DormId = 'wa' | 'me' | 'co' | 'wh'
export type Scope = DormId | 'all'
export type Difficulty = 1 | 2 | 3

interface SettingsState {
  // 画面遷移
  screen: Screen
  // ゲーム設定
  generation: Generation
  gameMode: GameMode
  scope: Scope
  difficulty: Difficulty
  // プレイヤー
  playerName: string
}

interface SettingsActions {
  // 画面遷移
  goToSetting: (gen: Generation) => void
  goToTitle: () => void
  goToQuiz: () => void
  goToResult: () => void
  // ゲーム設定
  setGameMode: (mode: GameMode) => void
  setScope: (scope: Scope) => void
  setDifficulty: (difficulty: Difficulty) => void
  // プレイヤー
  setPlayerName: (name: string) => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  (set) => ({
    // 初期値
    screen: 'title',
    generation: 'gen2',
    gameMode: 'face-name',
    scope: 'all',
    difficulty: 1,
    playerName: localStorage.getItem('playerName') ?? 'リスナー',

    // 画面遷移
    goToSetting: (gen) => set({ screen: 'setting', generation: gen }),
    goToTitle: () => set({ screen: 'title' }),
    goToQuiz: () => set({ screen: 'quiz' }),
    goToResult: () => set({ screen: 'result' }),

    // ゲーム設定
    setGameMode: (mode) => set({ gameMode: mode }),
    setScope: (scope) => set({ scope }),
    setDifficulty: (difficulty) => set({ difficulty }),

    // プレイヤー
    setPlayerName: (name) => {
      localStorage.setItem('playerName', name)
      set({ playerName: name })
    },
  }),
)
