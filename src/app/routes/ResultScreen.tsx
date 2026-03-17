import { useGameStore } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'

export function ResultScreen() {
  const { questions, correctCount } = useGameStore()
  const { goToTitle, goToSetting, generation } = useSettingsStore()

  const total = questions.length
  const rate = total > 0 ? Math.round((correctCount / total) * 100 * 10) / 10 : 0
  const isPerfect = correctCount === total

  const accentColor = generation === 'gen2' ? '#e8789e' : '#6aaa80'
  const accentGradient =
    generation === 'gen2'
      ? 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)'
      : 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)'

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden animate-fade-in">
      <div
        className="flex flex-col items-center"
        style={{
          padding: '5cqmin 8cqmin',
          borderRadius: '3cqmin',
          backgroundColor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
        }}
      >
        <span
          className="font-bold"
          style={{ fontSize: '6cqmin', color: '#333', marginBottom: '3cqmin' }}
        >
          結果発表
        </span>

        <span
          className="font-bold"
          style={{ fontSize: '8cqmin', color: accentColor }}
        >
          {correctCount} / {total}
        </span>

        <span
          style={{ fontSize: '4cqmin', color: '#666', marginTop: '1cqmin' }}
        >
          正解率: {rate}%
        </span>

        {isPerfect && (
          <span
            className="font-bold"
            style={{
              fontSize: '5cqmin',
              color: '#f59e0b',
              marginTop: '2cqmin',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            全問正解！
          </span>
        )}

        <div
          className="flex items-center justify-center"
          style={{ gap: '3cqmin', marginTop: '4cqmin' }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3.5cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid #ddd',
              background: 'white',
              color: '#666',
            }}
            onClick={goToTitle}
          >
            トップに戻る
          </button>
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '3.5cqmin',
              padding: '1.5cqmin 4cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: accentGradient,
              color: 'white',
              boxShadow:
                'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
            }}
            onClick={() => goToSetting(generation)}
          >
            もう一度
          </button>
        </div>
      </div>
    </div>
  )
}
