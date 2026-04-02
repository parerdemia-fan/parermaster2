const BASE = import.meta.env.BASE_URL
const SOUND_KEY = 'parermaster2_sound'

/** サウンド有効/無効の状態 */
let enabled = localStorage.getItem(SOUND_KEY) !== 'off'

/** プリロード済みの Audio キャッシュ */
const cache = new Map<string, HTMLAudioElement>()

const SOUNDS = [
  'correct', 'incorrect', 'tap', 'countdown',
  'start', 'penalty', 'perfect', 'levelup',
] as const

/** 効果音ごとの音量調整（デフォルト1.0） */
const VOLUME: Partial<Record<SoundName, number>> = {
  correct: 0.55,
}

export type SoundName = typeof SOUNDS[number]

/** 全効果音をプリロード */
export function preloadSounds(): void {
  for (const name of SOUNDS) {
    if (!cache.has(name)) {
      const audio = new Audio(`${BASE}data/sounds/${name}.mp3`)
      audio.preload = 'auto'
      cache.set(name, audio)
    }
  }
}

/** 効果音を再生 */
export function playSound(name: SoundName): void {
  if (!enabled) return
  const vol = VOLUME[name] ?? 1.0
  const cached = cache.get(name)
  if (cached) {
    cached.volume = vol
    cached.currentTime = 0
    cached.play().catch(() => {})
  } else {
    const audio = new Audio(`${BASE}data/sounds/${name}.mp3`)
    audio.volume = vol
    audio.play().catch(() => {})
    cache.set(name, audio)
  }
}

/** サウンドの有効/無効を取得 */
export function isSoundEnabled(): boolean {
  return enabled
}

/** サウンドの有効/無効を切り替え */
export function setSoundEnabled(value: boolean): void {
  enabled = value
  localStorage.setItem(SOUND_KEY, value ? 'on' : 'off')
}
