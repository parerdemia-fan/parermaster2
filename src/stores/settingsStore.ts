import { create } from 'zustand'

export type Screen = 'title' | 'setting' | 'quiz' | 'result' | 'diary' | 'talents' | 'achievements'
export type Generation = 'gen1' | 'gen2'
export type GameMode = 'face-name' | 'knowledge'
export type DormId = 'wa' | 'me' | 'co' | 'wh'
export type Scope = DormId | 'all'
export type Difficulty = 1 | 2 | 3

const SETTINGS_KEY = 'parermaster2_settings'

interface SavedSettings {
  gameMode: GameMode
  scope: Scope
  difficulty: Difficulty
}

function loadSettings(): Partial<SavedSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<SavedSettings>
  } catch {
    return {}
  }
}

function saveSettings(s: SavedSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

const saved = loadSettings()

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
  goToDiary: () => void
  goToTalents: () => void
  goToAchievements: () => void
  // ゲーム設定
  setGameMode: (mode: GameMode) => void
  setScope: (scope: Scope) => void
  setDifficulty: (difficulty: Difficulty) => void
  // プレイヤー
  setPlayerName: (name: string) => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  (set, get) => ({
    // 初期値（localStorageから復元）
    screen: 'title',
    generation: 'gen2',
    gameMode: saved.gameMode ?? 'face-name',
    scope: saved.scope ?? 'all',
    difficulty: saved.difficulty ?? 1,
    playerName: localStorage.getItem('playerName') ?? 'リスナー',

    // 画面遷移
    goToSetting: (gen) => set({ screen: 'setting', generation: gen }),
    goToTitle: () => set({ screen: 'title' }),
    goToQuiz: () => set({ screen: 'quiz' }),
    goToResult: () => set({ screen: 'result' }),
    goToDiary: () => set({ screen: 'diary' }),
    goToTalents: () => set({ screen: 'talents' }),
    goToAchievements: () => set({ screen: 'achievements' }),

    // ゲーム設定（変更時にlocalStorageへ保存）
    setGameMode: (mode) => {
      set({ gameMode: mode })
      const { scope, difficulty } = get()
      saveSettings({ gameMode: mode, scope, difficulty })
    },
    setScope: (scope) => {
      set({ scope })
      const { gameMode, difficulty } = get()
      saveSettings({ gameMode, scope, difficulty })
    },
    setDifficulty: (difficulty) => {
      set({ difficulty })
      const { gameMode, scope } = get()
      saveSettings({ gameMode, scope, difficulty })
    },

    // プレイヤー
    setPlayerName: (name) => {
      localStorage.setItem('playerName', name)
      set({ playerName: name })
    },
  }),
)
