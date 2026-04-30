import { useState, useEffect, useRef } from 'react'
import { useGameStore, getPenaltySeconds } from '../../stores/gameStore.ts'
import { useSettingsStore } from '../../stores/settingsStore.ts'
import { QuizHeader } from '../../shared/components/QuizHeader.tsx'
import { NameGuessLayout } from '../../features/question-types/name-guess/NameGuessLayout.tsx'
import type { NameGuessQuestion } from '../../features/question-types/name-guess/types.ts'
import { FaceGuessLayout } from '../../features/question-types/face-guess/FaceGuessLayout.tsx'
import type { FaceGuessQuestion } from '../../features/question-types/face-guess/types.ts'
import { NameBuildLayout } from '../../features/question-types/name-build/NameBuildLayout.tsx'
import type { NameBuildQuestion } from '../../features/question-types/name-build/types.ts'
import { TextQuizLayout } from '../../features/question-types/text-quiz/TextQuizLayout.tsx'
import type { TextQuizQuestion } from '../../features/question-types/text-quiz/types.ts'
import { BlurLayout } from '../../features/question-types/blur/BlurLayout.tsx'
import type { BlurQuestion } from '../../features/question-types/blur/types.ts'
import { SpotlightLayout } from '../../features/question-types/spotlight/SpotlightLayout.tsx'
import type { SpotlightQuestion } from '../../features/question-types/spotlight/types.ts'
import { WordSearchLayout } from '../../features/question-types/word-search/WordSearchLayout.tsx'
import type { WordSearchQuestion } from '../../features/question-types/word-search/types.ts'
import { AnswerFeedbackLabel } from '../../shared/components/AnswerFeedbackLabel.tsx'
import { ConfettiCanvas } from '../../shared/components/ConfettiCanvas.tsx'
import { playSound } from '../../shared/utils/sound.ts'

export function QuizScreen() {
  const { questions, currentIndex, quizState, answerRecords, recordAnswer, nextQuestion, prevQuestion, isLastQuestion,
    timerStartedAt, startTimer, pauseTimer, resumeTimer, addPenalty } = useGameStore()
  const { goToResult, goToTitle, goToTimeAttackResult, isTimeAttack } = useSettingsStore()

  const [countdown, setCountdown] = useState(isTimeAttack ? 3 : 0)
  const [showQuitDialog, setShowQuitDialog] = useState(false)

  // ブラウザバックで確認ダイアログを表示
  const backRequestCount = useSettingsStore((s) => s.backRequestCount)
  const initialBackCount = useRef(backRequestCount)
  useEffect(() => {
    if (backRequestCount > initialBackCount.current) setShowQuitDialog(true)
  }, [backRequestCount])

  // カウントダウン（タイムアタック開始前）
  useEffect(() => {
    if (!isTimeAttack || countdown <= 0) return
    playSound('tap')
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [isTimeAttack, countdown])

  // カウントダウン完了後にタイマー開始
  useEffect(() => {
    if (isTimeAttack && countdown === 0 && timerStartedAt == null && currentIndex === 0 && quizState === 'answering') {
      playSound('start')
      startTimer()
    }
  }, [isTimeAttack, countdown, timerStartedAt, currentIndex, quizState, startTimer])

  const current = questions[currentIndex]
  if (!current) return null

  // カウントダウン中はオーバーレイ表示
  if (isTimeAttack && countdown > 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
        <CountdownRing key={countdown} value={countdown} />
      </div>
    )
  }

  const isAnswered = quizState === 'answered'
  const isTextQuiz = current.typeId === 'text-quiz'
  const canGoBack = !isTimeAttack && isTextQuiz && currentIndex > 0
  const lastRecord = answerRecords[currentIndex]

  const handleAnswer = (isCorrect: boolean, selectedIndex?: number) => {
    if (isTimeAttack) pauseTimer()
    recordAnswer(isCorrect, selectedIndex)
    if (isTimeAttack && !isCorrect) {
      addPenalty(getPenaltySeconds(current.typeId))
      playSound('penalty')
    } else {
      playSound(isCorrect ? 'correct' : 'incorrect')
    }
  }

  const handleNext = () => {
    if (isLastQuestion()) {
      if (isTimeAttack) {
        goToTimeAttackResult()
      } else {
        goToResult()
      }
    } else {
      if (isTimeAttack) resumeTimer()
      nextQuestion()
    }
  }

  const handleQuit = () => {
    setShowQuitDialog(true)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-hidden animate-fade-in">
      {/* 正解/不正解アニメーション表示（全問題タイプ共通） */}
      {isAnswered && lastRecord && (
        <>
          <AnswerFeedbackLabel
            key={currentIndex}
            isCorrect={lastRecord.isCorrect}
            isTimeAttack={isTimeAttack}
            penaltySeconds={getPenaltySeconds(current.typeId)}
          />
          {lastRecord.isCorrect && (
            <ConfettiCanvas key={`confetti-${currentIndex}`} triggerKey={currentIndex} />
          )}
        </>
      )}
      {/* 左下: やめるボタン */}
      <button
        className="font-bold cursor-pointer transition hover:brightness-110 active:scale-95"
        style={{
          position: 'absolute',
          left: '2cqmin',
          bottom: '2cqmin',
          fontSize: '2.5cqmin',
          padding: '1cqmin 2.5cqmin',
          borderRadius: '5cqmin',
          border: 'none',
          background: 'rgba(255,255,255,0.7)',
          color: '#666',
          zIndex: 20,
          boxShadow: '0 0.2cqmin 0.8cqmin rgba(0,0,0,0.1)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={() => { playSound('tap'); handleQuit() }}
      >
        やめる
      </button>

      {/* 共通ヘッダー（問題タイプ/問題文/難易度/進捗 + アシスタント） */}
      <QuizHeader
        isAnswered={isAnswered}
        isCorrect={!!lastRecord?.isCorrect}
      />

      {/* 問題タイプ別レイアウト */}
      {current.typeId === 'name-guess' && (
        <NameGuessLayout
          question={current as NameGuessQuestion}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
        />
      )}
      {current.typeId === 'face-guess' && (
        <FaceGuessLayout
          question={current as FaceGuessQuestion}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
        />
      )}
      {current.typeId === 'name-build' && (
        <NameBuildLayout
          question={current as NameBuildQuestion}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
        />
      )}
      {current.typeId === 'text-quiz' && (
        <TextQuizLayout
          question={current as TextQuizQuestion}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
          restoredSelectedIndex={answerRecords[currentIndex]?.selectedIndex}
        />
      )}
      {current.typeId === 'blur' && (
        <BlurLayout
          question={current as BlurQuestion}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
        />
      )}
      {current.typeId === 'spotlight' && (
        <SpotlightLayout
          question={current as SpotlightQuestion}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
        />
      )}
      {current.typeId === 'word-search' && (
        <WordSearchLayout
          question={current as WordSearchQuestion}
          isAnswered={isAnswered}
          onAnswer={handleAnswer}
        />
      )}

      {/* フッター: 戻る/次へボタン */}
      {(isAnswered || canGoBack) && (
        <div
          className="flex items-center"
          style={{
            position: 'absolute',
            bottom: '2cqmin',
            right: '3cqmin',
            gap: '3cqmin',
            zIndex: 20,
          }}
        >
          {canGoBack && (
            <button
              className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
              style={{
                fontSize: '3cqmin',
                padding: '1.2cqmin 3cqmin',
                borderRadius: '5cqmin',
                border: 'none',
                background: 'rgba(255,255,255,0.7)',
                color: '#777',
                boxShadow: '0 0.2cqmin 0.5cqmin rgba(0,0,0,0.1)',
              }}
              onClick={prevQuestion}
            >
              ← 前へ
            </button>
          )}
          {isAnswered && <button
            className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
            style={{
              fontSize: '4cqmin',
              padding: '1.5cqmin 6cqmin',
              borderRadius: '5cqmin',
              border: 'none',
              background: isTimeAttack
                ? 'linear-gradient(180deg, #ffd700 0%, #ffb700 40%, #e6a000 100%)'
                : 'linear-gradient(180deg, #fcc4dc 0%, #f49aba 40%, #e8789e 100%)',
              color: 'white',
              boxShadow:
                'inset 0 0.4cqmin 0.6cqmin rgba(255,255,255,0.3), 0 0.4cqmin 1cqmin rgba(0,0,0,0.15)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
            onClick={() => { playSound('tap'); handleNext() }}
          >
            {isLastQuestion() ? '結果を見る' : '次へ →'}
          </button>}
        </div>
      )}

      {/* クイズ中断確認ダイアログ */}
      {showQuitDialog && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}
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
          >
            <span className="font-bold" style={{ fontSize: '4cqmin', color: '#333', marginBottom: '3cqmin' }}>
              {isTimeAttack ? 'タイムアタックを中断しますか？' : 'クイズをやめますか？'}
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
                onClick={() => setShowQuitDialog(false)}
              >
                いいえ
              </button>
              <button
                className="font-bold cursor-pointer transition hover:brightness-105 active:scale-95"
                style={{
                  fontSize: '3.5cqmin',
                  padding: '1.5cqmin 4cqmin',
                  borderRadius: '5cqmin',
                  border: 'none',
                  background: 'rgba(239,68,68,0.9)',
                  color: 'white',
                }}
                onClick={goToTitle}
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** カウントダウンリングアニメーション */
function CountdownRing({ value }: { value: number }) {
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center" style={{ gap: '3cqmin' }}>
      <div style={{ width: '30cqmin', height: '30cqmin', position: 'relative' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="#ffd700" strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            style={{
              animation: 'countdown-ring 1s linear forwards',
            }}
          />
        </svg>
        <span
          className="font-bold"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15cqmin',
            color: 'white',
            textShadow: '0 0.3cqmin 1cqmin rgba(0,0,0,0.5)',
          }}
        >
          {value}
        </span>
      </div>
      <style>{`
        @keyframes countdown-ring {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: ${circumference}; }
        }
      `}</style>
    </div>
  )
}
