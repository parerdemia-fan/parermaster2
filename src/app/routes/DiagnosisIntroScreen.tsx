import { useSettingsStore } from '../../stores/settingsStore.ts'
import { playSound } from '../../shared/utils/sound.ts'

export function DiagnosisIntroScreen() {
  const goToTitle = useSettingsStore((s) => s.goToTitle)
  const goToDiagnosis = useSettingsStore((s) => s.goToDiagnosis)

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
              fontSize: '3cqmin',
              color: '#888',
              lineHeight: 1.6,
            }}
          >
            ※現在は1期生のみが診断対象です
          </p>
        </div>

        {/* スタートボタン */}
        <button
          className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
          style={{
            marginTop: '5cqmin',
            fontSize: '5cqmin',
            padding: '2cqmin 8cqmin',
            borderRadius: '5cqmin',
            border: '0.3cqmin solid rgba(255,255,255,0.5)',
            background: 'linear-gradient(180deg, #d8b4fe 0%, #b87fd4 40%, #9b59b6 100%)',
            color: 'white',
            boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(140,80,180,0.4)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
          onClick={() => { playSound('tap'); goToDiagnosis() }}
        >
          スタート！
        </button>
      </div>
    </div>
  )
}
