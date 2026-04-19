import { useSettingsStore } from '../../stores/settingsStore.ts'
import { playSound } from '../../shared/utils/sound.ts'
import type { Generation } from '../../stores/settingsStore.ts'

const GEN_BUTTONS: {
  gen: Generation
  label: string
  background: string
  shadowColor: string
}[] = [
  {
    gen: 'gen1',
    label: '🌙 1期生との相性診断',
    background: 'linear-gradient(180deg, #a6e0c3 0%, #5fc08a 40%, #3a9e68 100%)',
    shadowColor: 'rgba(60,140,90,0.4)',
  },
  {
    gen: 'gen2',
    label: '🌸 2期生との相性診断',
    background: 'linear-gradient(180deg, #fcc4dc 0%, #f096b8 40%, #e06a99 100%)',
    shadowColor: 'rgba(220,100,150,0.4)',
  },
]

export function DiagnosisIntroScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToDiagnosis = useSettingsStore((s) => s.goToDiagnosis)
  const setDiagnosisGeneration = useSettingsStore((s) => s.setDiagnosisGeneration)

  const handleStart = (gen: Generation) => {
    playSound('tap')
    setDiagnosisGeneration(gen)
    goToDiagnosis()
  }

  return (
    <div className="relative w-full h-full flex flex-col animate-fade-in">
      {/* ヘッダー */}
      <div
        className="w-full flex items-center shrink-0"
        style={{ padding: '2cqmin 3cqmin 0' }}
      >
        <button
          className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
          style={{
            fontSize: '4cqmin',
            padding: '1cqmin 2cqmin',
            borderRadius: '2cqmin',
            border: 'none',
            background: 'rgba(255,255,255,0.6)',
            color: '#555',
          }}
          onClick={goToTitle}
        >
          ◀ 戻る
        </button>
        <span
          className="font-bold"
          style={{
            fontSize: '5cqmin',
            marginLeft: '3cqmin',
            color: '#555',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          💫 相性診断
        </span>
      </div>

      {/* コンテンツ */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{
          margin: '2cqmin',
          padding: '4cqmin 5cqmin',
          borderRadius: '3cqmin',
          backgroundColor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.5cqmin 2cqmin rgba(0,0,0,0.1)',
        }}
      >
        {/* 説明テキスト */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3cqmin',
            maxWidth: '80%',
          }}
        >
          <p
            className="text-center"
            style={{
              fontSize: '4cqmin',
              color: '#444',
              lineHeight: 1.7,
            }}
          >
            10問の質問に答えて、<br />
            あなたと相性の良い寮生を診断しよう！
          </p>

          <p
            className="text-center"
            style={{
              fontSize: '2.8cqmin',
              color: '#888',
              lineHeight: 1.5,
            }}
          >
            占い感覚で楽しんでね ✨
          </p>
        </div>

        {/* 世代選択ボタン */}
        <div
          className="flex items-center justify-center"
          style={{ marginTop: '5cqmin', gap: '4cqmin' }}
        >
          {GEN_BUTTONS.map(({ gen, label, background, shadowColor }) => (
            <button
              key={gen}
              className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
              style={{
                fontSize: '4cqmin',
                padding: '2cqmin 5cqmin',
                borderRadius: '5cqmin',
                border: '0.3cqmin solid rgba(255,255,255,0.5)',
                background,
                color: 'white',
                boxShadow: `inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin ${shadowColor}`,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
              onClick={() => handleStart(gen)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
