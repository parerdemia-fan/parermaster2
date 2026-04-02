import { useState, useCallback } from 'react'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { useGameStore } from '../../stores/gameStore.ts'
import { useBadgeStore } from '../../stores/badgeStore.ts'
import { useTalents } from '../../shared/hooks/useTalents.ts'
import { useQuestions } from '../../shared/hooks/useQuestions.ts'
import { generateTimeAttackQuestions } from '../../features/time-attack/generator.ts'
import { preloadQuestionImages } from '../../shared/utils/preloadImages.ts'
import { SakuraPetals } from '../../shared/components/SakuraPetals.tsx'
import { playSound, isSoundEnabled, setSoundEnabled } from '../../shared/utils/sound.ts'

const BASE = import.meta.env.BASE_URL

export function TitleScreen() {
  const goToSetting = useSettingsStore((s) => s.goToSetting)
  const goToTalents = useSettingsStore((s) => s.goToTalents)
  const goToAchievements = useSettingsStore((s) => s.goToAchievements)
  const goToAbout = useSettingsStore((s) => s.goToAbout)
  const goToDiagnosis = useSettingsStore((s) => s.goToDiagnosis)
  const goToDebug = useSettingsStore((s) => s.goToDebug)
  const goToTimeAttack = useSettingsStore((s) => s.goToTimeAttack)
  const startQuiz = useGameStore((s) => s.startQuiz)
  const isTimeAttackUnlocked = useBadgeStore((s) => s.isTimeAttackUnlocked)
  const { talents } = useTalents()
  const { questions: questionPool, answerSets } = useQuestions()

  const [showTADialog, setShowTADialog] = useState(false)
  const [isTAPreloading, setIsTAPreloading] = useState(false)
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const taUnlocked = isTimeAttackUnlocked()

  const handleTimeAttackStart = useCallback(async () => {
    if (talents.length === 0 || isTAPreloading) return
    const questions = generateTimeAttackQuestions(talents, questionPool, answerSets)

    setIsTAPreloading(true)
    const { firstReady } = preloadQuestionImages(questions, talents)
    await firstReady

    startQuiz(questions)
    goToTimeAttack()
    setShowTADialog(false)
    setIsTAPreloading(false)
  }, [talents, questionPool, answerSets, isTAPreloading, startQuiz, goToTimeAttack])

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      <SakuraPetals />
      {/* 横画面推奨表示（縦画面時のみ） */}
      <div
        className="absolute top-0 left-0 right-0 text-center font-bold z-10"
        style={{
          fontSize: '3cqmin',
          padding: '1cqmin',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          display: 'none',
        }}
      >
        <style>{`
          @media (max-aspect-ratio: 4/3) {
            .landscape-hint { display: block !important; }
          }
        `}</style>
        <span className="landscape-hint" style={{ display: 'none' }}>
          📱 横画面推奨
        </span>
      </div>

      {/* ロゴ */}
      <img
        src={`${BASE}data/images/ui/logo_title_landscape.png`}
        alt="パレ学マスター 2nd Season"
        style={{
          marginTop: '3cqmin',
          height: '42cqmin',
          width: 'auto',
          objectFit: 'contain',
        }}
        draggable={false}
      />

      {/* メインボタン */}
      <div
        className="flex flex-col items-center"
        style={{
          gap: '5cqmin',
          marginTop: '5cqmin',
        }}
      >
        {/* 2期生・1期生（横並び） */}
        <div
          className="flex flex-row items-center justify-center"
          style={{ gap: '6cqmin' }}
        >
          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95 whitespace-nowrap"
            style={{
              fontSize: '5cqmin',
              padding: '1.5cqmin 5cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid rgba(255,255,255,0.5)',
              background: 'linear-gradient(180deg, #a8dbb8 0%, #7cbf96 40%, #6aaa80 100%)',
              color: 'white',
              boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(74,138,96,0.4)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
            onClick={() => { playSound('tap'); goToSetting('gen1') }}
          >
            🌙 1期生編
          </button>

          <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95 whitespace-nowrap"
            style={{
              fontSize: '5cqmin',
              padding: '1.5cqmin 5cqmin',
              borderRadius: '5cqmin',
              border: '0.3cqmin solid rgba(255,255,255,0.5)',
              background: 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)',
              color: 'white',
              boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(192,90,122,0.4)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
            onClick={() => { playSound('tap'); goToSetting('gen2') }}
          >
            🌸 2期生編
          </button>
        </div>

        {/* 寮別モード */}
        <button
          className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95 whitespace-nowrap"
          style={{
            fontSize: '5cqmin',
            padding: '1.5cqmin 5cqmin',
            borderRadius: '5cqmin',
            border: '0.3cqmin solid rgba(255,255,255,0.5)',
            background: 'linear-gradient(180deg, #b8d4e8 0%, #7aabc4 40%, #5b8db8 100%)',
            color: 'white',
            boxShadow: 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(60,100,140,0.4)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
          onClick={() => { playSound('tap'); goToSetting('dorm') }}
        >
          🏠 寮別モード
        </button>

        {/* タイムアタック（下段） */}
        <button
          className={`font-bold whitespace-nowrap ${taUnlocked ? 'cursor-pointer transition hover:brightness-105 active:scale-95' : 'cursor-not-allowed'}`}
          style={{
            fontSize: '4cqmin',
            padding: '1.5cqmin 5cqmin',
            borderRadius: '5cqmin',
            border: taUnlocked
              ? '0.3cqmin solid rgba(255,255,255,0.5)'
              : '0.3cqmin solid rgba(255,255,255,0.3)',
            background: taUnlocked
              ? 'linear-gradient(180deg, #ffd700 0%, #ffb700 40%, #e6a000 100%)'
              : 'linear-gradient(180deg, #d0d0d0 0%, #b0b0b0 40%, #999 100%)',
            color: taUnlocked ? 'white' : 'rgba(255,255,255,0.7)',
            boxShadow: taUnlocked
              ? 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(200,150,0,0.4)'
              : 'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.2), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
          disabled={!taUnlocked}
          onClick={() => { if (taUnlocked) { playSound('tap'); setShowTADialog(true) } }}
        >
          {taUnlocked ? '⏱️ タイムアタック' : '🔒 タイムアタック'}
        </button>
      </div>

      {/* サブメニューアイコン（右端に縦並び） */}
      <div
        className="flex flex-col items-center absolute"
        style={{
          gap: '3cqmin',
          right: '3cqmin',
          bottom: '3cqmin',
        }}
      >
        <SubMenuButton
          emoji="📋"
          label="寮生一覧"
          gradient="linear-gradient(180deg, #f8c8d8 0%, #e8a0b8 40%, #d4849e 100%)"
          shadowColor="rgba(180,90,120,0.4)"
          onClick={goToTalents}
        />
        <SubMenuButton
          emoji="💫"
          label="相性診断"
          gradient="linear-gradient(180deg, #e0c8f8 0%, #c8a0e8 40%, #b084d4 100%)"
          shadowColor="rgba(140,80,180,0.4)"
          onClick={goToDiagnosis}
        />
        <SubMenuButton
          emoji="🏆"
          label="実績"
          gradient="linear-gradient(180deg, #f0d8a0 0%, #d4b870 40%, #c0a050 100%)"
          shadowColor="rgba(160,130,50,0.4)"
          onClick={goToAchievements}
        />
        <SubMenuButton
          emoji="?"
          label="案内"
          useText
          gradient="linear-gradient(180deg, #b8e6c8 0%, #7cc49a 40%, #5faa7e 100%)"
          shadowColor="rgba(60,140,90,0.4)"
          onClick={goToAbout}
        />
      </div>

      {/* DEVボタン（開発環境のみ） */}
      {import.meta.env.DEV && (
        <button
          className="absolute cursor-pointer"
          style={{
            top: '1cqmin',
            right: '1cqmin',
            fontSize: '2.5cqmin',
            background: 'rgba(0,0,0,0.5)',
            color: '#0f0',
            border: 'none',
            borderRadius: '1cqmin',
            padding: '0.5cqmin 1.5cqmin',
          }}
          onClick={goToDebug}
        >
          DEV
        </button>
      )}

      {/* 左下: 効果音トグル */}
      <button
        className="absolute cursor-pointer transition hover:brightness-110 active:scale-95"
        style={{
          left: '2cqmin',
          bottom: '1.5cqmin',
          fontSize: '3.5cqmin',
          background: 'none',
          border: 'none',
          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))',
          zIndex: 10,
        }}
        onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next) }}
      >
        {soundOn ? '🔊' : '🔇'}
      </button>

      {/* 免責テキスト */}
      <div
        className="absolute bottom-0 left-0 right-0 text-center text-gray-300"
        style={{
          fontSize: '2cqmin',
          filter: 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 1))',
        }}
      >
        ※このゲームは二次創作物であり非公式のものです
      </div>

      {/* タイムアタック確認ダイアログ */}
      {showTADialog && (
        <>
          {/* 画面全体を暗くするオーバーレイ（fixed で 4:3 外もカバー） */}
          <div
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}
            onClick={() => setShowTADialog(false)}
          />
          {/* ダイアログ本体（absolute で cqmin を維持） */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 51 }}
            onClick={() => setShowTADialog(false)}
          >
          <div
            className="flex flex-col items-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              borderRadius: '3cqmin',
              padding: '4cqmin 5cqmin',
              boxShadow: '0 0.5cqmin 3cqmin rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="font-bold"
              style={{ fontSize: '4.5cqmin', color: '#333', marginBottom: '1.5cqmin' }}
            >
              ⏱️ タイムアタック
            </span>
            <span
              style={{ fontSize: '3cqmin', color: '#666', marginBottom: '3cqmin', textAlign: 'center' }}
            >
              全100問に挑戦！
            </span>
            <div className="flex items-center" style={{ gap: '3cqmin' }}>
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
                onClick={() => setShowTADialog(false)}
              >
                やめる
              </button>
              <button
                className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
                style={{
                  fontSize: '3.5cqmin',
                  padding: '1.5cqmin 4cqmin',
                  borderRadius: '5cqmin',
                  border: 'none',
                  background: 'linear-gradient(180deg, #ffd700 0%, #ffb700 40%, #e6a000 100%)',
                  color: 'white',
                  boxShadow: '0 0.3cqmin 1cqmin rgba(200,150,0,0.4)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  opacity: isTAPreloading ? 0.5 : 1,
                }}
                disabled={isTAPreloading}
                onClick={handleTimeAttackStart}
              >
                {isTAPreloading ? '準備中...' : 'スタート！'}
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

function SubMenuButton({
  emoji,
  label,
  gradient,
  shadowColor,
  onClick,
  useText = false,
}: {
  emoji: string
  label: string
  gradient: string
  shadowColor: string
  onClick: () => void
  useText?: boolean
}) {
  return (
    <button
      className="flex flex-col items-center cursor-pointer transition hover:brightness-110 active:scale-95"
      style={{ background: 'none', border: 'none', padding: 0, position: 'relative' }}
      onClick={() => { playSound('tap'); onClick() }}
    >
      <div
        style={{
          width: '10cqmin',
          height: '10cqmin',
          borderRadius: '50%',
          background: gradient,
          border: '0.3cqmin solid rgba(255,255,255,0.6)',
          boxShadow: `inset 0 0.5cqmin 1cqmin rgba(255,255,255,0.4), 0 0.4cqmin 1cqmin ${shadowColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: useText ? '5cqmin' : '4cqmin',
          color: useText ? 'white' : undefined,
          textShadow: useText ? '0 1px 2px rgba(0,0,0,0.2)' : undefined,
        }}
      >
        {emoji}
      </div>
      <span
        className="font-bold"
        style={{
          position: 'absolute',
          bottom: '-1cqmin',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '2cqmin',
          color: 'white',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  )
}
