import { create } from 'zustand'

export type Screen = 'title' | 'setting' | 'quiz' | 'result' | 'diary' | 'talents' | 'achievements' | 'about' | 'debug' | 'time-attack-result'
export type Generation = 'gen1' | 'gen2'
export type GameMode = 'face-name' | 'knowledge'
export type DormId = 'wa' | 'me' | 'co' | 'wh'
export type Scope = DormId | 'all'
export type Difficulty = 1 | 2 | 3
/** タイトル画面で選択するモードカテゴリ */
export type ModeCategory = 'gen1' | 'gen2' | 'dorm'

const SETTINGS_KEY = 'parermaster2_settings'

interface SavedSettings {
  gameMode: GameMode
  scope: Scope
  difficulty: Difficulty
  /** 寮別モードで最後に選んだ寮 */
  dormScope?: DormId
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

function persistSettings({ gameMode, scope, difficulty, dormScope }: SavedSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ gameMode, scope, difficulty, dormScope }))
}

const saved = loadSettings()

interface SettingsState {
  // 画面遷移
  screen: Screen
  // ゲーム設定
  modeCategory: ModeCategory
  generation: Generation
  gameMode: GameMode
  scope: Scope
  difficulty: Difficulty
  // タイムアタック
  isTimeAttack: boolean
  // プレイヤー
  playerName: string
}

interface SettingsActions {
  // 画面遷移
  goToSetting: (mode: ModeCategory) => void
  goToTitle: () => void
  goToQuiz: () => void
  goToResult: () => void
  goToDiary: () => void
  goToTalents: () => void
  goToAchievements: () => void
  goToAbout: () => void
  goToDebug: () => void
  goToTimeAttack: () => void
  goToTimeAttackResult: () => void
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
    isTimeAttack: false,
    modeCategory: 'gen2',
    generation: 'gen2',
    gameMode: saved.gameMode ?? 'face-name',
    scope: saved.scope ?? 'all',
    difficulty: saved.difficulty ?? 1,
    playerName: localStorage.getItem('playerName') ?? 'リスナー',

    // 画面遷移
    goToSetting: (mode) => {
      if (mode === 'dorm') {
        const dormScope = saved.dormScope ?? 'wa'
        set({ screen: 'setting', modeCategory: 'dorm', gameMode: 'face-name', scope: dormScope })
      } else {
        const gen: Generation = mode === 'gen1' ? 'gen1' : 'gen2'
        set({ screen: 'setting', modeCategory: mode, generation: gen, scope: 'all' })
      }
    },
    goToTitle: () => set({ screen: 'title', isTimeAttack: false }),
    goToQuiz: () => set({ screen: 'quiz' }),
    goToResult: () => set({ screen: 'result' }),
    goToDiary: () => set({ screen: 'diary' }),
    goToTalents: () => set({ screen: 'talents' }),
    goToAchievements: () => set({ screen: 'achievements' }),
    goToAbout: () => set({ screen: 'about' }),
    goToDebug: () => set({ screen: 'debug' }),
    goToTimeAttack: () => set({ screen: 'quiz', isTimeAttack: true }),
    goToTimeAttackResult: () => set({ screen: 'time-attack-result' }),

    // ゲーム設定（変更時にlocalStorageへ保存）
    setGameMode: (mode) => { set({ gameMode: mode }); persistSettings(get()) },
    setScope: (scope) => {
      set({ scope })
      const state = get()
      const dormScope = state.modeCategory === 'dorm' && scope !== 'all' ? scope as DormId : saved.dormScope
      persistSettings({ ...state, dormScope })
    },
    setDifficulty: (difficulty) => { set({ difficulty }); persistSettings(get()) },

    // プレイヤー
    setPlayerName: (name) => {
      localStorage.setItem('playerName', name)
      set({ playerName: name })
    },
  }),
)
